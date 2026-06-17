import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWhatsApp } from '../_shared/sms-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = Deno.env.get('APP_URL') || 'https://joiedevivre-africa.com';
const WAVE_MERCHANT_URL = 'https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);

    const { data: subs, error } = await sb
      .from('user_subscriptions')
      .select('id, user_id, plan_tier, billing_cycle, current_period_end, cancel_at_period_end, metadata')
      .eq('provider', 'wave')
      .eq('status', 'active')
      .eq('cancel_at_period_end', false)
      .lte('current_period_end', in24h.toISOString())
      .gte('current_period_end', now.toISOString());
    if (error) throw error;

    let created = 0;
    for (const sub of subs ?? []) {
      const meta = (sub.metadata as any) || {};
      const todayKey = now.toISOString().slice(0, 10);
      if (meta.auto_renew_attempted === todayKey) continue;

      const { data: pending } = await sb
        .from('wave_subscription_requests')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('status', 'pending')
        .maybeSingle();
      if (pending) continue;

      const { data: plan } = await sb
        .from('subscription_plans')
        .select('price_xof_monthly, price_xof_yearly, name')
        .eq('tier', sub.plan_tier)
        .single();
      if (!plan) continue;
      const amount_xof = Number(sub.billing_cycle === 'yearly' ? plan.price_xof_yearly : plan.price_xof_monthly);
      if (!amount_xof || amount_xof <= 0) continue;

      const wave_link = `${WAVE_MERCHANT_URL}?amount=${amount_xof}`;
      const { data: request, error: insErr } = await sb
        .from('wave_subscription_requests')
        .insert({
          user_id: sub.user_id,
          plan_tier: sub.plan_tier,
          billing_cycle: sub.billing_cycle,
          amount_xof,
          wave_link,
          status: 'pending',
        })
        .select('id')
        .single();
      if (insErr) { console.warn('insert request failed:', insErr.message); continue; }

      await sb
        .from('user_subscriptions')
        .update({ metadata: { ...meta, auto_renew_attempted: todayKey, auto_renew_request_id: request.id } })
        .eq('id', sub.id);

      const { data: profile } = await sb
        .from('profiles')
        .select('phone, first_name')
        .eq('user_id', sub.user_id)
        .maybeSingle();
      if (profile?.phone) {
        const name = profile.first_name ? `${profile.first_name}, ` : '';
        const msg = `🔁 ${name}ton abonnement JDV ${plan.name} expire demain. Renouvelle en un clic via Wave : ${APP_URL}/subscription`;
        await sendWhatsApp(profile.phone, msg);
      }

      await sb.from('subscription_events').insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        event_type: 'auto_renew_attempted',
        from_plan: sub.plan_tier,
        to_plan: sub.plan_tier,
        provider: 'wave',
        source: 'cron',
        metadata: { wave_request_id: request.id, amount_xof },
      });
      created++;
    }

    return new Response(JSON.stringify({ success: true, scanned: subs?.length || 0, created }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('wave-subscription-auto-renew error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});