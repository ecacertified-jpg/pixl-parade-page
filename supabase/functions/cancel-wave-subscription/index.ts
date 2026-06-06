import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const body = await req.json().catch(() => ({}));
    const request_id = String(body?.request_id || '');
    if (!request_id) throw new Error('request_id is required');

    const { data: request, error: getErr } = await supabaseAdmin
      .from('wave_subscription_requests')
      .select('id, user_id, status')
      .eq('id', request_id)
      .single();
    if (getErr || !request) throw new Error('Request not found');

    if (request.user_id !== user.id) throw new Error('Forbidden');
    if (request.status !== 'pending') throw new Error('Only pending requests can be canceled');

    const { error: updErr } = await supabaseAdmin
      .from('wave_subscription_requests')
      .update({ status: 'expired', reviewer_notes: 'Canceled by user' })
      .eq('id', request_id);
    if (updErr) throw new Error('Failed to cancel: ' + updErr.message);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('cancel-wave-subscription error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});