import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INACTIVITY_DAYS = 7;
const COOLDOWN_DAYS = 7; // Ne pas re-notifier avant 7 jours

const reengagementMessages = [
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

    console.log(`🔍 Recherche des utilisateurs inactifs depuis ${INACTIVITY_DAYS}+ jours...`);

    // Trouver les utilisateurs inactifs : dernière session > 7 jours
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);
    const cooldownISO = cooldownDate.toISOString();

    // Récupérer les dernières sessions par utilisateur
    const { data: inactiveUsers, error: queryError } = await supabaseAdmin
      .rpc('get_inactive_users_for_notification', {
        cutoff_date: cutoffISO,
        cooldown_date: cooldownISO,
      });

    // Si la RPC n'existe pas, fallback avec requête directe
    let usersToNotify: Array<{ user_id: string; last_active: string }> = [];

    if (queryError) {
      console.log('⚠️ RPC not found, using direct query fallback');

      // Requête directe : utilisateurs avec push_subscriptions actives
      // dont la dernière session est > 7 jours
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

      // Vérifier la dernière activité de chaque utilisateur
      for (const userId of uniqueUserIds) {
        // Vérifier si l'utilisateur est suspendu
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('is_suspended')
          .eq('user_id', userId)
          .single();

        if (profile?.is_suspended) continue;

        // Dernière session
        const { data: lastSession } = await supabaseAdmin
          .from('user_session_logs')
          .select('last_active_at')
          .eq('user_id', userId)
          .order('last_active_at', { ascending: false })
          .limit(1)
          .single();

        if (!lastSession?.last_active_at) continue;

        const lastActive = new Date(lastSession.last_active_at);
        if (lastActive >= cutoffDate) continue; // Encore actif

        // Vérifier cooldown
        const { data: recentNotif } = await supabaseAdmin
          .from('inactive_user_notifications')
          .select('id')
          .eq('user_id', userId)
          .gte('sent_at', cooldownISO)
          .limit(1)
          .single();

        if (recentNotif) continue; // Déjà notifié récemment

        const daysSinceActive = Math.floor(
          (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        );

        usersToNotify.push({ user_id: userId, last_active: lastSession.last_active_at });
      }
    } else {
      usersToNotify = inactiveUsers || [];
    }

    console.log(`📋 ${usersToNotify.length} utilisateurs inactifs à notifier`);

    let pushSent = 0;
    let pushFailed = 0;
    let inAppCreated = 0;

    for (const user of usersToNotify) {
      // Choisir un message aléatoire
      const msg = reengagementMessages[Math.floor(Math.random() * reengagementMessages.length)];

      const daysSinceActive = Math.floor(
        (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Envoyer push via web-push directement
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
          tag: `reengagement-${user.user_id}-${Date.now()}`,
          type: 'reengagement',
          data: {
            type: 'reengagement',
            url: '/dashboard',
            days_inactive: daysSinceActive,
            timestamp: Date.now(),
          },
        });

        for (const sub of subs) {
          const result = await sendWebPushNotification(
            sub,
            pushPayload,
            vapidPublicKey,
            vapidPrivateKey,
            `mailto:${vapidEmail}`
          );

          if (result.success) {
            pushSent++;
          } else {
            pushFailed++;
            // Désactiver les souscriptions expirées
            if (result.error === 'subscription_expired') {
              await supabaseAdmin
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', sub.id);
            }
          }
        }
      }

      // Créer notification in-app
      await supabaseAdmin.from('notifications').insert({
        user_id: user.user_id,
        title: msg.title,
        message: msg.body,
        type: 'reengagement',
        action_url: '/dashboard',
        is_read: false,
        is_archived: false,
        metadata: { days_inactive: daysSinceActive, variant: msg.variant },
      });
      inAppCreated++;

      // Logger dans inactive_user_notifications
      await supabaseAdmin.from('inactive_user_notifications').insert({
        user_id: user.user_id,
        days_inactive: daysSinceActive,
        notification_type: 'push',
        message_variant: msg.variant,
      });
    }

    const summary = {
      users_found: usersToNotify.length,
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
