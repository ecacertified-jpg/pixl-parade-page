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
      details: [] as { id: string; name: string; status: string; deleted?: object; error?: string }[],
    };

    for (const business of expiredBusinesses || []) {
      try {
        console.log(`[Purge] Processing business: ${business.business_name} (${business.id})`);

        // Call centralized cascade deletion function
        const { data, error } = await supabaseAdmin.functions.invoke('delete-business-cascade', {
          body: {
            business_id: business.id,
            business_user_id: business.user_id,
            business_name: business.business_name,
            admin_user_id: null, // System action
            action_type: 'auto_purge'
          }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Cascade deletion failed');

        results.purged++;
        results.details.push({
          id: business.id,
          name: business.business_name,
          status: "purged",
          deleted: data.deleted,
        });

        console.log(`[Purge] Successfully purged: ${business.business_name}`, data.deleted);
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
