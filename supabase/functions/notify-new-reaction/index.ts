import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, sendPushToUsers } from "../_shared/push-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMOJI: Record<string, string> = {
  like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡",
  fire: "🔥", clap: "👏", heart: "❤️",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { kind, target_id, actor_id, reaction_type } = await req.json();
    if (!kind || !target_id || !actor_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = getAdminClient();
    let ownerId: string | null = null;
    let url: string | undefined;

    if (kind === "post") {
      const { data: p } = await admin
        .from("posts").select("user_id, id").eq("id", target_id).maybeSingle();
      ownerId = p?.user_id ?? null;
      url = `/community?post=${target_id}`;
    } else if (kind === "album_photo") {
      const { data: photo } = await admin
        .from("birthday_page_photos")
        .select("birthday_page_id, uploader_id")
        .eq("id", target_id).maybeSingle();
      if (photo) {
        const { data: page } = await admin
          .from("birthday_pages").select("user_id, slug")
          .eq("id", photo.birthday_page_id).maybeSingle();
        ownerId = page?.user_id ?? photo.uploader_id ?? null;
        if (page?.slug) url = `/birthday/${page.slug}`;
      }
    }

    if (!ownerId || ownerId === actor_id) {
      return new Response(JSON.stringify({ skipped: "self_or_unknown" }), { headers: corsHeaders });
    }

    const { data: actor } = await admin
      .from("profiles").select("first_name").eq("user_id", actor_id).maybeSingle();
    const name = actor?.first_name || "Quelqu'un";
    const emoji = EMOJI[reaction_type] || "💖";

    const result = await sendPushToUsers({
      user_ids: [ownerId],
      title: `${emoji} ${name} a réagi !`,
      message:
        kind === "post"
          ? `${name} a réagi à ta publication. Va voir ce qui se passe !`
          : `${name} a réagi à une de tes photos d'anniversaire.`,
      url,
      category: "birthday",
      type: "new_reaction",
      preference_key: "push_new_reaction",
      data: { kind, target_id, actor_id, reaction_type },
    });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-new-reaction error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});