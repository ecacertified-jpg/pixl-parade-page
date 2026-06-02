import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ success: false, error: 'Non authentifié' }, 401);
    }
    const jwt = authHeader.replace('Bearer ', '');

    const supaUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supaUser.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return json({ success: false, error: 'Session invalide' }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? '').trim();
    if (!token || token.length > 128) {
      return json({ success: false, error: 'Token invalide' }, 400);
    }

    // Service role for trusted lookup & update (token is the auth proof)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: invite, error: findErr } = await admin
      .from('event_organizers')
      .select('id, page_type, page_id, status')
      .eq('invite_token', token)
      .maybeSingle();

    if (findErr || !invite) {
      return json({ success: false, error: 'Invitation introuvable' }, 404);
    }
    if (invite.status === 'revoked') {
      return json({ success: false, error: 'Invitation révoquée' }, 410);
    }

    // Link to current user and accept
    const { error: updErr } = await admin
      .from('event_organizers')
      .update({
        user_id: userId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);
    if (updErr) {
      return json({ success: false, error: 'Acceptation impossible' }, 500);
    }

    // Resolve slug for redirect
    const table = invite.page_type === 'birthday' ? 'birthday_pages' : 'event_pages';
    const { data: page } = await admin.from(table).select('slug').eq('id', invite.page_id).maybeSingle();

    return json({
      success: true,
      page_type: invite.page_type,
      slug: (page as any)?.slug ?? null,
    });
  } catch (e) {
    console.error('[accept-organizer-invite] error', e);
    return json({ success: false, error: 'Erreur serveur' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}