import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, shouldUseSms, sendWhatsAppTemplate, formatPhoneForTwilio } from "../_shared/sms-sender.ts";
import { sendWebPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderActionPayload {
  order_id: string;
  action: 'accept' | 'reject' | 'view';
  business_user_id: string;
  rejection_reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: OrderActionPayload = await req.json();
    const { order_id, action, business_user_id, rejection_reason } = payload;

    console.log('📦 [handle-order-action] Processing action:', action, 'for order:', order_id);

    if (!order_id || !action || !business_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // VAPID keys for push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

    // Fetch the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from('business_orders')
      .select(`
        id, status, business_account_id, customer_id, total_amount, currency, order_summary,
        donor_phone, beneficiary_phone,
        business_accounts!inner (user_id, business_name)
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const businessAccount = order.business_accounts as any;
    if (businessAccount.user_id !== business_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'view') {
      return new Response(
        JSON.stringify({ success: true, action: 'view', redirect_url: `/business-account?tab=orders&highlight=${order_id}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: 'Order is not in pending status', current_status: order.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let newStatus: string;
    let notificationTitle: string;
    let notificationMessage: string;

    if (action === 'accept') {
      newStatus = 'confirmed';
      notificationTitle = '✅ Commande confirmée';
      notificationMessage = `Votre commande de ${order.total_amount.toLocaleString()} ${order.currency} chez ${businessAccount.business_name} a été confirmée !`;
    } else if (action === 'reject') {
      newStatus = 'cancelled';
      notificationTitle = '❌ Commande annulée';
      notificationMessage = rejection_reason 
        ? `Votre commande chez ${businessAccount.business_name} a été annulée. Raison: ${rejection_reason}`
        : `Votre commande chez ${businessAccount.business_name} n'a pas pu être acceptée par le prestataire.`;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('business_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Notify the customer
    if (order.customer_id) {
      // 1. In-app notification
      await supabase.from('notifications').insert({
        user_id: order.customer_id,
        type: action === 'accept' ? 'order_confirmed' : 'order_rejected',
        title: notificationTitle,
        message: notificationMessage,
        metadata: { order_id, action, business_name: businessAccount.business_name },
        is_read: false
      });
      console.log('✅ Customer in-app notification created');

      // 2. Push notifications
      if (vapidPublicKey && vapidPrivateKey) {
        try {
          const { data: customerSubs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', order.customer_id)
            .eq('is_active', true);

          if (customerSubs && customerSubs.length > 0) {
            console.log(`📱 Sending push to ${customerSubs.length} customer subscription(s)...`);
            const pushPayload = JSON.stringify({
              title: notificationTitle,
              message: notificationMessage,
              body: notificationMessage,
              icon: '/logo-jv.png',
              badge: '/logo-jv.png',
              tag: `order-status-${order_id}`,
              data: { type: action === 'accept' ? 'order_confirmed' : 'order_rejected', order_id, url: '/dashboard' },
            });

            for (const sub of customerSubs) {
              const result = await sendWebPushNotification(sub, pushPayload, vapidPublicKey, vapidPrivateKey, `mailto:${vapidEmail}`);
              if (result.success) {
                await supabase.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', sub.id);
              } else if (result.error === 'subscription_expired') {
                await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
              }
            }
          }
        } catch (pushError) {
          console.error('⚠️ Push notification error:', pushError);
        }
      }
    }

    // 3. Send SMS to customer
    const customerPhone = order.donor_phone || order.beneficiary_phone;
    if (customerPhone) {
      try {
        const orderShortId = order_id.substring(0, 8).toUpperCase();
        const bizName = businessAccount.business_name.substring(0, 25);
        const smsMessage = action === 'accept'
          ? `JoieDvivre: Bonne nouvelle! Votre commande #${orderShortId} chez ${bizName} est confirmee. Suivez-la sur joiedevivre-africa.com`
          : `JoieDvivre: Votre commande #${orderShortId} chez ${bizName} n'a pas pu etre acceptee. Contactez-nous sur joiedevivre-africa.com`;

        const smsResult = await sendSms(customerPhone, smsMessage, { truncate: true });
        if (smsResult.success) console.log('✅ Customer SMS sent:', smsResult.sid);
        else console.error('⚠️ Customer SMS failed:', smsResult.error);
      } catch (smsError) {
        console.error('⚠️ SMS sending error:', smsError);
      }
    }

    // 4. Send WhatsApp template to customer
    if (customerPhone) {
      try {
        let customerFirstName = 'Client';
        if (order.customer_id) {
          const { data: profile } = await supabase.from('profiles').select('first_name').eq('user_id', order.customer_id).single();
          if (profile?.first_name) customerFirstName = profile.first_name;
        }
        const templateName = action === 'accept' ? 'joiedevivre_order_confirmed' : 'joiedevivre_order_rejected';
        const formattedAmount = order.total_amount.toLocaleString('fr-FR');
        const bizName = businessAccount.business_name.substring(0, 25);

        const waResult = await sendWhatsAppTemplate(customerPhone, templateName, 'fr', [customerFirstName, formattedAmount, bizName]);
        if (waResult.success) console.log(`✅ [WhatsApp] Status notification sent: ${waResult.sid}`);
        else console.error(`⚠️ [WhatsApp] Failed: ${waResult.error}`);
      } catch (waError) {
        console.error('⚠️ [WhatsApp] Error:', waError);
      }
    }

    // Track analytics
    try {
      await supabase.from('notification_analytics').insert({
        user_id: business_user_id,
        notification_type: 'quick_order_action',
        sent_at: new Date().toISOString(),
        clicked_at: new Date().toISOString(),
        action_url: action,
        status: 'clicked',
        metadata: { quick_action: true, action_type: action, order_id, from_push: true }
      });
    } catch (analyticsError) {
      console.log('⚠️ Analytics tracking failed:', analyticsError);
    }

    console.log(`✅ Order ${order_id} ${action}ed successfully`);

    return new Response(
      JSON.stringify({ success: true, action, new_status: newStatus, redirect_url: `/business-account?tab=orders` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in handle-order-action:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
