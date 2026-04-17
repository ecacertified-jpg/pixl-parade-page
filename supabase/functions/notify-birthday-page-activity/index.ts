import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendWhatsAppTemplate } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ActionType = 'photo' | 'video' | 'memory' | 'gift_promise' | 'contribution';

const ACTION_LABELS: Record<ActionType, (amount?: number, currency?: string) => string> = {
  photo: () => 'ajouter une photo 📸',
  video: () => 'ajouter une vidéo 🎥',
  memory: () => 'écrire un souvenir ✍️',
  gift_promise: () => 'promettre un cadeau 🎁',
  contribution: (amount, currency) =>
    amount && currency ? `contribuer ${amount.toLocaleString('fr-FR')} ${currency} 💜` : 'contribuer à ta cagnotte 💜',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims } = await userClient.auth.getClaims(token);
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = claims.claims.sub;

    const body = await req.json();
    const {
      birthdayPageId,
      actorUserId,
      actionType,
      amount,
      currency,
    }: {
      birthdayPageId: string;
      actorUserId: string;
      actionType: ActionType;
      amount?: number;
      currency?: string;
    } = body;

    if (!birthdayPageId || !actorUserId || !actionType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (callerUserId !== actorUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden — actor mismatch' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load page + celebrated user
    const { data: page, error: pageErr } = await supabase
      .from('birthday_pages')
      .select('id, slug, user_id')
      .eq('id', birthdayPageId)
      .maybeSingle();

    if (pageErr || !page) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Self-action guard
    if (page.user_id === actorUserId) {
      return new Response(JSON.stringify({ skipped: 'self_action' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Anti-spam: dedup within 1h on (page, actor, action_type)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('birthday_page_activity_notifs')
      .select('id')
      .eq('birthday_page_id', birthdayPageId)
      .eq('actor_user_id', actorUserId)
      .eq('action_type', actionType)
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ skipped: 'rate_limited' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load celebrated profile
    const { data: celebrated } = await supabase
      .from('profiles')
      .select('first_name, phone, user_id')
      .eq('user_id', page.user_id)
      .maybeSingle();

    // Load actor profile
    const { data: actor } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', actorUserId)
      .maybeSingle();

    const celebratedFirstName = celebrated?.first_name || 'Toi';
    const actorFirstName = actor?.first_name || 'Un(e) ami(e)';
    const actionLabel = ACTION_LABELS[actionType](amount, currency || 'XOF');

    // Record dedup row first (fail-soft)
    await supabase.from('birthday_page_activity_notifs').insert({
      birthday_page_id: birthdayPageId,
      actor_user_id: actorUserId,
      action_type: actionType,
    });

    // In-app notification
    await supabase.from('scheduled_notifications').insert({
      user_id: page.user_id,
      notification_type: 'birthday_page_activity',
      title: `🎉 ${actorFirstName} sur ta page d'anniversaire !`,
      message: `${actorFirstName} vient de ${actionLabel}. Va le/la remercier !`,
      priority_score: 85,
      scheduled_for: new Date().toISOString(),
      delivery_methods: ['in_app'],
      metadata: {
        page_slug: page.slug,
        actor_user_id: actorUserId,
        action_type: actionType,
        amount: amount ?? null,
      },
    });

    // WhatsApp template
    let waResult: { success: boolean; error?: string } = { success: false };
    if (celebrated?.phone) {
      try {
        waResult = await sendWhatsAppTemplate(
          celebrated.phone,
          'joiedevivre_birthday_page_activity',
          'fr',
          [celebratedFirstName, actorFirstName, actionLabel],
          [page.slug],
        );
      } catch (waErr) {
        console.warn('[BPN-Activity] WhatsApp send failed:', waErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, whatsapp: waResult.success, action: actionType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[notify-birthday-page-activity] error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
