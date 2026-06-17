import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Check campaign is active
    const { data: campaign } = await supabase
      .from("emotional_campaigns")
      .select("*")
      .eq("key", "on_this_day")
      .eq("is_active", true)
      .maybeSingle();

    if (!campaign) {
      return new Response(JSON.stringify({ skipped: "campaign disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const currentYear = today.getFullYear();

    // Fetch birthday page photos uploaded same MM-DD in prior years
    const { data: bdayPhotos } = await supabase
      .from("birthday_page_photos")
      .select("id, uploaded_by, media_url, media_type, created_at, page_id")
      .lt("created_at", `${currentYear}-01-01`)
      .limit(500);

    const { data: eventPhotos } = await supabase
      .from("event_page_photos")
      .select("id, uploaded_by, media_url, media_type, created_at, event_page_id")
      .lt("created_at", `${currentYear}-01-01`)
      .limit(500);

    const candidates: Array<{
      user_id: string;
      source_type: string;
      source_id: string;
      memory_date: string;
      media_url: string;
      years_ago: number;
    }> = [];

    for (const p of bdayPhotos || []) {
      if (!p.uploaded_by || !p.created_at) continue;
      const d = new Date(p.created_at);
      const pmm = String(d.getMonth() + 1).padStart(2, "0");
      const pdd = String(d.getDate()).padStart(2, "0");
      if (pmm === mm && pdd === dd) {
        candidates.push({
          user_id: p.uploaded_by,
          source_type: "birthday_photo",
          source_id: p.id,
          memory_date: d.toISOString().slice(0, 10),
          media_url: p.media_url,
          years_ago: currentYear - d.getFullYear(),
        });
      }
    }
    for (const p of eventPhotos || []) {
      if (!p.uploaded_by || !p.created_at) continue;
      const d = new Date(p.created_at);
      const pmm = String(d.getMonth() + 1).padStart(2, "0");
      const pdd = String(d.getDate()).padStart(2, "0");
      if (pmm === mm && pdd === dd) {
        candidates.push({
          user_id: p.uploaded_by,
          source_type: "event_photo",
          source_id: p.id,
          memory_date: d.toISOString().slice(0, 10),
          media_url: p.media_url,
          years_ago: currentYear - d.getFullYear(),
        });
      }
    }

    // Group by user, pick best memory (oldest = most nostalgic)
    const byUser = new Map<string, typeof candidates[0]>();
    for (const c of candidates) {
      const cur = byUser.get(c.user_id);
      if (!cur || c.years_ago > cur.years_ago) byUser.set(c.user_id, c);
    }

    let sent = 0;
    let skipped = 0;

    for (const [userId, mem] of byUser.entries()) {
      // Dedup check
      const { data: existing } = await supabase
        .from("on_this_day_log")
        .select("id")
        .eq("user_id", userId)
        .eq("memory_date", mem.memory_date)
        .eq("source_type", mem.source_type)
        .eq("source_id", mem.source_id)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const yearsLabel = mem.years_ago === 1 ? "1 an" : `${mem.years_ago} ans`;
      const title = `Il y a ${yearsLabel} jour pour jour 💫`;
      const message = `Un souvenir précieux à revivre. Replonge dans ce moment magique.`;

      await supabase.from("scheduled_notifications").insert({
        user_id: userId,
        notification_type: "on_this_day",
        smart_notification_category: "memory",
        title,
        message,
        priority_score: 75,
        metadata: {
          media_url: mem.media_url,
          memory_date: mem.memory_date,
          years_ago: mem.years_ago,
          source_type: mem.source_type,
          action_url: "/souvenirs",
        },
        scheduled_for: new Date().toISOString(),
      });

      await supabase.from("on_this_day_log").insert({
        user_id: userId,
        memory_date: mem.memory_date,
        source_type: mem.source_type,
        source_id: mem.source_id,
      });

      sent++;
    }

    await supabase
      .from("emotional_campaigns")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_stats: { sent, skipped, candidates: candidates.length },
      })
      .eq("id", campaign.id);

    return new Response(JSON.stringify({ sent, skipped, candidates: candidates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("on-this-day error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});