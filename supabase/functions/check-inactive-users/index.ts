import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIER1_DAYS = 7;
const TIER2_DAYS = 14;
const COOLDOWN_DAYS = 7;

const tier1Messages = [
  {
    title: "Tu nous manques ! 💜",
    body: "Tes proches ont peut-être des anniversaires à venir. Reviens voir ce qui se passe sur Joie de Vivre !",
    variant: "miss_you",
  },
  {
    title: "🎁 Des cadeaux attendent !",
    body: "Ne rate pas les célébrations de tes amis. Connecte-toi pour découvrir les événements à venir !",
    variant: "gifts_waiting",
  },
  {
    title: "🎂 Anniversaire en approche ?",
    body: "Vérifie les dates importantes de tes proches et prépare une surprise inoubliable !",
    variant: "birthday_coming",
  },
  {
    title: "🌟 Joie de Vivre t'attend",
    body: "La communauté grandit ! Reviens célébrer les moments heureux avec tes proches.",
    variant: "community_growing",
  },
  {
    title: "💝 Tes amis ont besoin de toi",
    body: "Des cagnottes sont en cours pour tes proches. Viens participer et faire la différence !",
    variant: "friends_need_you",
  },
  {
    title: "🎉 Quoi de neuf ?",
    body: "De nouvelles boutiques et idées cadeaux t'attendent. Viens les découvrir !",
    variant: "whats_new",
  },
];

const tier2Messages = [
  {
    title: "⚡ Dernière chance ! Offre -20%",
    body: "Tu nous manques énormément ! Profite de -20% sur ta première cagnotte. Offre limitée, reviens vite !",
    variant: "urgent_discount",
  },
  {
    title: "🚨 Tes amis célèbrent sans toi !",
    body: "Plusieurs événements ont eu lieu sans toi... Reviens avec un bonus exclusif pour te rattraper !",
    variant: "urgent_fomo",
  },
  {
    title: "🎁 Offre spéciale : cagnotte gratuite",
    body: "Crée ta prochaine cagnotte sans frais cette semaine ! Une occasion unique de faire plaisir.",
    variant: "urgent_free_fund",
  },
  {
    title: "💎 Cadeau VIP pour ton retour",
    body: "On t'a réservé un avantage exclusif. Connecte-toi maintenant pour le découvrir avant qu'il expire !",
    variant: "urgent_vip_gift",
  },
  {
    title: "🔥 Ne perds pas tes connexions",
    body: "Tes proches comptent sur toi ! Reviens et bénéficie d'un bonus spécial sur ta prochaine contribution.",
    variant: "urgent_connections",
  },
  {
    title: "⏰ Offre exclusive expire bientôt",
    body: "Badge spécial + réduction exclusive t'attendent, mais seulement pour quelques jours. Reviens sur JDV !",
    variant: "urgent_expiring",
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function determineTier(daysSinceActive: number): number | null {
  if (daysSinceActive >= TIER2_DAYS) return 2;
  if (daysSinceActive >= TIER1_DAYS) return 1;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Recherche des utilisateurs inactifs (paliers 7j et 14j)...');

    const cutoffTier1 = new Date();
    cutoffTier1.setDate(cutoffTier1.getDate() - TIER1_DAYS);

    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);
    const cooldownISO = cooldownDate.toISOString();

    // Get all users with active push subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id')
      .eq('is_active', true);

    if (subsError || !subscriptions?.length) {
      console.log('ℹ️ Aucun abonnement push actif trouvé');
      return new Response(
        JSON.stringify({ message: 'No active push subscriptions', notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uniqueUserIds = [...new Set(subscriptions.map(s => s.user_id))];
    const usersToNotify: Array<{ user_id: string; days_inactive: number; tier: number }> = [];

    for (const userId of uniqueUserIds) {
      // Check suspension
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_suspended')
        .eq('user_id', userId)
        .single();

      if (profile?.is_suspended) continue;

      // Last session
      const { data: lastSession } = await supabaseAdmin
        .from('user_session_logs')
        .select('last_active_at')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastSession?.last_active_at) continue;

      const lastActive = new Date(lastSession.last_active_at);
      const daysSinceActive = Math.floor(
        (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      const tier = determineTier(daysSinceActive);
      if (!tier) continue;

      // Check cooldown for this specific tier
      const { data: recentNotif } = await supabaseAdmin
        .from('inactive_user_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('tier', tier)
        .gte('sent_at', cooldownISO)
        .limit(1)
        .single();

      if (recentNotif) continue;

      usersToNotify.push({ user_id: userId, days_inactive: daysSinceActive, tier });
    }

    console.log(`📋 ${usersToNotify.length} utilisateurs à notifier (${usersToNotify.filter(u => u.tier === 1).length} tier1, ${usersToNotify.filter(u => u.tier === 2).length} tier2)`);

    let pushSent = 0;
    let pushFailed = 0;
    let inAppCreated = 0;

    for (const user of usersToNotify) {
      const msg = user.tier === 2 ? pickRandom(tier2Messages) : pickRandom(tier1Messages);
      const hasSpecialOffer = user.tier === 2;

      // Send push
      const { data: subs } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('is_active', true);

      if (subs && subs.length > 0) {
        const pushPayload = JSON.stringify({
          title: msg.title,
          body: msg.body,
          message: msg.body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `reengagement-t${user.tier}-${user.user_id}-${Date.now()}`,
          type: 'reengagement',
          data: {
            type: 'reengagement',
            url: '/dashboard',
            days_inactive: user.days_inactive,
            tier: user.tier,
            has_special_offer: hasSpecialOffer,
            timestamp: Date.now(),
          },
        });

        for (const sub of subs) {
          const result = await sendWebPushNotification(
            sub, pushPayload, vapidPublicKey, vapidPrivateKey, `mailto:${vapidEmail}`
          );

          if (result.success) {
            pushSent++;
          } else {
            pushFailed++;
            if (result.error === 'subscription_expired') {
              await supabaseAdmin.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
            }
          }
        }
      }

      // In-app notification
      await supabaseAdmin.from('notifications').insert({
        user_id: user.user_id,
        title: msg.title,
        message: msg.body,
        type: 'reengagement',
        action_url: '/dashboard',
        is_read: false,
        is_archived: false,
        metadata: {
          days_inactive: user.days_inactive,
          variant: msg.variant,
          tier: user.tier,
          has_special_offer: hasSpecialOffer,
        },
      });
      inAppCreated++;

      // Log
      await supabaseAdmin.from('inactive_user_notifications').insert({
        user_id: user.user_id,
        days_inactive: user.days_inactive,
        notification_type: 'push',
        message_variant: msg.variant,
        tier: user.tier,
      });
    }

    const summary = {
      users_found: usersToNotify.length,
      tier1_count: usersToNotify.filter(u => u.tier === 1).length,
      tier2_count: usersToNotify.filter(u => u.tier === 2).length,
      push_sent: pushSent,
      push_failed: pushFailed,
      in_app_created: inAppCreated,
    };

    console.log('📊 Résumé:', JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in check-inactive-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
