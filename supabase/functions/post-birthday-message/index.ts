import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ALLOWED_MEDIA = ["text","gif","sticker","card","emoji","image","youtube","audio","animated_text"];
const ALLOWED_TONES = ["joyeux","tendre","humour","solennel"];

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function moderate(text: string, mediaType: string): Promise<{ status: "safe"|"borderline"|"unsafe"; reason?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || (!text.trim() && mediaType !== "text")) return { status: "safe" };
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Tu es un modérateur de contenu pour une plateforme d'anniversaires familiale en français (Afrique de l'Ouest). Classe le message en safe (bienveillant ou neutre), borderline (ambigu, vulgaire léger, ironie agressive) ou unsafe (haine, insulte forte, sexualité explicite, menace, arnaque)." },
          { role: "user", content: `Message: ${text}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify",
            description: "Classify the moderation status",
            parameters: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["safe","borderline","unsafe"] },
                reason: { type: "string" },
              },
              required: ["status"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify" } },
      }),
    });
    if (!resp.ok) return { status: "safe" };
    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return { status: "safe" };
    const args = JSON.parse(call.function?.arguments ?? "{}");
    if (["safe","borderline","unsafe"].includes(args.status)) {
      return { status: args.status, reason: args.reason };
    }
    return { status: "safe" };
  } catch (e) {
    console.error("moderation error", e);
    return { status: "safe" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const salt = Deno.env.get("VISITOR_PHONE_SALT") ?? "";

    const body = await req.json();
    const pageKind: "birthday" | "event" = body?.page_kind === "event" ? "event" : "birthday";
    const slug = String(body?.slug ?? "").trim();
    const messageText = String(body?.message_text ?? "").trim().slice(0, 500);
    const mediaType = ALLOWED_MEDIA.includes(body?.media_type) ? body.media_type : "text";
    const mediaUrl = body?.media_url ? String(body.media_url).slice(0, 1000) : null;
    const mediaMetadata = body?.media_metadata && typeof body.media_metadata === "object" ? body.media_metadata : null;
    const tone = ALLOWED_TONES.includes(body?.tone) ? body.tone : null;
    const cardTemplateId = body?.card_template_id ?? null;
    const audioBase64 = body?.audio_base64 ? String(body.audio_base64) : null;
    const visitor = body?.visitor && typeof body.visitor === "object" ? body.visitor : null;

    if (!slug) return json(400, { error: "slug requis" });
    if (mediaType === "text" && !messageText) return json(400, { error: "Message vide" });
    if (mediaType !== "text" && mediaType !== "audio" && !mediaUrl && !cardTemplateId) {
      return json(400, { error: "Média requis pour ce type" });
    }

    // Service role client
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Find page (birthday or event)
    const pagesTable = pageKind === "event" ? "event_pages" : "birthday_pages";
    const ownerCol = pageKind === "event" ? "creator_id" : "user_id";
    const { data: page, error: pageErr } = await admin
      .from(pagesTable)
      .select(`id, ${ownerCol}, is_active`)
      .eq("slug", slug)
      .maybeSingle();
    if (pageErr) console.error("post-birthday-message page lookup error", { pagesTable, slug, pageErr });
    if (!page) console.warn("post-birthday-message page not found", { pagesTable, slug });
    if (pageErr || !page || !(page as any).is_active) {
      return json(404, { error: "Page introuvable ou inactive" });
    }
    const ownerId = (page as any)[ownerCol];

    // Auth context (optional)
    let senderId: string | null = null;
    let senderName: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user?.id) {
        senderId = userData.user.id;
        const { data: profile } = await admin
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", senderId)
          .maybeSingle();
        if (profile) {
          senderName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || null;
        }
      }
    }

    // Visitor identity (when not authenticated)
    let visitorFirstName: string | null = null;
    let visitorPhoneHash: string | null = null;
    let visitorPhoneCountry: string | null = null;
    if (!senderId) {
      if (!visitor?.first_name || !visitor?.phone) {
        return json(400, { error: "Identité visiteur requise (prénom + téléphone)" });
      }
      visitorFirstName = String(visitor.first_name).trim().slice(0, 50);
      const phoneClean = String(visitor.phone).replace(/[^\d+]/g, "");
      if (phoneClean.length < 8) return json(400, { error: "Téléphone invalide" });
      visitorPhoneHash = await sha256Hex(`${salt}:${phoneClean}`);
      visitorPhoneCountry = visitor.country_code ? String(visitor.country_code).slice(0, 5) : null;
      senderName = visitorFirstName;
    }

    // Upload audio if provided
    let audioUrl: string | null = null;
    if (mediaType === "audio" && audioBase64) {
      try {
        const b64 = audioBase64.replace(/^data:.+;base64,/, "");
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        if (bytes.byteLength > 2_000_000) return json(400, { error: "Audio trop lourd (max 2 Mo)" });
        const filename = `${page.id}/${crypto.randomUUID()}.webm`;
        const { error: upErr } = await admin.storage
          .from("birthday-message-media")
          .upload(filename, bytes, { contentType: "audio/webm", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = admin.storage.from("birthday-message-media").getPublicUrl(filename);
        audioUrl = pub.publicUrl;
      } catch (e) {
        console.error("audio upload error", e);
        return json(500, { error: "Échec upload audio" });
      }
    }

    // Moderation
    const mod = await moderate(messageText, mediaType);
    if (mod.status === "unsafe") {
      return json(422, {
        error: "Ton message a été refusé par notre modération. Reformule-le avec bienveillance 💛",
        moderation_status: "unsafe",
        moderation_reason: mod.reason,
      });
    }

    const baseInsert: Record<string, unknown> = {
      sender_id: senderId,
      sender_name: senderName,
      message_text: messageText || null,
      media_type: mediaType,
      media_url: mediaUrl,
      media_metadata: mediaMetadata,
      audio_url: audioUrl,
      card_template_id: cardTemplateId,
      visitor_first_name: visitorFirstName,
      visitor_phone_hash: visitorPhoneHash,
      visitor_phone_country: visitorPhoneCountry,
      tone,
      moderation_status: mod.status,
      moderation_reason: mod.reason ?? null,
    };

    const messagesTable = pageKind === "event" ? "event_wishes_messages" : "birthday_wishes_messages";
    const insertPayload =
      pageKind === "event"
        ? { ...baseInsert, event_page_id: page.id }
        : {
            ...baseInsert,
            birthday_user_id: ownerId,
            birthday_page_id: page.id,
            celebration_year: new Date().getUTCFullYear(),
          };

    const { data: inserted, error: insErr } = await admin
      .from(messagesTable)
      .insert(insertPayload)
      .select("id, sender_id, sender_name, message_text, media_type, media_url, media_metadata, audio_url, card_template_id, tone, moderation_status, is_hidden, reactions_count, created_at")
      .single();
    if (insErr) {
      console.error("insert error", insErr);
      return json(500, { error: "Échec enregistrement message" });
    }

    return json(200, { message: inserted, moderation_status: mod.status });
  } catch (e) {
    console.error("post-birthday-message error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown" });
  }
});