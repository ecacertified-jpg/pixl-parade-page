import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = userData.user;

    const { claim_token } = await req.json();
    if (!claim_token) {
      return new Response(JSON.stringify({ error: 'claim_token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: client, error: cErr } = await admin
      .from('client_accounts')
      .select('*')
      .eq('claim_token', claim_token)
      .maybeSingle();
    if (cErr || !client) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Idempotency: already claimed by someone else
    if (client.created_user_id && client.created_user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Already claimed' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Transfer birthday page ownership
    let slug: string | null = null;
    if (client.birthday_page_id) {
      const { data: page } = await admin
        .from('birthday_pages')
        .update({ user_id: user.id })
        .eq('id', client.birthday_page_id)
        .select('slug')
        .maybeSingle();
      slug = page?.slug ?? null;
    }

    // Mark claim
    if (!client.created_user_id) {
      await admin
        .from('client_accounts')
        .update({ created_user_id: user.id, claimed_at: new Date().toISOString() })
        .eq('id', client.id);
    }

    // Grant organizer admin rights (idempotent)
    await admin
      .from('client_admins')
      .upsert(
        {
          client_user_id: user.id,
          admin_user_id: client.organizer_user_id,
          revoked_at: null,
        },
        { onConflict: 'client_user_id,admin_user_id' }
      );

    return new Response(JSON.stringify({ ok: true, slug }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('claim-client-account error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});