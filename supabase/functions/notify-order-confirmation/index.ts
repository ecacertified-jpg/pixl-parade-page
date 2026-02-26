import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSms, sendWhatsApp, sendWhatsAppTemplate, getPreferredChannel } from "../_shared/sms-sender.ts";
import { sendWebPushNotification } from "../_shared/web-push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'contact@joiedevivre.app';

    const { orderId, rating, reviewText, isSatisfied, businessAccountId } = await req.json();
    console.log(`📋 Processing order confirmation: orderId=${orderId}, rating=${rating}, satisfied=${isSatisfied}`);

    // Get order details with business phone
    const { data: order, error: orderError } = await supabase
      .from("business_orders")
      .select("*, business_accounts(user_id, business_name, phone)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", order.customer_id)
      .single();

    const customerName = customerProfile?.first_name || "Client";
    const businessUserId = order.business_accounts?.user_id;
    const businessName = order.business_accounts?.business_name || "Boutique";
    const businessPhone = order.business_accounts?.phone;
    const shortOrderId = orderId.substring(0, 8).toUpperCase();

    if (!businessUserId) throw new Error("Business user not found");

    let notificationTitle: string;
    let notificationMessage: string;
    let notificationType: string;

    if (isSatisfied) {
      notificationTitle = "✅ Réception confirmée";
      notificationMessage = `${customerName} a confirmé la réception de la commande #${shortOrderId} avec une note de ${rating}/5 ⭐`;
      notificationType = "order_confirmed";
    } else {
      notificationTitle = "⚠️ Demande de remboursement";
      notificationMessage = `${customerName} demande un remboursement pour la commande #${shortOrderId} (Note: ${rating}/5 ⭐)`;
      notificationType = "refund_requested";
    }

    let fullMessage = notificationMessage;
    if (reviewText && reviewText.trim()) {
      fullMessage += `\n\nRaison: "${reviewText}"`;
    }

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: businessUserId,
      title: notificationTitle,
      message: fullMessage,
      type: notificationType,
      action_url: `/business-account`,
      metadata: { order_id: orderId, rating, is_satisfied: isSatisfied, customer_name: customerName, review_text: reviewText },
    });
    console.log(`✅ Database notification created for business user ${businessUserId}`);

    // Send push notifications
    let pushSuccessCount = 0;
    let pushFailCount = 0;

    if (vapidPublicKey && vapidPrivateKey) {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", businessUserId)
        .eq("is_active", true);

      console.log(`📲 Found ${subscriptions?.length || 0} active push subscriptions`);

      if (subscriptions && subscriptions.length > 0) {
        const pushPayload = JSON.stringify({
          title: notificationTitle,
          body: fullMessage,
          icon: "/logo-jv.png",
          badge: "/logo-jv.png",
          tag: `order-confirm-${orderId}`,
          data: { type: notificationType, order_id: orderId, rating, url: "/business-account" },
          requireInteraction: !isSatisfied,
        });

        for (const subscription of subscriptions) {
          const result = await sendWebPushNotification(subscription, pushPayload, vapidPublicKey, vapidPrivateKey, `mailto:${vapidEmail}`);
          if (result.success) {
            pushSuccessCount++;
            await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", subscription.id);
          } else {
            pushFailCount++;
            if (result.error === 'subscription_expired') {
              await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", subscription.id);
            }
          }
        }
        console.log(`📊 Push results: ${pushSuccessCount} success, ${pushFailCount} failed`);
      }
    }

    // SMS/WhatsApp for refund requests
    let smsSent = false;
    if (!isSatisfied && businessPhone) {
      console.log(`🔔 REFUND REQUEST: Order ${orderId}, Rating: ${rating}/5`);
      const channel = getPreferredChannel(businessPhone);
      const smsMessage = `URGENT JoieDvivre: Demande remboursement #${shortOrderId}. Connectez-vous maintenant.`;
      
      let sendResult;
      if (channel === 'whatsapp') {
        console.log(`📤 [WhatsApp] Sending refund alert to business`);
        sendResult = await sendWhatsAppTemplate(
          businessPhone,
          'joiedevivre_refund_alert',
          'fr',
          [shortOrderId]
        );
        if (!sendResult.success) {
          console.log(`⚠️ [WhatsApp] Template failed, trying free text: ${sendResult.error}`);
          sendResult = await sendWhatsApp(businessPhone, smsMessage);
        }
      } else {
        sendResult = await sendSms(businessPhone, smsMessage);
      }
      smsSent = sendResult.success;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent successfully",
        notificationType,
        pushNotifications: { sent: pushSuccessCount, failed: pushFailCount },
        sms_sent: smsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in notify-order-confirmation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
