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
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📦 [notify-delivery-completed] Order:', order_id);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch order with business info
    const { data: order, error: orderError } = await supabase
      .from('business_orders')
      .select('id, customer_id, donor_phone, beneficiary_phone, total_amount, business_account_id, business_accounts(business_name)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('❌ Order not found:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const businessName = (order.business_accounts as any)?.business_name || 'le prestataire';
    const shortOrderId = order_id.substring(0, 8).toUpperCase();
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

    const notificationTitle = 'Commande livrée ! 🎉';
    const notificationMessage = `Votre commande #${shortOrderId} chez ${businessName} a été livrée ! Confirmez la réception et notez le vendeur.`;

    // 1. In-app notification
    if (order.customer_id) {
      try {
        await supabase.from('notifications').insert({
          user_id: order.customer_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'delivery_completed',
          action_url: '/orders',
          metadata: { order_id, business_name: businessName },
        });
        console.log('✅ In-app notification created');
      } catch (e) {
        console.error('⚠️ In-app notification error:', e);
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
              tag: `delivery-completed-${order_id}`,
              data: { type: 'delivery_completed', order_id, url: '/orders' },
            });

            for (const sub of subs) {
              const result = await sendWebPushNotification(sub, pushPayload, vapidPublicKey, vapidPrivateKey, `mailto:${vapidEmail}`);
              if (result.success) {
                await supabase.from('push_subscriptions').update({ last_used_at: new Date().toISOString() }).eq('id', sub.id);
              } else if (result.error === 'subscription_expired') {
                await supabase.from('push_subscriptions').update({ is_active: false }).eq('id', sub.id);
              }
            }
            console.log(`✅ Push sent to ${subs.length} subscription(s)`);
          }
        }
      } catch (e) {
        console.error('⚠️ Push error:', e);
      }
    }

    // 3. SMS / WhatsApp
    if (customerPhone) {
      const channel = getPreferredChannel(customerPhone);

      // Always try WhatsApp template first
      try {
        const bizName = businessName.substring(0, 25);
        const waResult = await sendWhatsAppTemplate(
          customerPhone,
          'joiedevivre_delivery_completed',
          'fr',
          [customerFirstName, shortOrderId, bizName],
          [order_id.substring(0, 36)] // CTA button param for /orders
        );
        if (waResult.success) {
          console.log(`✅ [WhatsApp] Delivery notification sent: ${waResult.sid}`);
        } else {
          console.warn(`⚠️ [WhatsApp] Failed: ${waResult.error}, falling back to SMS`);
          // Fallback to SMS
          const smsMessage = `JoieDvivre: Votre commande #${shortOrderId} chez ${bizName} a ete livree! Confirmez la reception sur joiedevivre-africa.com/orders`;
          const smsResult = await sendSms(customerPhone, smsMessage, { truncate: true });
          if (smsResult.success) console.log('✅ SMS fallback sent:', smsResult.sid);
          else console.error('⚠️ SMS fallback failed:', smsResult.error);
        }
      } catch (e) {
        console.error('⚠️ WhatsApp/SMS error:', e);
      }
    }

    console.log('✅ [notify-delivery-completed] All notifications dispatched');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [notify-delivery-completed] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
