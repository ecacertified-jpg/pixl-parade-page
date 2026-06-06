import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWhatsApp } from '../_shared/sms-sender.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    const { data: admin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!admin) throw new Error('Forbidden: admin only');

    const body = await req.json().catch(() => ({}));
    const request_id = String(body?.request_id || '');
    const reason = String(body?.reason || '').trim();
    if (!request_id) throw new Error('request_id is required');
    if (!reason || reason.length < 3) throw new Error('reason is required');

    const { error: rpcErr } = await supabaseAdmin.rpc('process_wave_rejection', {
      _request_id: request_id,
      _admin_user_id: user.id,
      _reason: reason,
    });
    if (rpcErr) throw new Error(rpcErr.message);

    // Best-effort WhatsApp notification
    try {
      const { data: request } = await supabaseAdmin
        .from('wave_subscription_requests')
        .select('user_id, plan_tier')
        .eq('id', request_id)
        .single();
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('phone, first_name')
        .eq('user_id', request?.user_id)
        .maybeSingle();
      if (profile?.phone) {
        const name = profile.first_name ? `${profile.first_name}, ` : '';
        const msg = `${name}ta demande d'abonnement JDV (${request?.plan_tier}) n'a pas pu être validée : ${reason}. Réessaie ou contacte le support.`;
        await sendWhatsApp(profile.phone, msg);
      }
    } catch (_) { /* noop */ }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('reject-wave-subscription error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});