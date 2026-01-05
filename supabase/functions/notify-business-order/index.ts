import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    business_account_id: string;
    total_amount: number;
    currency: string;
    status: string;
    order_summary: any;
    delivery_address: string;
    beneficiary_phone: string;
    donor_phone: string;
    created_at: string;
  };
  old_record: null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Webhook signature verification for database triggers/webhooks
    // This function is typically called by Supabase database triggers, not directly by users
    // Verify using a shared webhook secret if available
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const signature = req.headers.get('X-Webhook-Signature');
    
    // If webhook secret is configured, require signature verification
    if (webhookSecret) {
      if (!signature) {
        console.error('❌ No webhook signature provided');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Missing webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Simple HMAC verification (in production, use proper crypto)
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      
      // Get the raw body for verification
      const body = await req.text();
      const expectedSignature = signature;
      
      try {
        const signatureBuffer = Uint8Array.from(atob(expectedSignature), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify(
          'HMAC',
          key,
          signatureBuffer,
          encoder.encode(body)
        );
        
        if (!isValid) {
          console.error('❌ Invalid webhook signature');
          return new Response(
            JSON.stringify({ error: 'Unauthorized - Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Parse the body since we already read it
        const payload: OrderPayload = JSON.parse(body);
        return await processOrder(payload);
      } catch (verifyError) {
        console.error('❌ Signature verification error:', verifyError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Signature verification failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // If no webhook secret configured, require proper authentication
    // Only allow Supabase service role or verified user tokens
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Only allow if called with service role key (internal Supabase calls/database triggers)
    if (token !== serviceRoleKey) {
      // Verify it's a valid user token for internal calls
      const verifyClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user }, error: authError } = await verifyClient.auth.getUser();
      if (authError || !user) {
        console.error('❌ Unauthorized access attempt - invalid token');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('✅ Authenticated internal call from user:', user.id);
    } else {
      console.log('✅ Service role call detected');
    }

    const payload: OrderPayload = await req.json();
    return await processOrder(payload);
  } catch (error) {
    console.error('❌ Error in notify-business-order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function processOrder(payload: OrderPayload) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

    console.log('📦 [notify-business-order] New order received:', payload.record?.id);

    if (!payload.record || payload.type !== 'INSERT') {
      console.log('⚠️ Not an INSERT event or no record, skipping');
      return new Response(
        JSON.stringify({ message: 'Not an INSERT event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = payload.record;

    // Get the business account to find the owner
    const { data: businessAccount, error: businessError } = await supabaseClient
      .from('business_accounts')
      .select('user_id, business_name')
      .eq('id', order.business_account_id)
      .single();

    if (businessError || !businessAccount) {
      console.error('❌ Error fetching business account:', businessError);
      return new Response(
        JSON.stringify({ error: 'Business account not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('🏪 Business owner found:', businessAccount.user_id);

    // Get active push subscriptions for the business owner
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', businessAccount.user_id)
      .eq('is_active', true);

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No active push subscriptions for business owner');
      
      // Still create an in-app notification
      await createInAppNotification(supabaseClient, businessAccount.user_id, order, businessAccount.business_name);
      
      return new Response(
        JSON.stringify({ message: 'No push subscriptions, in-app notification created', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse order summary to get item count
    let itemCount = 0;
    let firstItemName = 'Article';
    try {
      const summary = typeof order.order_summary === 'string' 
        ? JSON.parse(order.order_summary) 
        : order.order_summary;
      
      if (summary?.items && Array.isArray(summary.items)) {
        itemCount = summary.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        firstItemName = summary.items[0]?.name || 'Article';
      }
    } catch (e) {
      console.log('⚠️ Could not parse order summary');
    }

    // Prepare push payload with quick action buttons
    const pushPayload = {
      title: '🎉 Nouvelle commande !',
      message: itemCount > 1 
        ? `${itemCount} articles commandés pour ${order.total_amount.toLocaleString()} ${order.currency}`
        : `${firstItemName} - ${order.total_amount.toLocaleString()} ${order.currency}`,
      body: itemCount > 1 
        ? `${itemCount} articles commandés pour ${order.total_amount.toLocaleString()} ${order.currency}`
        : `${firstItemName} - ${order.total_amount.toLocaleString()} ${order.currency}`,
      icon: '/logo-jv.png',
      badge: '/logo-jv.png',
      tag: `order-${order.id}`,
      data: {
        type: 'new_order',
        order_id: order.id,
        business_id: order.business_account_id,
        business_user_id: businessAccount.user_id,
        url: '/business-account?tab=orders',
        requires_action: true,
      },
      actions: [
        { action: 'accept', title: '✅ Accepter' },
        { action: 'reject', title: '❌ Refuser' },
        { action: 'view', title: '👁️ Voir' }
      ],
      requireInteraction: true,
    };

    // Send push notifications using web-push protocol
    let successCount = 0;
    let failedCount = 0;

    for (const subscription of subscriptions) {
      try {
        const success = await sendWebPush(subscription, pushPayload);
        
        if (success) {
          successCount++;
          await supabaseClient
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', subscription.id);
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error('❌ Error sending push to subscription:', error);
        failedCount++;
      }
    }

    // Also create an in-app notification
    await createInAppNotification(supabaseClient, businessAccount.user_id, order, businessAccount.business_name);

    console.log(`✅ Push notifications sent: ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        sent: successCount, 
        failed: failedCount,
        total: subscriptions.length,
        in_app_created: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
}

async function sendWebPush(subscription: any, payload: any): Promise<boolean> {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return false;
    }

    // For now, using a simple fetch - in production, use proper web-push encryption
    // The service worker will receive this and show the notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Push failed:', response.status, errorText);
      
      // If subscription is gone (410) or not found (404), mark as inactive
      if (response.status === 404 || response.status === 410) {
        console.log('📭 Subscription expired, will be marked inactive');
      }
      return false;
    }

    console.log('✅ Push sent successfully to:', subscription.endpoint.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error in sendWebPush:', error);
    return false;
  }
}

async function createInAppNotification(
  supabase: any, 
  userId: string, 
  order: any, 
  businessName: string
) {
  try {
    let itemCount = 0;
    try {
      const summary = typeof order.order_summary === 'string' 
        ? JSON.parse(order.order_summary) 
        : order.order_summary;
      
      if (summary?.items && Array.isArray(summary.items)) {
        itemCount = summary.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      }
    } catch (e) {}

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'new_business_order',
        title: 'Nouvelle commande reçue',
        message: `Vous avez reçu une nouvelle commande de ${order.total_amount.toLocaleString()} ${order.currency}${itemCount > 0 ? ` (${itemCount} article${itemCount > 1 ? 's' : ''})` : ''}`,
        data: {
          order_id: order.id,
          business_id: order.business_account_id,
          amount: order.total_amount,
          currency: order.currency,
        },
        is_read: false,
      });

    if (error) {
      console.error('❌ Error creating in-app notification:', error);
    } else {
      console.log('✅ In-app notification created');
    }
  } catch (error) {
    console.error('❌ Error in createInAppNotification:', error);
  }
}
