import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);
    const { data: { user }, error: authErr } = await admin.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: isAdmin } = await admin
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!isAdmin) return json({ error: 'Forbidden: admin only' }, 403);

    const body = await req.json().catch(() => ({}));
    const order_id = String(body?.order_id || '');
    const action = (body?.action || 'activate') as 'activate' | 'cancel' | 'refund';
    const wave_reference = body?.wave_reference ?? null;
    if (!order_id) return json({ error: 'order_id is required' }, 400);

    const { data: order, error: orderErr } = await admin
      .from('celebration_premium_orders')
      .select('*')
      .eq('id', order_id)
      .maybeSingle();
    if (orderErr || !order) return json({ error: 'Order not found' }, 404);

    if (action === 'cancel' || action === 'refund') {
      const { error: updErr } = await admin
        .from('celebration_premium_orders')
        .update({
          status: action === 'refund' ? 'refunded' : 'cancelled',
          wave_reference,
        })
        .eq('id', order_id);
      if (updErr) return json({ error: updErr.message }, 500);
      return json({ ok: true, status: action === 'refund' ? 'refunded' : 'cancelled' });
    }

    // ACTIVATE — apply side-effects per kind
    const now = new Date();

    if (order.kind === 'boost' && order.post_id) {
      const hours = Number(order.duration_hours || 24);
      const expires = new Date(now.getTime() + hours * 3600 * 1000).toISOString();
      const { error } = await admin
        .from('celebration_posts')
        .update({ boost_expires_at: expires })
        .eq('id', order.post_id);
      if (error) return json({ error: `boost update failed: ${error.message}` }, 500);
    }

    if (order.kind === 'vip_badge') {
      const days = Number(
        (order.metadata as any)?.days ||
          Math.round((Number(order.duration_hours) || 24 * 30) / 24),
      );
      const newExpiry = new Date(now.getTime() + days * 86400 * 1000).toISOString();
      const { data: existing } = await admin
        .from('celebration_vip_subscriptions')
        .select('id, expires_at')
        .eq('user_id', order.user_id)
        .maybeSingle();
      if (existing) {
        const base =
          existing.expires_at && new Date(existing.expires_at) > now
            ? new Date(existing.expires_at)
            : now;
        const extended = new Date(base.getTime() + days * 86400 * 1000).toISOString();
        await admin
          .from('celebration_vip_subscriptions')
          .update({ expires_at: extended, tier: 'gold' })
          .eq('id', existing.id);
      } else {
        await admin.from('celebration_vip_subscriptions').insert({
          user_id: order.user_id,
          tier: 'gold',
          expires_at: newExpiry,
        });
      }
    }

    if (order.kind === 'premium_card' && order.post_id) {
      const tplId = (order.metadata as any)?.card_template_id;
      if (tplId) {
        await admin
          .from('celebration_posts')
          .update({ card_template_id: tplId })
          .eq('id', order.post_id);
      }
    }

    const { error: updErr } = await admin
      .from('celebration_premium_orders')
      .update({
        status: 'activated',
        activated_at: now.toISOString(),
        wave_reference,
      })
      .eq('id', order_id);
    if (updErr) return json({ error: updErr.message }, 500);

    return json({ ok: true, status: 'activated' });
  } catch (e: any) {
    console.error('activate-celebration-premium-order error', e);
    return json({ error: e?.message || 'Server error' }, 500);
  }
});