import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsAppTemplate, formatPhoneForTwilio } from "../_shared/sms-sender.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SMS reliability map by phone prefix
const SMS_RELIABILITY_BY_PREFIX: Record<string, { reliability: string; smsActuallyReliable?: boolean }> = {
  '225': { reliability: 'unreliable', smsActuallyReliable: true }, // CI - SMS works
  '221': { reliability: 'unreliable' },  // SN - SMS unstable
  '229': { reliability: 'unavailable' }, // BJ
  '228': { reliability: 'unavailable' }, // TG
  '223': { reliability: 'unavailable' }, // ML
  '226': { reliability: 'unavailable' }, // BF
};

function getSmsPrefixReliability(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
  for (const [prefix, config] of Object.entries(SMS_RELIABILITY_BY_PREFIX)) {
    if (cleaned.startsWith(prefix)) {
      if (config.reliability === 'unreliable' && config.smsActuallyReliable) return 'reliable';
      return config.reliability;
    }
  }
  return 'reliable';
}

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
    customer_id?: string;
    created_at: string;
  };
  old_record: null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Webhook signature verification
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const signature = req.headers.get('X-Webhook-Signature');
    
    if (webhookSecret) {
      if (!signature) {
        console.error('❌ No webhook signature provided');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Missing webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
      );
      
      const body = await req.text();
      
      try {
        const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(body));
        
        if (!isValid) {
          console.error('❌ Invalid webhook signature');
          return new Response(
            JSON.stringify({ error: 'Unauthorized - Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
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
    
    // Fallback: require auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (token !== serviceRoleKey) {
      const verifyClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user }, error: authError } = await verifyClient.auth.getUser();
      if (authError || !user) {
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
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

  // Get the business account
  const { data: businessAccount, error: businessError } = await supabaseClient
    .from('business_accounts')
    .select('user_id, business_name, phone')
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

  // Parse order summary
  const { itemCount, firstItemName, orderSummaryShort } = parseOrderSummary(order.order_summary);

  // Get customer name for WhatsApp template
  const customerName = await getCustomerName(supabaseClient, order.customer_id, order.donor_phone);

  // --- Push notifications ---
  const pushResult = await sendPushNotifications(supabaseClient, businessAccount, order, itemCount, firstItemName);

  // --- In-app notification ---
  await createInAppNotification(supabaseClient, businessAccount.user_id, order, businessAccount.business_name, itemCount);

  // --- WhatsApp + SMS with smart routing ---
  const messagingResult = await sendBusinessMessaging(
    businessAccount.phone,
    order,
    customerName,
    orderSummaryShort
  );

  console.log(`✅ Results: push=${pushResult.sent}/${pushResult.total}, whatsapp=${messagingResult.whatsappSent}, sms=${messagingResult.smsSent}`);

  return new Response(
    JSON.stringify({
      sent: pushResult.sent,
      failed: pushResult.failed,
      total: pushResult.total,
      in_app_created: true,
      whatsapp_sent: messagingResult.whatsappSent,
      sms_sent: messagingResult.smsSent,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

// --- Helper functions ---

function parseOrderSummary(orderSummary: any): { itemCount: number; firstItemName: string; orderSummaryShort: string } {
  let itemCount = 0;
  let firstItemName = 'Article';
  let orderSummaryShort = 'Article(s)';

  try {
    const summary = typeof orderSummary === 'string' ? JSON.parse(orderSummary) : orderSummary;
    
    if (summary?.items && Array.isArray(summary.items)) {
      itemCount = summary.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      firstItemName = summary.items[0]?.name || 'Article';
      
      if (summary.items.length === 1) {
        const qty = summary.items[0]?.quantity || 1;
        orderSummaryShort = `${firstItemName} x${qty}`;
      } else {
        orderSummaryShort = `${itemCount} articles`;
      }
      
      // Truncate for WhatsApp template (max ~50 chars)
      if (orderSummaryShort.length > 50) {
        orderSummaryShort = orderSummaryShort.substring(0, 47) + '...';
      }
    }
  } catch (e) {
    console.log('⚠️ Could not parse order summary');
  }

  return { itemCount, firstItemName, orderSummaryShort };
}

async function getCustomerName(supabase: any, customerId?: string, donorPhone?: string): Promise<string> {
  if (!customerId) return donorPhone || 'Client';
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', customerId)
      .single();
    
    if (profile?.first_name) {
      return profile.first_name;
    }
  } catch (e) {
    console.log('⚠️ Could not fetch customer name');
  }
  
  return donorPhone || 'Client';
}

async function sendPushNotifications(
  supabase: any,
  businessAccount: { user_id: string },
  order: any,
  itemCount: number,
  firstItemName: string
): Promise<{ sent: number; failed: number; total: number }> {
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', businessAccount.user_id)
    .eq('is_active', true);

  if (subsError || !subscriptions || subscriptions.length === 0) {
    console.log('📭 No active push subscriptions for business owner');
    return { sent: 0, failed: 0, total: 0 };
  }

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

  let successCount = 0;
  let failedCount = 0;

  for (const subscription of subscriptions) {
    try {
      const success = await sendWebPush(subscription, pushPayload);
      if (success) {
        successCount++;
        await supabase
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

  return { sent: successCount, failed: failedCount, total: subscriptions.length };
}

async function sendWebPush(subscription: any, payload: any): Promise<boolean> {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return false;
    }

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

/**
 * Sends WhatsApp template + SMS to business owner with smart routing.
 * - WhatsApp: always sent via joiedevivre_new_order template
 * - SMS: only sent if prefix reliability is not 'unavailable'
 */
async function sendBusinessMessaging(
  businessPhone: string | null,
  order: any,
  customerName: string,
  orderSummaryShort: string
): Promise<{ whatsappSent: boolean; smsSent: boolean }> {
  let whatsappSent = false;
  let smsSent = false;

  if (!businessPhone) {
    console.log('📭 No business phone number configured, skipping WhatsApp/SMS');
    return { whatsappSent, smsSent };
  }

  const smsReliability = getSmsPrefixReliability(businessPhone);
  const canSendSms = smsReliability !== 'unavailable';

  console.log(`📡 [Routing] phone=${businessPhone.substring(0, 7)}***, smsReliability=${smsReliability}, canSendSms=${canSendSms}`);

  // Always send WhatsApp template
  try {
    const formattedAmount = order.total_amount.toLocaleString('fr-FR');
    
    console.log(`📤 [WhatsApp] Sending joiedevivre_new_order template to business`);
    const waResult = await sendWhatsAppTemplate(
      businessPhone,
      'joiedevivre_new_order',
      'fr',
      [
        customerName,        // {{1}} - Client name
        formattedAmount,     // {{2}} - Amount
        orderSummaryShort,   // {{3}} - Order summary
      ]
    );
    
    whatsappSent = waResult.success;
    if (waResult.success) {
      console.log(`✅ [WhatsApp] Order notification sent: ${waResult.sid}`);
    } else {
      console.log(`⚠️ [WhatsApp] Failed to send: ${waResult.error}`);
    }
  } catch (error) {
    console.error('❌ [WhatsApp] Error sending template:', error);
  }

  // Send SMS only if reliable for this country
  if (canSendSms) {
    try {
      const shortOrderId = order.id.substring(0, 8).toUpperCase();
      const smsMessage = `JoieDvivre: Nouvelle commande #${shortOrderId} de ${order.total_amount.toLocaleString()} ${order.currency}. Acceptez dans l'app.`;
      
      console.log(`📤 [SMS] Sending order notification to business`);
      const smsResult = await sendSms(businessPhone, smsMessage);
      smsSent = smsResult.success;
      
      if (smsResult.success) {
        console.log(`✅ [SMS] Order notification sent: ${smsResult.sid}`);
      } else {
        console.log(`⚠️ [SMS] Failed to send: ${smsResult.error}`);
      }
    } catch (error) {
      console.error('❌ [SMS] Error sending:', error);
    }
  } else {
    console.log(`⏭️ [SMS] Skipped - unavailable for this prefix`);
  }

  return { whatsappSent, smsSent };
}

async function createInAppNotification(
  supabase: any,
  userId: string,
  order: any,
  businessName: string,
  itemCount: number
) {
  try {
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
