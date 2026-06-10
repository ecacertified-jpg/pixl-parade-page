import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  user_ids: string[];
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  type?: 'birthday' | 'birthday_reminder' | 'gift' | 'fund' | 'celebration' | 'default';
  isUrgent?: boolean;
  playSound?: boolean;
}

const ONESIGNAL_APP_ID = '52d13eb4-510f-4bb0-8909-d3eb996e91cd';
const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    if (!restApiKey) {
      console.error('❌ ONESIGNAL_REST_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushNotificationPayload = await req.json();
    console.log('📬 Sending push to users:', payload.user_ids);

    // Fetch OneSignal player IDs from profiles
    const { data: profilesData, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('user_id, onesignal_player_id')
      .in('user_id', payload.user_ids)
      .not('onesignal_player_id', 'is', null);

    if (profErr) {
      console.error('❌ Error fetching profiles:', profErr);
      throw profErr;
    }

    const playerIds = (profilesData || [])
      .map((p) => p.onesignal_player_id as string)
      .filter(Boolean);

    if (playerIds.length === 0) {
      console.log('ℹ️ No OneSignal subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No active subscriptions', sent: 0, failed: 0, total: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Sending to ${playerIds.length} OneSignal subscriptions`);

    const notificationType = payload.type || 'default';
    const isBirthday = notificationType.includes('birthday');

    const categoryMap: Record<string, string> = {
      'birthday': 'birthday',
      'birthday_reminder': 'birthday',
      'gift': 'fund',
      'fund': 'fund',
      'celebration': 'gratitude',
      'order': 'order',
    };
    const category = categoryMap[notificationType] || 'other';
    const actionUrl = (payload.data?.url as string) || undefined;

    // Insert analytics entries (one per recipient)
    const analyticsRows = (profilesData || []).map((p) => ({
      user_id: p.user_id as string,
      notification_type: 'push',
      category,
      title: payload.title,
      body: payload.message,
      action_url: actionUrl || null,
      status: 'sent',
      device_type: 'web',
    }));
    if (analyticsRows.length > 0) {
      await supabaseAdmin.from('notification_analytics').insert(analyticsRows);
    }

    const body: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: payload.title, fr: payload.title },
      contents: { en: payload.message, fr: payload.message },
      chrome_web_icon: payload.icon || 'https://joiedevivre-africa.com/pwa-192x192.png',
      chrome_web_badge: payload.badge || 'https://joiedevivre-africa.com/pwa-192x192.png',
      data: {
        ...payload.data,
        type: notificationType,
        isUrgent: payload.isUrgent || false,
        playSound: payload.playSound !== false,
        soundType: isBirthday ? (payload.isUrgent ? 'tada' : 'chime') : 'pop',
      },
    };
    if (actionUrl) body.url = actionUrl;
    if (payload.tag) body.web_push_topic = payload.tag;

    const osResp = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${restApiKey}`,
      },
      body: JSON.stringify(body),
    });

    const osJson = await osResp.json().catch(() => ({}));
    if (!osResp.ok) {
      console.error('❌ OneSignal error:', osResp.status, osJson);
      return new Response(
        JSON.stringify({ error: 'OneSignal request failed', details: osJson, sent: 0, failed: playerIds.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const recipients = (osJson as any).recipients ?? playerIds.length;
    console.log(`📊 OneSignal sent to ${recipients} recipients (id=${(osJson as any).id})`);

    return new Response(
      JSON.stringify({
        sent: recipients,
        failed: Math.max(0, playerIds.length - recipients),
        total: playerIds.length,
        onesignal_id: (osJson as any).id ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
