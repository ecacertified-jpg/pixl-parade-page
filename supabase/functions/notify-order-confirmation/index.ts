import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to send Web Push notification
async function sendWebPush(subscription: any, payload: any): Promise<boolean> {
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Push failed for subscription ${subscription.id}:`, response.status, await response.text());
      return false;
    }

    console.log(`✅ Push sent successfully to subscription ${subscription.id}`);
    return true;
  } catch (error) {
    console.error(`Error sending push to subscription ${subscription.id}:`, error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, rating, reviewText, isSatisfied, businessAccountId } = await req.json();

    console.log(`📋 Processing order confirmation: orderId=${orderId}, rating=${rating}, satisfied=${isSatisfied}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("business_orders")
      .select("*, business_accounts(user_id, business_name)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("❌ Order not found:", orderError);
      throw new Error("Order not found");
    }

    // Get customer profile
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", order.customer_id)
      .single();

    const customerName = customerProfile?.first_name || "Client";
    const businessUserId = order.business_accounts?.user_id;
    const businessName = order.business_accounts?.business_name || "Boutique";
    const shortOrderId = orderId.substring(0, 8).toUpperCase();

    if (!businessUserId) {
      console.error("❌ Business user not found");
      throw new Error("Business user not found");
    }

    console.log(`👤 Customer: ${customerName}, Business: ${businessName}, BusinessUserId: ${businessUserId}`);

    let notificationTitle: string;
    let notificationMessage: string;
    let notificationType: string;

    if (isSatisfied) {
      // Positive notification
      notificationTitle = "✅ Réception confirmée";
      notificationMessage = `${customerName} a confirmé la réception de la commande #${shortOrderId} avec une note de ${rating}/5 ⭐`;
      notificationType = "order_confirmed";
    } else {
      // Refund request notification
      notificationTitle = "⚠️ Demande de remboursement";
      notificationMessage = `${customerName} demande un remboursement pour la commande #${shortOrderId} (Note: ${rating}/5 ⭐)`;
      notificationType = "refund_requested";
    }

    // Add review text if provided
    let fullMessage = notificationMessage;
    if (reviewText && reviewText.trim()) {
      fullMessage += `\n\nRaison: "${reviewText}"`;
    }

    // Create notification for business owner in database
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: businessUserId,
        title: notificationTitle,
        message: fullMessage,
        type: notificationType,
        action_url: `/business-account`,
        metadata: {
          order_id: orderId,
          rating,
          is_satisfied: isSatisfied,
          customer_name: customerName,
          review_text: reviewText,
        },
      });

    if (notifError) {
      console.error("❌ Error creating database notification:", notifError);
    } else {
      console.log(`✅ Database notification created for business user ${businessUserId}`);
    }

    // Fetch push subscriptions for the business user
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", businessUserId)
      .eq("is_active", true);

    if (subError) {
      console.error("❌ Error fetching push subscriptions:", subError);
    }

    console.log(`📲 Found ${subscriptions?.length || 0} active push subscriptions for business user`);

    // Send push notifications
    let pushSuccessCount = 0;
    let pushFailCount = 0;

    if (subscriptions && subscriptions.length > 0) {
      const pushPayload = {
        title: notificationTitle,
        body: fullMessage,
        icon: "/logo-jv.png",
        badge: "/logo-jv.png",
        tag: `order-confirm-${orderId}`,
        data: {
          type: notificationType,
          order_id: orderId,
          rating,
          url: "/business-account",
        },
        requireInteraction: !isSatisfied, // Require interaction for refund requests
      };

      console.log(`📤 Sending push notifications with payload:`, JSON.stringify(pushPayload));

      for (const subscription of subscriptions) {
        const success = await sendWebPush(subscription, pushPayload);
        if (success) {
          pushSuccessCount++;
          // Update last_used_at
          await supabase
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", subscription.id);
        } else {
          pushFailCount++;
          // Deactivate failed subscription
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("id", subscription.id);
        }
      }

      console.log(`📊 Push results: ${pushSuccessCount} success, ${pushFailCount} failed`);
    }

    // Log for refund requests
    if (!isSatisfied) {
      console.log(`🔔 REFUND REQUEST: Order ${orderId}, Rating: ${rating}/5, Reason: "${reviewText || 'Non spécifiée'}"`);
      console.log(`📞 Business should arrange product return for customer ${customerName}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent successfully",
        notificationType,
        pushNotifications: {
          sent: pushSuccessCount,
          failed: pushFailCount,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error in notify-order-confirmation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
