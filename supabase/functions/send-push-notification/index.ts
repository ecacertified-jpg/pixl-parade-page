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
  data?: Record<string, any>;
  requireInteraction?: boolean;
  type?: 'birthday' | 'birthday_reminder' | 'gift' | 'fund' | 'celebration' | 'default';
  isUrgent?: boolean;
  playSound?: boolean;
}

async function sendPushToSubscription(
  subscription: any,
  payload: any,
  vapidKeys: { publicKey: string; privateKey: string; email: string }
) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));

    // Simple fetch implementation - en production, utiliser web-push library
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: data,
    });

    if (!response.ok) {
      console.error('Push failed:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user token first
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ Invalid or expired token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Authenticated user:', user.id);

    // Use service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PushNotificationPayload = await req.json();
    console.log('Sending push notifications to:', payload.user_ids);

    // Récupérer les souscriptions actives pour ces utilisateurs
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', payload.user_ids)
      .eq('is_active', true);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No active subscriptions', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VAPID keys (en production, utiliser des variables d'environnement)
    const vapidKeys = {
      publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || '',
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || '',
      email: Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app',
    };

    const notificationType = payload.type || 'default';
    const isBirthday = notificationType.includes('birthday');
    
    const pushPayload = {
      title: payload.title,
      message: payload.message,
      body: payload.message,
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || `joie-de-vivre-${notificationType}`,
      type: notificationType,
      isUrgent: payload.isUrgent || false,
      data: {
        ...payload.data,
        type: notificationType,
        isUrgent: payload.isUrgent || false,
        playSound: payload.playSound !== false,
        soundType: isBirthday ? (payload.isUrgent ? 'tada' : 'chime') : 'pop'
      },
      requireInteraction: payload.requireInteraction || isBirthday,
    };
    
    console.log('Push payload with sound config:', { type: notificationType, isUrgent: payload.isUrgent });

    let successCount = 0;
    let failedCount = 0;

    // Envoyer les notifications
    for (const subscription of subscriptions) {
      const subscriptionObject = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key,
        },
      };

      const success = await sendPushToSubscription(
        subscriptionObject,
        pushPayload,
        vapidKeys
      );

      if (success) {
        successCount++;
        // Mettre à jour last_used_at
        await supabaseClient
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);
      } else {
        failedCount++;
        // Désactiver les souscriptions qui échouent
        await supabaseClient
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id);
      }
    }

    console.log(`Push notifications sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        sent: successCount, 
        failed: failedCount,
        total: subscriptions.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
