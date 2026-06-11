import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, sendPushToUsers } from "../_shared/push-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = getAdminClient();
    const sinceIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const { data: memos } = await admin
      .from("birthday_page_photos")
      .select("birthday_page_id")
      .gte("created_at", sinceIso);

    const countByPage = new Map<string, number>();
    for (const m of memos ?? []) {
      const id = m.birthday_page_id as string;
      if (!id) continue;
      countByPage.set(id, (countByPage.get(id) ?? 0) + 1);
    }
    if (countByPage.size === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_memories" }), { headers: corsHeaders });
    }

    const pageIds = Array.from(countByPage.keys());
    const { data: pages } = await admin
      .from("birthday_pages")
      .select("id, user_id, slug, title")
      .in("id", pageIds)
      .eq("is_active", true);

    let totalSent = 0;
    for (const p of pages ?? []) {
      if (!p.user_id) continue;
      const count = countByPage.get(p.id as string) ?? 0;
      if (count < 2) continue;
      const r = await sendPushToUsers({
        user_ids: [p.user_id],
        title: `📚 ${count} nouveaux souvenirs cette semaine !`,
        message: `${count} souvenirs ont été ajoutés à ${p.title || "ta page d'anniversaire"}. Va les redécouvrir ✨`,
        url: `/birthday/${p.slug}`,
        category: "birthday",
        type: "weekly_memory_digest",
        preference_key: "push_weekly_memory_digest",
        data: { page_id: p.id, count },
      });
      totalSent += r.sent;
    }

    return new Response(JSON.stringify({ ok: true, total_sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-weekly-memories error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});