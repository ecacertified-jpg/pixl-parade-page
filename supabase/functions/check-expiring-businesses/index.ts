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
    // Businesses expiring in 3 days (between 2 and 4 days to catch the window)
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    console.log(`[CheckExpiring] Checking businesses expiring between ${twoDaysFromNow.toISOString()} and ${fourDaysFromNow.toISOString()}`);

    // Find businesses expiring in ~3 days
    const { data: expiringArchives, error: archiveError } = await supabaseAdmin
      .from("deleted_business_archives")
      .select("business_id, expires_at, deleted_at")
      .gte("expires_at", twoDaysFromNow.toISOString())
      .lt("expires_at", fourDaysFromNow.toISOString());

    if (archiveError) {
      console.error("[CheckExpiring] Error fetching archives:", archiveError);
      throw archiveError;
    }

    if (!expiringArchives || expiringArchives.length === 0) {
      console.log("[CheckExpiring] No businesses expiring in 3 days");
      return new Response(
        JSON.stringify({ success: true, message: "No expiring businesses found", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const businessIds = expiringArchives.map((a) => a.business_id);
    console.log(`[CheckExpiring] Found ${businessIds.length} businesses expiring soon`);

    // Get business details
    const { data: businesses, error: bizError } = await supabaseAdmin
      .from("business_accounts")
      .select("id, business_name, business_type")
      .in("id", businessIds);

    if (bizError) {
      console.error("[CheckExpiring] Error fetching businesses:", bizError);
      throw bizError;
    }

    // Check for existing notifications to avoid duplicates
    const { data: existingNotifs, error: notifError } = await supabaseAdmin
      .from("admin_notifications")
      .select("entity_id")
      .eq("type", "business_expiring")
      .in("entity_id", businessIds)
      .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

    if (notifError) {
      console.error("[CheckExpiring] Error checking existing notifications:", notifError);
    }

    const alreadyNotifiedIds = new Set((existingNotifs || []).map((n) => n.entity_id));
    const businessesToNotify = (businesses || []).filter((b) => !alreadyNotifiedIds.has(b.id));

    console.log(`[CheckExpiring] ${businessesToNotify.length} businesses need notification (${alreadyNotifiedIds.size} already notified)`);

    const notifications = [];

    for (const business of businessesToNotify) {
      const archive = expiringArchives.find((a) => a.business_id === business.id);
      if (!archive) continue;

      const expiresAt = new Date(archive.expires_at);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      notifications.push({
        admin_user_id: null, // All admins
        type: "business_expiring",
        title: "⏰ Business expirant bientôt",
        message: `"${business.business_name}" sera supprimé définitivement dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`,
        severity: "warning",
        entity_type: "business",
        entity_id: business.id,
        action_url: "/admin/deleted-businesses",
        metadata: {
          business_name: business.business_name,
          business_type: business.business_type,
          expires_at: archive.expires_at,
          deleted_at: archive.deleted_at,
          days_remaining: daysRemaining,
        },
      });
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("admin_notifications")
        .insert(notifications);

      if (insertError) {
        console.error("[CheckExpiring] Error inserting notifications:", insertError);
        throw insertError;
      }

      // Log the action
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_user_id: "00000000-0000-0000-0000-000000000000", // System user
        action_type: "auto_expiration_warning",
        target_type: "notification",
        target_id: null,
        description: `${notifications.length} notification(s) d'expiration créée(s) pour les businesses dans la corbeille`,
        metadata: {
          businesses: notifications.map((n) => ({
            id: n.entity_id,
            name: n.metadata.business_name,
            days_remaining: n.metadata.days_remaining,
          })),
        },
      });

      console.log(`[CheckExpiring] Created ${notifications.length} notifications`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${notifications.length} notification(s) created`,
        notified: notifications.length,
        skipped: alreadyNotifiedIds.size,
        details: notifications.map((n) => ({
          business_id: n.entity_id,
          business_name: n.metadata.business_name,
          days_remaining: n.metadata.days_remaining,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CheckExpiring] Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
