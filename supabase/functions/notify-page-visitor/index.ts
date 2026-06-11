import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, sendPushToUsers } from "../_shared/push-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { photo_id, viewer_id } = await req.json();
    if (!photo_id || !viewer_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = getAdminClient();

    // Resolve owner of the birthday page
    const { data: photo } = await admin
      .from("birthday_page_photos")
      .select("birthday_page_id")
      .eq("id", photo_id)
      .maybeSingle();
    if (!photo?.birthday_page_id) {
      return new Response(JSON.stringify({ skipped: "photo_not_found" }), { headers: corsHeaders });
    }
    const { data: page } = await admin
      .from("birthday_pages")
      .select("user_id, slug")
      .eq("id", photo.birthday_page_id)
      .maybeSingle();
    if (!page?.user_id || page.user_id === viewer_id) {
      return new Response(JSON.stringify({ skipped: "self_or_unknown" }), { headers: corsHeaders });
    }

    // Anti-spam: 1/day per (page, viewer)
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: dedup } = await admin
      .from("birthday_page_activity_notifs")
      .select("id")
      .eq("birthday_page_id", photo.birthday_page_id)
      .eq("actor_user_id", viewer_id)
      .eq("action_type", "visit")
      .gte("created_at", since)
      .limit(1);
    if (dedup && dedup.length > 0) {
      return new Response(JSON.stringify({ skipped: "rate_limited" }), { headers: corsHeaders });
    }
    await admin.from("birthday_page_activity_notifs").insert({
      birthday_page_id: photo.birthday_page_id,
      actor_user_id: viewer_id,
      action_type: "visit",
    });

    const { data: visitor } = await admin
      .from("profiles").select("first_name").eq("user_id", viewer_id).maybeSingle();
    const visitorName = visitor?.first_name || "Quelqu'un";

    const result = await sendPushToUsers({
      user_ids: [page.user_id],
      title: `👀 ${visitorName} visite ta page d'anniversaire !`,
      message: `Ton album reçoit de l'amour. Va voir qui passe te souhaiter du bonheur 💜`,
      url: `/birthday/${page.slug}`,
      category: "birthday",
      type: "page_visitor",
      preference_key: "push_new_visitor",
      data: { page_slug: page.slug, visitor_id: viewer_id },
    });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-page-visitor error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});