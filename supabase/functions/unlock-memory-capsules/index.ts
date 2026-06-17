import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: due, error } = await supabase
      .from("memory_capsules")
      .select("id, user_id, title, recipients")
      .eq("is_unlocked", false)
      .lte("unlock_date", today);

    if (error) throw error;

    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ unlocked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = due.map((c) => c.id);
    const { error: updErr } = await supabase
      .from("memory_capsules")
      .update({ is_unlocked: true, notified_at: new Date().toISOString() })
      .in("id", ids);
    if (updErr) throw updErr;

    // Best-effort: create in-app notifications for owner + recipients
    const rows: any[] = [];
    for (const c of due) {
      const targets = new Set<string>([c.user_id, ...(Array.isArray(c.recipients) ? c.recipients : [])]);
      for (const uid of targets) {
        if (!uid) continue;
        rows.push({
          user_id: uid,
          title: "Ta capsule s'ouvre 🎁",
          message: `"${c.title}" est prête à être (re)découverte.`,
          type: "memory_capsule_unlocked",
          action_url: `/souvenirs/capsule/${c.id}`,
          metadata: { capsule_id: c.id },
        });
      }
    }
    if (rows.length > 0) {
      await supabase.from("notifications").insert(rows);
    }

    return new Response(JSON.stringify({ unlocked: ids.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("unlock-memory-capsules error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});