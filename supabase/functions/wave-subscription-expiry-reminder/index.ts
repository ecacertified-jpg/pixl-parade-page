import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWhatsApp } from '../_shared/sms-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = Deno.env.get('APP_URL') || 'https://joiedevivre-africa.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Window: 3 days, 1 day. Look up active wave subscriptions with current_period_end inside [now, now+3d]
    const now = new Date();
    const in3d = new Date(now.getTime() + 3 * 86400000);

    const { data: subs, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, user_id, plan_tier, current_period_end, metadata')
      .eq('provider', 'wave')
      .eq('status', 'active')
      .lte('current_period_end', in3d.toISOString())
      .gte('current_period_end', now.toISOString());

    if (error) throw new Error(error.message);

    let sent = 0;
    for (const sub of subs ?? []) {
      const end = new Date(sub.current_period_end!);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      let bucket: 'j3' | 'j1' | null = null;
      if (daysLeft === 3) bucket = 'j3';
      else if (daysLeft === 1) bucket = 'j1';
      if (!bucket) continue;

      // Idempotency: skip if reminder already sent today for this bucket
      const meta = (sub.metadata as any) || {};
      const reminders = meta.reminders || {};
      const todayKey = now.toISOString().slice(0, 10);
      if (reminders[bucket] === todayKey) continue;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('phone, first_name')
        .eq('user_id', sub.user_id)
        .maybeSingle();

      if (!profile?.phone) continue;

      const name = profile.first_name ? `${profile.first_name}, ` : '';
      const link = `${APP_URL}/pricing`;
      const msg =
        bucket === 'j3'
          ? `${name}ton abonnement JDV ${sub.plan_tier} expire dans 3 jours. Renouvelle avec Wave pour ne rien perdre : ${link}`
          : `⏰ ${name}plus que 24h ! Renouvelle ton abonnement JDV ${sub.plan_tier} : ${link}`;

      const result = await sendWhatsApp(profile.phone, msg);
      if (result.success) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            metadata: {
              ...meta,
              reminders: { ...reminders, [bucket]: todayKey },
            },
          })
          .eq('id', sub.id);

        await supabaseAdmin.from('subscription_events').insert({
          user_id: sub.user_id,
          subscription_id: sub.id,
          event_type: bucket === 'j3' ? 'reminder_j3' : 'reminder_j1',
          provider: 'wave',
          source: 'cron',
          metadata: { bucket },
        });
        sent++;
      }
    }

    return new Response(JSON.stringify({ success: true, scanned: subs?.length ?? 0, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('wave-subscription-expiry-reminder error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});