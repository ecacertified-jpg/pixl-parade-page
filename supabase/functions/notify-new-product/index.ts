import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyNewProductPayload {
  productId: string;
  productName: string;
  businessId: string;
  businessName?: string;
  productImage?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotifyNewProductPayload = await req.json();
    const { productId, productName, businessId, businessName, productImage } = payload;

    console.log(`[notify-new-product] Processing new product: ${productName} from business ${businessId}`);

    if (!productId || !businessId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: productId, businessId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les infos de la boutique si pas fournies
    let businessInfo = { business_name: businessName || "Une boutique" };
    if (!businessName) {
      const { data: business, error: businessError } = await supabase
        .from("business_accounts")
        .select("business_name, logo_url")
        .eq("id", businessId)
        .single();

      if (businessError) {
        console.error("[notify-new-product] Error fetching business:", businessError);
      } else if (business) {
        businessInfo = business;
      }
    }

    // Récupérer tous les followers de la boutique
    const { data: followers, error: followersError } = await supabase
      .from("business_follows")
      .select("follower_id")
      .eq("business_id", businessId);

    if (followersError) {
      console.error("[notify-new-product] Error fetching followers:", followersError);
      throw followersError;
    }

    if (!followers || followers.length === 0) {
      console.log("[notify-new-product] No followers to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No followers to notify", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[notify-new-product] Found ${followers.length} followers to notify`);

    // Créer les notifications pour chaque follower
    const notifications = followers.map((follower) => ({
      user_id: follower.follower_id,
      type: "new_product",
      title: `🆕 Nouveau chez ${businessInfo.business_name}`,
      message: `${businessInfo.business_name} vient d'ajouter : ${productName}`,
      action_url: `/boutique/${businessId}?product=${productId}`,
      metadata: {
        product_id: productId,
        product_name: productName,
        product_image: productImage,
        business_id: businessId,
        business_name: businessInfo.business_name,
      },
      is_read: false,
    }));

    // Insérer les notifications in-app
    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("[notify-new-product] Error inserting notifications:", insertError);
      throw insertError;
    }

    // Créer aussi les notifications push programmées
    const scheduledNotifications = followers.map((follower) => ({
      user_id: follower.follower_id,
      notification_type: "new_product",
      title: `🆕 Nouveau produit !`,
      body: `${businessInfo.business_name} a ajouté : ${productName}`,
      scheduled_for: new Date().toISOString(),
      status: "pending",
      metadata: {
        product_id: productId,
        business_id: businessId,
        action_url: `/boutique/${businessId}?product=${productId}`,
      },
    }));

    const { error: scheduleError } = await supabase
      .from("scheduled_notifications")
      .insert(scheduledNotifications);

    if (scheduleError) {
      console.error("[notify-new-product] Error scheduling push notifications:", scheduleError);
      // Ne pas échouer complètement si les push échouent
    }

    console.log(`[notify-new-product] Successfully notified ${followers.length} followers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notified ${followers.length} followers`,
        notified: followers.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[notify-new-product] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
