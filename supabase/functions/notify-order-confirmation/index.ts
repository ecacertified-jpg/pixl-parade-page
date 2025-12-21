import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    console.log(`Processing order confirmation: orderId=${orderId}, rating=${rating}, satisfied=${isSatisfied}`);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("business_orders")
      .select("*, business_accounts(user_id, business_name)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
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
      console.error("Business user not found");
      throw new Error("Business user not found");
    }

    let notificationTitle: string;
    let notificationMessage: string;
    let notificationType: string;

    if (isSatisfied) {
      // Positive notification
      notificationTitle = "✓ Réception confirmée";
      notificationMessage = `${customerName} a confirmé la réception de la commande #${shortOrderId} avec une note de ${rating}/5 ⭐`;
      notificationType = "order_confirmed";
    } else {
      // Refund request notification
      notificationTitle = "⚠️ Demande de remboursement";
      notificationMessage = `${customerName} demande un remboursement pour la commande #${shortOrderId} (Note: ${rating}/5). Veuillez organiser la reprise du produit.`;
      notificationType = "refund_requested";
    }

    // Add review text if provided
    if (reviewText && reviewText.trim()) {
      notificationMessage += `\n\nCommentaire: "${reviewText}"`;
    }

    // Create notification for business owner
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: businessUserId,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        action_url: `/business/orders`,
        metadata: {
          order_id: orderId,
          rating,
          is_satisfied: isSatisfied,
          customer_name: customerName,
          review_text: reviewText,
        },
      });

    if (notifError) {
      console.error("Error creating notification:", notifError);
      // Don't throw, just log
    }

    console.log(`Notification sent successfully to business user ${businessUserId}`);

    // If it's a refund request, we could also send an email or additional alerts here
    if (!isSatisfied) {
      console.log(`Refund requested for order ${orderId}. Business should arrange product return.`);
      // Future: Could integrate email notification here
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        notificationType,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notify-order-confirmation:", error);
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
