import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";
const PREVIEW_FN = `${SUPABASE_URL}/functions/v1/birthday-preview`;

// User agents we want to warm so each social network gets the new HTML
// immediately instead of waiting for its next organic scrape.
const WARM_UAS = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "WhatsApp/2.23.20.0",
  "Twitterbot/1.0",
  "LinkedInBot/1.0 (compatible; Mozilla/5.0)",
  "TelegramBot (like TwitterBot)",
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "Discordbot/2.0 (+https://discordapp.com)",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let slug: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      slug = typeof body?.slug === "string" ? body.slug.trim() : null;
    } else {
      slug = new URL(req.url).searchParams.get("slug");
    }

    if (!slug || slug.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return new Response(JSON.stringify({ error: "invalid slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previewUrl = `${PREVIEW_FN}?slug=${encodeURIComponent(slug)}&_=${Date.now()}`;
    const publicUrl = `https://joiedevivre-africa.com/birthday/${encodeURIComponent(slug)}`;

    // 1. Warm the preview function for every crawler UA in parallel
    const warmResults = await Promise.allSettled(
      WARM_UAS.map((ua) =>
        fetch(previewUrl, {
          method: "GET",
          headers: { "User-Agent": ua, "Cache-Control": "no-cache" },
        }).then((r) => ({ ua, status: r.status })),
      ),
    );

    // 2. Best-effort Facebook Graph API re-scrape (covers WhatsApp too)
    const fbToken = Deno.env.get("FACEBOOK_APP_ACCESS_TOKEN");
    let fbResult: unknown = "skipped";
    if (fbToken) {
      try {
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/?id=${encodeURIComponent(publicUrl)}&scrape=true&access_token=${encodeURIComponent(fbToken)}`,
          { method: "POST" },
        );
        fbResult = { status: fbRes.status, body: await fbRes.text() };
      } catch (e) {
        fbResult = { error: String(e) };
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        slug,
        warmed: warmResults.map((r) =>
          r.status === "fulfilled" ? r.value : { error: String(r.reason) },
        ),
        facebook: fbResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("purge-birthday-og-cache error:", err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});