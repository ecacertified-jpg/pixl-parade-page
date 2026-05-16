import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://joiedevivre-africa.com";
const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";
const BIRTHDAY_OG_FN = `${SUPABASE_URL}/functions/v1/generate-birthday-og-image`;
const BIRTHDAY_PREVIEW_FN = `${SUPABASE_URL}/functions/v1/birthday-preview`;

// Best-effort: ask social networks to re-fetch the page.
// All failures are swallowed — they should not block invalidation.
async function pingScrapers(pageUrl: string): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Facebook / WhatsApp share the same crawler & cache.
  const fbToken = Deno.env.get("FACEBOOK_APP_ACCESS_TOKEN");
  if (fbToken) {
    try {
      const r = await fetch("https://graph.facebook.com/v19.0/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          id: pageUrl,
          scrape: "true",
          access_token: fbToken,
        }),
      });
      results.facebook = `${r.status}`;
    } catch (e) {
      results.facebook = `err:${(e as Error).message}`;
    }
  } else {
    results.facebook = "skipped:no_token";
  }

  // LinkedIn post inspector (anonymous, best-effort).
  try {
    const r = await fetch(
      `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(pageUrl)}`,
      { method: "GET" },
    );
    results.linkedin = `${r.status}`;
  } catch (e) {
    results.linkedin = `err:${(e as Error).message}`;
  }

  // Warm our own preview cache with a crawler UA so the next real crawler
  // hit is already cached at the CDN with the new version.
  try {
    const r = await fetch(`${BIRTHDAY_PREVIEW_FN}/${encodeURIComponent(pageUrl.split("/").pop()!)}`, {
      headers: { "User-Agent": "facebookexternalhit/1.1 (cache-warm)" },
    });
    results.warm_preview = `${r.status}`;
  } catch (e) {
    results.warm_preview = `err:${(e as Error).message}`;
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";

    if (!slug || !/^[a-zA-Z0-9_-]{1,120}$/.test(slug)) {
      return new Response(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Touch birthday_pages.updated_at to bump the version stamp used by
    //    birthday-preview when building the og:image URL.
    const { data: page, error: bumpErr } = await supabaseAdmin
      .from("birthday_pages")
      .update({ updated_at: new Date().toISOString() })
      .eq("slug", slug)
      .select("slug, celebration_year")
      .maybeSingle();

    if (bumpErr || !page) {
      return new Response(
        JSON.stringify({ error: "Page not found", details: bumpErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Drop existing OG-image cache rows for this slug so the next request
    //    regenerates from scratch (defensive — version bump alone usually
    //    invalidates because cache_key embeds the version).
    const { error: delErr } = await supabaseAdmin
      .from("og_image_cache_metadata")
      .delete()
      .eq("entity_type", "birthday")
      .eq("entity_id", slug);
    if (delErr) console.error("cache metadata delete error:", delErr);

    // 3. Regenerate the OG image right away so the first crawler hit is fast.
    const version = Math.floor(Date.now() / 1000).toString();
    try {
      await fetch(
        `${BIRTHDAY_OG_FN}?slug=${encodeURIComponent(slug)}&v=${version}&refresh=true`,
      );
    } catch (e) {
      console.error("regenerate failed:", e);
    }

    // 4. Ping external scrapers + warm our own preview cache.
    const pageUrl = `${SITE_URL}/birthday/${slug}`;
    const ping = await pingScrapers(pageUrl);

    return new Response(
      JSON.stringify({ success: true, slug, version, pageUrl, ping }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("invalidate-birthday-og error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});