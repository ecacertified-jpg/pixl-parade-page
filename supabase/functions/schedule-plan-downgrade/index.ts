import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TIER_ORDER: Record<string, number> = { free: 0, essentiel: 1, premium: 2 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) throw new Error('Unauthorized');

    const body = await req.json().catch(() => ({}));
    const target_tier = String(body?.target_tier || '').toLowerCase();
    if (!['free', 'essentiel'].includes(target_tier)) {
      throw new Error('Invalid target_tier (free or essentiel)');
    }

    const { data: sub, error: subErr } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, plan_tier, status, current_period_end, metadata')
      .eq('user_id', user.id)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!sub || sub.status !== 'active') throw new Error('No active subscription to downgrade');

    if (TIER_ORDER[target_tier] >= TIER_ORDER[sub.plan_tier]) {
      throw new Error('Target tier must be lower than current tier');
    }

    const meta = (sub.metadata as any) || {};
    const { error: updErr } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        metadata: { ...meta, pending_downgrade_tier: target_tier, downgrade_scheduled_at: new Date().toISOString() },
      })
      .eq('id', sub.id);
    if (updErr) throw updErr;

    await supabaseAdmin.from('subscription_events').insert({
      user_id: user.id,
      subscription_id: sub.id,
      event_type: 'downgrade_scheduled',
      from_plan: sub.plan_tier,
      to_plan: target_tier,
      provider: 'wave',
      source: 'user',
      metadata: { current_period_end: sub.current_period_end },
    });

    return new Response(JSON.stringify({
      success: true,
      effective_at: sub.current_period_end,
      target_tier,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('schedule-plan-downgrade error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});