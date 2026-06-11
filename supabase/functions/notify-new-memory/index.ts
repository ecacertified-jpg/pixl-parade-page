import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, sendPushToUsers } from "../_shared/push-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { photo_id, birthday_page_id, uploader_id } = await req.json();
    if (!photo_id || !birthday_page_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = getAdminClient();

    const { data: page } = await admin
      .from("birthday_pages").select("user_id, slug, title")
      .eq("id", birthday_page_id).maybeSingle();
    if (!page) {
      return new Response(JSON.stringify({ skipped: "page_not_found" }), { headers: corsHeaders });
    }

    const recipients = new Set<string>();
    if (page.user_id) recipients.add(page.user_id);

    const { data: friends } = await admin
      .from("birthday_page_friends")
      .select("friend_user_id")
      .eq("page_id", birthday_page_id)
      .not("friend_user_id", "is", null);
    for (const f of friends ?? []) {
      if (f.friend_user_id) recipients.add(f.friend_user_id as string);
    }
    if (uploader_id) recipients.delete(uploader_id);

    if (recipients.size === 0) {
      return new Response(JSON.stringify({ skipped: "no_recipients" }), { headers: corsHeaders });
    }

    const { data: uploader } = uploader_id
      ? await admin.from("profiles").select("first_name").eq("user_id", uploader_id).maybeSingle()
      : { data: null as any };
    const name = uploader?.first_name || "Un ami";

    const result = await sendPushToUsers({
      user_ids: Array.from(recipients),
      title: `📸 Nouveau souvenir !`,
      message: `${name} vient d'ajouter un souvenir sur ${page.title || "la page d'anniversaire"}. Va le découvrir 💜`,
      url: `/birthday/${page.slug}`,
      category: "birthday",
      type: "new_memory",
      preference_key: "push_new_memory",
      data: { photo_id, page_slug: page.slug },
    });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-new-memory error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});