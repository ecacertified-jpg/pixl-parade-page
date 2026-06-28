import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Payload {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  birthday?: string; // YYYY-MM-DD
  event_page_id?: string;
}

const makeSlug = (firstName: string) => {
  const base = (firstName || 'page')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'page';
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 5);
  return `${base}-${suffix}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
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
    const organizer = userData.user;

    const body = (await req.json()) as Payload;
    if (!body?.first_name?.trim()) {
      return new Response(JSON.stringify({ error: 'first_name required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Create placeholder birthday_pages row owned by organizer (will be reassigned at claim).
    const year = new Date().getFullYear();
    const firstName = body.first_name.trim();
    let pageId: string | null = null;
    let slug: string | null = null;
    for (let i = 0; i < 3; i++) {
      const s = makeSlug(firstName);
      const { data: page, error } = await admin
        .from('birthday_pages')
        .insert({
          user_id: organizer.id,
          slug: s,
          celebration_year: year,
          title: `${firstName} fête son anniversaire 🎂`,
          is_active: true,
          published_at: new Date().toISOString(),
        } as any)
        .select('id, slug')
        .single();
      if (!error && page) {
        pageId = page.id;
        slug = page.slug;
        break;
      }
      if (error && !`${error.message}`.toLowerCase().includes('unique')) {
        console.error('birthday_pages insert error', error);
        break;
      }
    }

    const { data: client, error: clientErr } = await admin
      .from('client_accounts')
      .insert({
        organizer_user_id: organizer.id,
        event_page_id: body.event_page_id ?? null,
        first_name: firstName,
        last_name: body.last_name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        birthday: body.birthday ?? null,
        birthday_page_id: pageId,
        birthday_page_slug: slug,
      })
      .select('id, claim_token')
      .single();

    if (clientErr || !client) {
      console.error('client_accounts insert error', clientErr);
      return new Response(JSON.stringify({ error: 'Failed to create client' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const origin =
      req.headers.get('origin') ||
      req.headers.get('referer')?.replace(/\/$/, '') ||
      'https://joiedevivre-africa.com';
    const claimUrl = `${origin}/auth?tab=signup&claim=${client.claim_token}&intent=express_birthday`;
    const shareMessage = `Salut ${firstName} ! J'ai préparé ta page d'anniversaire sur JOIE DE VIVRE 🎂\nFinalise ton inscription ici : ${claimUrl}`;

    return new Response(
      JSON.stringify({
        id: client.id,
        claim_token: client.claim_token,
        claim_url: claimUrl,
        share_message: shareMessage,
        birthday_page_slug: slug,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('create-client-account error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});