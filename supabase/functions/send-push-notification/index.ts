import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPushNotification } from "../_shared/web-push.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
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

    console.log('✅ Authenticated user:', user.id);

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
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

    // Get active subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', payload.user_ids)
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No active subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No active subscriptions', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Found ${subscriptions.length} active subscriptions`);

    const notificationType = payload.type || 'default';
    const isBirthday = notificationType.includes('birthday');

    const pushPayload = JSON.stringify({
      title: payload.title,
      message: payload.message,
      body: payload.message,
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || `joie-de-vivre-${notificationType}-${Date.now()}`,
      type: notificationType,
      isUrgent: payload.isUrgent || false,
      data: {
        ...payload.data,
        type: notificationType,
        isUrgent: payload.isUrgent || false,
        playSound: payload.playSound !== false,
        soundType: isBirthday ? (payload.isUrgent ? 'tada' : 'chime') : 'pop',
        timestamp: Date.now()
      },
      requireInteraction: payload.requireInteraction || isBirthday,
    });

    let successCount = 0;
    let failedCount = 0;
    const expiredEndpoints: string[] = [];

    const categoryMap: Record<string, string> = {
      'birthday': 'birthday',
      'birthday_reminder': 'birthday',
      'gift': 'fund',
      'fund': 'fund',
      'celebration': 'gratitude',
      'order': 'order',
    };
    const category = categoryMap[notificationType] || 'other';

    for (const subscription of subscriptions) {
      // Create analytics entry before sending
      const { data: analyticsEntry } = await supabaseAdmin
        .from('notification_analytics')
        .insert({
          user_id: subscription.user_id,
          notification_type: 'push',
          category,
          title: payload.title,
          body: payload.message,
          action_url: payload.data?.url as string || null,
          status: 'sent',
          device_type: subscription.device_type || 'unknown',
        })
        .select('id')
        .single();

      const result = await sendWebPushNotification(
        subscription,
        pushPayload,
        vapidPublicKey,
        vapidPrivateKey,
        `mailto:${vapidEmail}`
      );

      if (result.success) {
        successCount++;
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);
        
        if (analyticsEntry?.id) {
          await supabaseAdmin
            .from('notification_analytics')
            .update({ delivered_at: new Date().toISOString(), status: 'delivered' })
            .eq('id', analyticsEntry.id);
        }
      } else {
        failedCount++;
        if (analyticsEntry?.id) {
          await supabaseAdmin
            .from('notification_analytics')
            .update({ status: 'failed', error_message: result.error })
            .eq('id', analyticsEntry.id);
        }
        if (result.error === 'subscription_expired') {
          expiredEndpoints.push(subscription.endpoint);
          await supabaseAdmin
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
      }
    }

    console.log(`📊 Results: ${successCount} success, ${failedCount} failed, ${expiredEndpoints.length} expired`);

    return new Response(
      JSON.stringify({
        sent: successCount,
        failed: failedCount,
        expired: expiredEndpoints.length,
        total: subscriptions.length
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
