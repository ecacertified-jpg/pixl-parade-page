import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { AccessToken } from 'npm:livekit-server-sdk@2';
import { z } from 'npm:zod@3';

const BodySchema = z.object({ roomId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userData.user;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const { roomId } = parsed.data;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: room, error: roomErr } = await admin
      .from('live_rooms')
      .select('id, host_id, livekit_room_name, status, is_public')
      .eq('id', roomId)
      .maybeSingle();

    if (roomErr || !room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (room.status === 'ended') {
      return new Response(JSON.stringify({ error: 'Room ended' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isHost = room.host_id === user.id;
    let allowed = isHost || room.is_public;
    if (!allowed) {
      const { data: part } = await admin
        .from('live_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();
      allowed = !!part;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    const displayName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      user.email ||
      'Invité';

    const role = isHost ? 'host' : 'guest';

    await admin
      .from('live_participants')
      .upsert(
        {
          room_id: roomId,
          user_id: user.id,
          display_name: displayName,
          avatar_url: profile?.avatar_url ?? null,
          role,
          joined_at: new Date().toISOString(),
          left_at: null,
        },
        { onConflict: 'room_id,user_id' },
      );

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const wsUrl = Deno.env.get('LIVEKIT_WS_URL');
    if (!apiKey || !apiSecret || !wsUrl) {
      return new Response(JSON.stringify({ error: 'LiveKit not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: 60 * 60,
    });
    at.addGrant({
      roomJoin: true,
      room: room.livekit_room_name,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const jwt = await at.toJwt();

    return new Response(
      JSON.stringify({
        token: jwt,
        wsUrl,
        identity: user.id,
        role,
        roomName: room.livekit_room_name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('livekit-token error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});