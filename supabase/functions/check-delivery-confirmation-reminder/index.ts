import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsAppTemplate, getPreferredChannel } from "../_shared/sms-sender.ts";
import { sendWebPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⏰ [check-delivery-confirmation-reminder] Starting check...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find orders delivered 24h+ ago, still in 'delivered' status
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error: ordersError } = await supabase
      .from('business_orders')
      .select('id, customer_id, donor_phone, beneficiary_phone, total_amount, business_account_id, delivery_delivered_at, business_accounts(business_name)')
      .eq('status', 'delivered')
      .not('delivery_delivered_at', 'is', null)
      .lte('delivery_delivered_at', twentyFourHoursAgo);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log('✅ No orders needing confirmation reminder');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${orders.length} delivered orders older than 24h`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      // Anti-spam: check if reminder already sent for this order
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'delivery_confirmation_reminder')
        .eq('metadata->>order_id', order.id)
        .limit(1);

      if (existingNotif && existingNotif.length > 0) {
        skippedCount++;
        continue;
      }

      const businessName = (order.business_accounts as any)?.business_name || 'le prestataire';
      const shortOrderId = order.id.substring(0, 8).toUpperCase();
      const customerPhone = order.donor_phone || order.beneficiary_phone;

      // Get customer first name
      let customerFirstName = 'Client';
      if (order.customer_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', order.customer_id)
          .single();
        if (profile?.first_name) customerFirstName = profile.first_name;
      }

      const notificationTitle = 'Rappel : Confirmez votre livraison 📦';
      const notificationMessage = `Rappel : Votre commande #${shortOrderId} chez ${businessName} a été livrée il y a 24h. Confirmez la réception et notez le vendeur.`;

      // 1. In-app notification
      if (order.customer_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: order.customer_id,
            title: notificationTitle,
            message: notificationMessage,
            type: 'delivery_confirmation_reminder',
            action_url: '/orders',
            metadata: { order_id: order.id, business_name: businessName },
          });
          console.log(`✅ In-app reminder for order ${shortOrderId}`);
        } catch (e) {
          console.error(`⚠️ In-app error for ${shortOrderId}:`, e);
        }
      }

      // 2. Push notification
      if (order.customer_id) {
        try {
          const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
          const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
          const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

          if (vapidPublicKey && vapidPrivateKey) {
            const { data: subs } = await supabase
              .from('push_subscriptions')
              .select('*')
              .eq('user_id', order.customer_id)
              .eq('is_active', true);

            if (subs && subs.length > 0) {
              const pushPayload = JSON.stringify({
                title: notificationTitle,
                message: notificationMessage,
                body: notificationMessage,
                icon: '/logo-jv.png',
                badge: '/logo-jv.png',
                tag: `delivery-reminder-${order.id}`,
                data: { type: 'delivery_confirmation_reminder', order_id: order.id, url: '/orders' },
              });

              for (const sub of subs) {
                const result = await sendWebPushNotification(sub, pushPayload, vapidPublicKey, vapidPrivateKey, `mailto:${vapidEmail}`);
                if (result.success) {
                  await supabase.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', sub.id);
                } else if (result.error === 'subscription_expired') {
                  await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
                }
              }
              console.log(`✅ Push reminder sent for order ${shortOrderId}`);
            }
          }
        } catch (e) {
          console.error(`⚠️ Push error for ${shortOrderId}:`, e);
        }
      }

      // 3. SMS / WhatsApp
      if (customerPhone) {
        try {
          const bizName = businessName.substring(0, 25);
          const waResult = await sendWhatsAppTemplate(
            customerPhone,
            'joiedevivre_delivery_reminder',
            'fr',
            [customerFirstName, shortOrderId, bizName],
            [order.id.substring(0, 36)]
          );
          if (waResult.success) {
            console.log(`✅ [WhatsApp] Reminder sent for ${shortOrderId}: ${waResult.sid}`);
          } else {
            console.warn(`⚠️ [WhatsApp] Failed for ${shortOrderId}, falling back to SMS`);
            const smsMessage = `JoieDvivre: Rappel - Commande #${shortOrderId} livree il y a 24h. Confirmez la reception sur joiedevivre-africa.com/orders`;
            const smsResult = await sendSms(customerPhone, smsMessage, { truncate: true });
            if (smsResult.success) console.log(`✅ SMS reminder sent for ${shortOrderId}`);
            else console.error(`⚠️ SMS failed for ${shortOrderId}:`, smsResult.error);
          }
        } catch (e) {
          console.error(`⚠️ WhatsApp/SMS error for ${shortOrderId}:`, e);
        }
      }

      sentCount++;
    }

    console.log(`✅ [check-delivery-confirmation-reminder] Done: ${sentCount} sent, ${skippedCount} skipped`);

    return new Response(JSON.stringify({ processed: sentCount, skipped: skippedCount, total: orders.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [check-delivery-confirmation-reminder] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
