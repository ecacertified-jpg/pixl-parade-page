import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log(`[Purge] Starting purge of deleted businesses older than ${thirtyDaysAgo.toISOString()}`);

    // Find expired businesses
    const { data: expiredBusinesses, error: fetchError } = await supabaseAdmin
      .from("business_accounts")
      .select("id, business_name, user_id, deleted_at")
      .not("deleted_at", "is", null)
      .lt("deleted_at", thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error("[Purge] Error fetching expired businesses:", fetchError);
      throw fetchError;
    }

    console.log(`[Purge] Found ${expiredBusinesses?.length || 0} expired businesses to purge`);

    const results = {
      purged: 0,
      failed: 0,
      details: [] as { id: string; name: string; status: string; error?: string }[],
    };

    for (const business of expiredBusinesses || []) {
      try {
        console.log(`[Purge] Processing business: ${business.business_name} (${business.id})`);

        // 1. Get products for this business
        const { data: products } = await supabaseAdmin
          .from("products")
          .select("id")
          .eq("business_account_id", business.id);

        // 2. Delete product ratings
        if (products && products.length > 0) {
          const productIds = products.map((p) => p.id);
          await supabaseAdmin
            .from("product_ratings")
            .delete()
            .in("product_id", productIds);
        }

        // 3. Delete products
        await supabaseAdmin
          .from("products")
          .delete()
          .eq("business_account_id", business.id);

        // 4. Delete categories
        await supabaseAdmin
          .from("business_categories")
          .delete()
          .eq("business_owner_id", business.user_id);

        // 5. Handle funds
        const { data: funds } = await supabaseAdmin
          .from("collective_funds")
          .select("id, fund_contributions(id)")
          .eq("created_by_business_id", business.id);

        if (funds) {
          const fundsWithContribs = funds.filter(
            (f) => Array.isArray(f.fund_contributions) && f.fund_contributions.length > 0
          );
          const fundsWithoutContribs = funds.filter(
            (f) => !Array.isArray(f.fund_contributions) || f.fund_contributions.length === 0
          );

          // Disassociate funds with contributions
          if (fundsWithContribs.length > 0) {
            await supabaseAdmin
              .from("collective_funds")
              .update({ created_by_business_id: null })
              .in("id", fundsWithContribs.map((f) => f.id));
          }

          // Delete empty funds
          if (fundsWithoutContribs.length > 0) {
            const fundIds = fundsWithoutContribs.map((f) => f.id);
            await supabaseAdmin.from("fund_comments").delete().in("fund_id", fundIds);
            await supabaseAdmin.from("fund_activities").delete().in("fund_id", fundIds);
            await supabaseAdmin.from("collective_funds").delete().in("id", fundIds);
          }
        }

        // 6. Delete orders
        await supabaseAdmin
          .from("business_orders")
          .delete()
          .eq("business_account_id", business.id);

        // 7. Delete archive
        await supabaseAdmin
          .from("deleted_business_archives")
          .delete()
          .eq("business_id", business.id);

        // 8. Delete business account
        const { error: deleteError } = await supabaseAdmin
          .from("business_accounts")
          .delete()
          .eq("id", business.id);

        if (deleteError) throw deleteError;

        // 9. Log the purge
        await supabaseAdmin.from("admin_audit_logs").insert({
          admin_user_id: "00000000-0000-0000-0000-000000000000", // System user
          action_type: "auto_purge_business",
          target_type: "business",
          target_id: business.id,
          description: `Business "${business.business_name}" purgé automatiquement (30 jours écoulés)`,
          metadata: { 
            business_name: business.business_name,
            deleted_at: business.deleted_at,
            purged_at: now.toISOString()
          },
        });

        results.purged++;
        results.details.push({
          id: business.id,
          name: business.business_name,
          status: "purged",
        });

        console.log(`[Purge] Successfully purged: ${business.business_name}`);
      } catch (error) {
        console.error(`[Purge] Error purging business ${business.id}:`, error);
        results.failed++;
        results.details.push({
          id: business.id,
          name: business.business_name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Clean up expired archives (safety net)
    const { error: cleanupError } = await supabaseAdmin
      .from("deleted_business_archives")
      .delete()
      .lt("expires_at", now.toISOString());

    if (cleanupError) {
      console.error("[Purge] Error cleaning up expired archives:", cleanupError);
    }

    console.log(`[Purge] Completed. Purged: ${results.purged}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Purge completed. ${results.purged} businesses purged, ${results.failed} failed.`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Purge] Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
