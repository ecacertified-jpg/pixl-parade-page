import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const fundId = String(body?.fund_id || '');
    const beneficiaryUserId = String(body?.beneficiary_user_id || '');
    if (!fundId || !beneficiaryUserId) {
      return new Response(JSON.stringify({ error: 'fund_id and beneficiary_user_id are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify fund ownership and that it targets the beneficiary
    const { data: fund, error: fundErr } = await supabase
      .from('collective_funds')
      .select('id, creator_id, status')
      .eq('id', fundId)
      .maybeSingle();

    if (fundErr || !fund) {
      return new Response(JSON.stringify({ error: 'Fund not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (fund.creator_id !== callerId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentYear = new Date().getFullYear();
    const { data: page, error: pageErr } = await supabase
      .from('birthday_pages')
      .select('id, fund_id')
      .eq('user_id', beneficiaryUserId)
      .eq('celebration_year', currentYear)
      .eq('is_active', true)
      .maybeSingle();

    if (pageErr || !page) {
      return new Response(JSON.stringify({ linked: false, reason: 'no_active_page' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (page.fund_id) {
      // Already has a fund linked — do not overwrite
      return new Response(JSON.stringify({ linked: false, reason: 'already_linked', existing_fund_id: page.fund_id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updErr } = await supabase
      .from('birthday_pages')
      .update({ fund_id: fundId })
      .eq('id', page.id);

    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ linked: true, page_id: page.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});