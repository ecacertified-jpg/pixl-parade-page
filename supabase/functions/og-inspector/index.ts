// Edge function: og-inspector
// Fetches an arbitrary URL using a WhatsApp / Facebook crawler User-Agent
// and returns the OpenGraph / Twitter meta tags actually served to crawlers.
// Used by the admin "Aperçu social" page to verify that the right
// title/description/image are served and that the cache has been refreshed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CRAWLER_UA: Record<string, string> = {
  whatsapp:
    "WhatsApp/2.23.20.0 A facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  facebook:
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  twitter: "Twitterbot/1.0",
  linkedin: "LinkedInBot/1.0 (compatible; Mozilla/5.0; +http://www.linkedin.com)",
  telegram: "TelegramBot (like TwitterBot)",
  slack: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  discord: "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
};

function pickMeta(html: string, ...keys: string[]): string | null {
  for (const key of keys) {
    // property="og:image" content="..."  OR  name="twitter:image" content="..."
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${key.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      )}["'][^>]*content\\s*=\\s*["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
    // Reversed attribute order: content="..." property="og:image"
    const re2 = new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]*(?:property|name)\\s*=\\s*["']${key.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      )}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2?.[1]) return m2[1].trim();
  }
  return null;
}

function extractAllMeta(html: string): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  const re =
    /<meta\b[^>]*(?:property|name)\s*=\s*["']((?:og|twitter)[:][^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const valM = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (valM) out.push({ key: m[1], value: valM[1] });
  }
  return out;
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

  let body: { url?: string; crawler?: string; bypassCache?: boolean };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return new Response(JSON.stringify({ error: "url is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!/^https?:$/.test(target.protocol)) {
    return new Response(JSON.stringify({ error: "Only http/https URLs are supported" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.bypassCache) {
    target.searchParams.set("_ogv", String(Date.now()));
  }

  const ua = CRAWLER_UA[body.crawler ?? "whatsapp"] ?? CRAWLER_UA.whatsapp;

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": ua,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `Fetch failed: ${(e as Error).message}` }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const elapsedMs = Date.now() - startedAt;
  const html = await res.text();
  // Limit parsed HTML to <head> to avoid scanning huge SPA bundles
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const headHtml = headMatch ? headMatch[0] : html.slice(0, 200_000);

  const meta = {
    ogTitle: pickMeta(headHtml, "og:title"),
    ogDescription: pickMeta(headHtml, "og:description"),
    ogUrl: pickMeta(headHtml, "og:url"),
    ogType: pickMeta(headHtml, "og:type"),
    ogImage: pickMeta(headHtml, "og:image", "og:image:secure_url"),
    ogImageAlt: pickMeta(headHtml, "og:image:alt"),
    ogImageWidth: pickMeta(headHtml, "og:image:width"),
    ogImageHeight: pickMeta(headHtml, "og:image:height"),
    twitterTitle: pickMeta(headHtml, "twitter:title"),
    twitterDescription: pickMeta(headHtml, "twitter:description"),
    twitterImage: pickMeta(headHtml, "twitter:image", "twitter:image:src"),
    twitterCard: pickMeta(headHtml, "twitter:card"),
  };

  // Best-effort fetch of the image to confirm it actually loads for crawlers.
  let imageCheck: {
    url: string;
    status: number | null;
    contentType: string | null;
    contentLength: number | null;
    ok: boolean;
    error?: string;
  } | null = null;
  if (meta.ogImage) {
    try {
      const imgRes = await fetch(meta.ogImage, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": ua },
      });
      imageCheck = {
        url: meta.ogImage,
        status: imgRes.status,
        contentType: imgRes.headers.get("content-type"),
        contentLength: Number(imgRes.headers.get("content-length")) || null,
        ok: imgRes.ok,
      };
    } catch (e) {
      imageCheck = {
        url: meta.ogImage,
        status: null,
        contentType: null,
        contentLength: null,
        ok: false,
        error: (e as Error).message,
      };
    }
  }

  return new Response(
    JSON.stringify({
      requested: rawUrl,
      fetched: target.toString(),
      finalUrl: res.url,
      status: res.status,
      elapsedMs,
      crawler: body.crawler ?? "whatsapp",
      userAgent: ua,
      contentType: res.headers.get("content-type"),
      cacheControl: res.headers.get("cache-control"),
      meta,
      allMeta: extractAllMeta(headHtml),
      imageCheck,
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
});