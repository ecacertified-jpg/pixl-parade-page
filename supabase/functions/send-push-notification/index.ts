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

// Web Push utilities for VAPID authentication
async function generateVapidAuthHeaders(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string
): Promise<{ authorization: string; cryptoKey: string }> {
  // Create JWT for VAPID
  const jwtHeader = { typ: 'JWT', alg: 'ES256' };
  const jwtPayload = {
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
    sub: subject
  };

  const encoder = new TextEncoder();
  
  // Base64URL encode header and payload
  const headerB64 = btoa(JSON.stringify(jwtHeader)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key for signing
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  
  // Create the crypto key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  // Convert signature to base64url
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey
  };
}

function base64UrlToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(b64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToBase64Url(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    console.log('📤 Sending push to:', subscription.endpoint.substring(0, 50) + '...');

    // For simplicity, we'll send the payload without encryption for now
    // Most modern browsers support this for same-origin push
    const vapidHeaders = await generateVapidAuthHeaders(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey,
      `mailto:${vapidEmail}`
    );

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Authorization': vapidHeaders.authorization,
        'Crypto-Key': `p256ecdsa=${vapidHeaders.cryptoKey}`,
      },
      body: payload,
    });

    if (response.ok || response.status === 201) {
      console.log('✅ Push sent successfully');
      return { success: true, status: response.status };
    }

    const errorText = await response.text();
    console.error('❌ Push failed:', response.status, errorText);
    
    // Handle specific error codes
    if (response.status === 410 || response.status === 404) {
      // Subscription expired or invalid
      return { success: false, status: response.status, error: 'subscription_expired' };
    }

    return { success: false, status: response.status, error: errorText };
  } catch (error) {
    console.error('❌ Error sending push:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ Invalid token:', authError?.message);
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

    // Service role client for DB operations
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

    // Determine category from notification type
    const categoryMap: Record<string, string> = {
      'birthday': 'birthday',
      'birthday_reminder': 'birthday',
      'gift': 'fund',
      'fund': 'fund',
      'celebration': 'gratitude',
      'order': 'order',
    };
    const category = categoryMap[notificationType] || 'other';

    // Send notifications
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

      const result = await sendWebPush(
        subscription,
        pushPayload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidEmail
      );

      if (result.success) {
        successCount++;
        // Update last_used_at and mark as delivered
        await supabaseAdmin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);
        
        // Update analytics as delivered
        if (analyticsEntry?.id) {
          await supabaseAdmin
            .from('notification_analytics')
            .update({ 
              delivered_at: new Date().toISOString(),
              status: 'delivered'
            })
            .eq('id', analyticsEntry.id);
        }
      } else {
        failedCount++;
        // Update analytics with error
        if (analyticsEntry?.id) {
          await supabaseAdmin
            .from('notification_analytics')
            .update({ 
              status: 'failed',
              error_message: result.error
            })
            .eq('id', analyticsEntry.id);
        }
        // Deactivate expired subscriptions
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
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('❌ Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
