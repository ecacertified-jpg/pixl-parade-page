import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALID_TIERS = new Set(['essentiel', 'premium']);
const VALID_CYCLES = new Set(['monthly', 'yearly']);

const WAVE_MERCHANT_URL = 'https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/';

function buildWaveLink(amountXof: number): string {
  return `${WAVE_MERCHANT_URL}?amount=${amountXof}`;
}

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
    const plan_tier = String(body?.plan_tier || '').toLowerCase();
    const billing_cycle = String(body?.billing_cycle || 'monthly').toLowerCase();

    if (!VALID_TIERS.has(plan_tier)) throw new Error('Invalid plan_tier');
    if (!VALID_CYCLES.has(billing_cycle)) throw new Error('Invalid billing_cycle');

    // Block if user already has a pending request
    const { data: pending } = await supabaseAdmin
      .from('wave_subscription_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (pending) {
      return new Response(
        JSON.stringify({ error: 'A pending request already exists', request_id: pending.id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Load price from plan catalog
    const { data: plan, error: planErr } = await supabaseAdmin
      .from('subscription_plans')
      .select('price_xof_monthly, price_xof_yearly, name')
      .eq('tier', plan_tier)
      .single();
    if (planErr || !plan) throw new Error('Plan not found');

    const amount_xof = Number(
      billing_cycle === 'yearly' ? plan.price_xof_yearly : plan.price_xof_monthly,
    );
    if (!amount_xof || amount_xof <= 0) throw new Error('Invalid plan amount');

    // Platform Wave merchant link (fixed). platform_wave_phone is kept for
    // internal payout/reference purposes only.
    const { data: setting } = await supabaseAdmin
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', 'platform_wave_phone')
      .single();
    const platformWavePhone: string =
      (setting?.setting_value as any)?.value || '+2250707467445';

    const wave_link = buildWaveLink(amount_xof);

    const { data: request, error: insertErr } = await supabaseAdmin
      .from('wave_subscription_requests')
      .insert({
        user_id: user.id,
        plan_tier,
        billing_cycle,
        amount_xof,
        wave_link,
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr) throw new Error('Failed to create request: ' + insertErr.message);

    // Notify admins (best-effort, ignore failures)
    try {
      await supabaseAdmin.functions.invoke('notify-admin-wave-request', {
        body: { request_id: request.id },
      });
    } catch (_) { /* noop */ }

    return new Response(
      JSON.stringify({
        success: true,
        request_id: request.id,
        wave_link,
        wave_recipient: platformWavePhone,
        amount_xof,
        plan_tier,
        plan_name: plan.name,
        billing_cycle,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('create-wave-subscription error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});