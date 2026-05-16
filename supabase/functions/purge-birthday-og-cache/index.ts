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

// Network reliability tuning
const WARM_TIMEOUT_MS = 6_000;
const FB_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 400;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// Retry on network errors, 408, 429, and 5xx. Honor Retry-After when present.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  label: string,
): Promise<{ ok: boolean; status?: number; body?: string; error?: string; attempts: number }> {
  let lastError = "unknown";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);
      const retryable =
        res.status === 408 || res.status === 429 || res.status >= 500;
      if (!retryable) {
        const body = await res.text().catch(() => "");
        return { ok: res.ok, status: res.status, body, attempts: attempt };
      }
      const retryAfter = Number(res.headers.get("retry-after"));
      const body = await res.text().catch(() => "");
      lastError = `status ${res.status}: ${body.slice(0, 200)}`;
      if (attempt === MAX_ATTEMPTS) {
        return { ok: false, status: res.status, body, error: lastError, attempts: attempt };
      }
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5_000)
        : BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
      console.warn(`[${label}] attempt ${attempt} failed (${lastError}); retrying in ${wait}ms`);
      await sleep(wait);
    } catch (e) {
      lastError = e instanceof Error
        ? `${e.name}: ${e.message}`
        : String(e);
      if (attempt === MAX_ATTEMPTS) {
        return { ok: false, error: lastError, attempts: attempt };
      }
      const wait = BASE_BACKOFF_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
      console.warn(`[${label}] attempt ${attempt} threw (${lastError}); retrying in ${wait}ms`);
      await sleep(wait);
    }
  }
  return { ok: false, error: lastError, attempts: MAX_ATTEMPTS };
}

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

    // 1. Warm the preview function for every crawler UA in parallel,
    //    with timeout + exponential-backoff retries per UA.
    const warmResults = await Promise.allSettled(
      WARM_UAS.map((ua) =>
        fetchWithRetry(
          previewUrl,
          {
            method: "GET",
            headers: { "User-Agent": ua, "Cache-Control": "no-cache" },
          },
          WARM_TIMEOUT_MS,
          `warm:${ua.split("/")[0]}`,
        ).then((r) => ({ ua, ...r })),
      ),
    );

    // 2. Best-effort Facebook Graph API re-scrape (covers WhatsApp too),
    //    with timeout + exponential-backoff retries.
    const fbToken = Deno.env.get("FACEBOOK_APP_ACCESS_TOKEN");
    let fbResult: unknown = "skipped";
    if (fbToken) {
      fbResult = await fetchWithRetry(
        `https://graph.facebook.com/v19.0/?id=${encodeURIComponent(publicUrl)}&scrape=true&access_token=${encodeURIComponent(fbToken)}`,
        { method: "POST" },
        FB_TIMEOUT_MS,
        "fb-scrape",
      );
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