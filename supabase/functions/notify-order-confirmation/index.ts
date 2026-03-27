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

    // Get order details with business info
    const { data: order, error: orderError } = await supabase
      .from("business_orders")
      .select("*, business_accounts(user_id, business_name, phone, mobile_money_merchant_phone)")
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

    // ═══════════════════════════════════════════════
    // 1. NOTIFICATION PRESTATAIRE (existant)
    // ═══════════════════════════════════════════════

    await supabase.from("notifications").insert({
      user_id: businessUserId,
      title: notificationTitle,
      message: fullMessage,
      type: notificationType,
      action_url: `/business-account`,
      metadata: { order_id: orderId, rating, is_satisfied: isSatisfied, customer_name: customerName, review_text: reviewText },
    });
    console.log(`✅ Database notification created for business user ${businessUserId}`);

    // Send push notifications to business
    let pushSuccessCount = 0;
    let pushFailCount = 0;

    if (vapidPublicKey && vapidPrivateKey) {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", businessUserId)
        .eq("is_active", true);

      console.log(`📲 Found ${subscriptions?.length || 0} active push subscriptions for business`);

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
        console.log(`📊 Business push results: ${pushSuccessCount} success, ${pushFailCount} failed`);
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

    // ═══════════════════════════════════════════════
    // 2. NOTIFICATION ADMIN (in-app + Push)
    // ═══════════════════════════════════════════════

    let adminNotifCount = 0;
    let adminPushCount = 0;

    try {
      // Get all active admins
      const { data: activeAdmins } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("is_active", true);

      if (activeAdmins && activeAdmins.length > 0) {
        const adminTitle = isSatisfied
          ? `📦 Réception confirmée par ${customerName}`
          : `🚨 Remboursement demandé par ${customerName}`;

        let adminMessage = isSatisfied
          ? `Commande #${shortOrderId} chez ${businessName} — Note: ${rating}/5 ⭐ — Montant: ${order.total_amount} ${order.currency}`
          : `Commande #${shortOrderId} chez ${businessName} — Note: ${rating}/5 ⭐ — Montant: ${order.total_amount} ${order.currency}`;

        if (reviewText && reviewText.trim()) {
          adminMessage += `\nAvis: "${reviewText}"`;
        }

        // Insert admin_notifications for each admin
        const adminNotifications = activeAdmins.map((admin: { user_id: string }) => ({
          admin_user_id: admin.user_id,
          title: adminTitle,
          message: adminMessage,
          type: isSatisfied ? "receipt_confirmed" : "refund_requested",
          severity: isSatisfied ? "info" : "warning",
          entity_type: "order",
          entity_id: orderId,
          action_url: "/admin/orders",
          metadata: {
            order_id: orderId,
            rating,
            is_satisfied: isSatisfied,
            customer_name: customerName,
            business_name: businessName,
            total_amount: order.total_amount,
            currency: order.currency,
            review_text: reviewText,
          },
        }));

        const { error: adminNotifError } = await supabase
          .from("admin_notifications")
          .insert(adminNotifications);

        if (adminNotifError) {
          console.error(`⚠️ Failed to create admin notifications: ${adminNotifError.message}`);
        } else {
          adminNotifCount = activeAdmins.length;
          console.log(`✅ Admin notifications created for ${adminNotifCount} admins`);
        }

        // Send push to admins
        if (vapidPublicKey && vapidPrivateKey) {
          const adminUserIds = activeAdmins.map((a: { user_id: string }) => a.user_id);
          const { data: adminSubs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .in("user_id", adminUserIds)
            .eq("is_active", true);

          if (adminSubs && adminSubs.length > 0) {
            const adminPushPayload = JSON.stringify({
              title: adminTitle,
              body: adminMessage,
              icon: "/logo-jv.png",
              badge: "/logo-jv.png",
              tag: `admin-order-${orderId}`,
              data: { type: notificationType, order_id: orderId, url: "/admin/orders" },
              requireInteraction: !isSatisfied,
            });

            for (const sub of adminSubs) {
              const result = await sendWebPushNotification(sub, adminPushPayload, vapidPublicKey, vapidPrivateKey, `mailto:${vapidEmail}`);
              if (result.success) {
                adminPushCount++;
              } else if (result.error === 'subscription_expired') {
                await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", sub.id);
              }
            }
            console.log(`📊 Admin push results: ${adminPushCount} success out of ${adminSubs.length}`);
          }
        }
      }
    } catch (adminError) {
      console.error(`⚠️ Admin notification error (non-blocking):`, adminError);
    }

    // ═══════════════════════════════════════════════
    // 3. PAYMENT SPLIT (Phase 1 : simulé)
    // ═══════════════════════════════════════════════

    let splitCreated = false;
    let splitDetails: Record<string, unknown> | null = null;

    if (isSatisfied) {
      try {
        // Anti-doublon: check if split already exists
        const { data: existingSplit } = await supabase
          .from("payment_splits")
          .select("id")
          .eq("business_order_id", orderId)
          .maybeSingle();

        if (!existingSplit) {
          // Calculate vendor amount from product prices
          const items = (order.order_summary as { items?: Array<{ product_id?: string; quantity?: number }> })?.items || [];
          let vendorAmount = 0;

          for (const item of items) {
            if (item.product_id) {
              const { data: product } = await supabase
                .from("products")
                .select("price")
                .eq("id", item.product_id)
                .single();

              if (product) {
                vendorAmount += product.price * (item.quantity || 1);
              }
            }
          }

          const totalClientAmount = order.total_amount;
          const platformAmount = totalClientAmount - vendorAmount;
          const markupRate = vendorAmount > 0 ? ((totalClientAmount - vendorAmount) / vendorAmount) * 100 : 0;

          // Get platform mobile money phone
          const { data: platformSetting } = await supabase
            .from("platform_settings")
            .select("setting_value")
            .eq("setting_key", "platform_mobile_money_phone")
            .single();

          const platformMobileMoneyPhone = (platformSetting?.setting_value as { value?: string })?.value || '';
          const vendorPhone = order.business_accounts?.mobile_money_merchant_phone || null;

          const { data: split, error: splitErr } = await supabase
            .from("payment_splits")
            .insert({
              business_order_id: orderId,
              total_client_amount: totalClientAmount,
              vendor_amount: vendorAmount,
              platform_amount: platformAmount,
              currency: order.currency || "XOF",
              markup_rate: Math.round(markupRate * 100) / 100,
              vendor_wave_phone: vendorPhone,
              platform_wave_phone: platformMobileMoneyPhone || null,
              vendor_transfer_status: "simulated",
              platform_transfer_status: "simulated",
              payment_method: order.payment_method || "wave",
            })
            .select()
            .single();

          if (splitErr) {
            console.error(`⚠️ Failed to create payment split: ${splitErr.message}`);
          } else {
            splitCreated = true;
            splitDetails = {
              id: split.id,
              vendor_amount: vendorAmount,
              platform_amount: platformAmount,
              markup_rate: Math.round(markupRate * 100) / 100,
            };
            console.log(`💰 Payment split created: vendor=${vendorAmount} XOF, platform=${platformAmount} XOF (simulated)`);

            // Update admin notification with split info
            if (adminNotifCount > 0) {
              const splitMessage = `\n\n💰 Paiement prestataire prêt : ${vendorAmount} ${order.currency} vendeur / ${platformAmount} ${order.currency} plateforme (virement manuel en attente)`;
              await supabase
                .from("admin_notifications")
                .update({
                  message: `Commande #${shortOrderId} chez ${businessName} — Note: ${rating}/5 ⭐ — Montant: ${order.total_amount} ${order.currency}${reviewText ? `\nAvis: "${reviewText}"` : ''}${splitMessage}`,
                })
                .eq("entity_id", orderId)
                .eq("type", "receipt_confirmed");
            }
          }
        } else {
          console.log(`ℹ️ Payment split already exists for order ${orderId}, skipping`);
        }
      } catch (splitError) {
        console.error(`⚠️ Payment split error (non-blocking):`, splitError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent successfully",
        notificationType,
        pushNotifications: { sent: pushSuccessCount, failed: pushFailCount },
        sms_sent: smsSent,
        admin: { notifications: adminNotifCount, push: adminPushCount },
        payment_split: splitCreated ? splitDetails : null,
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
