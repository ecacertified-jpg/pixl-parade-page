// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_BASE_URL = "https://joiedevivre-africa.com";
const DEFAULT_OG = `${APP_BASE_URL}/og-image.jpg?v=2026051602`;

const CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|WhatsApp|Pinterest|redditbot|SkypeUriPreview|vkShare|Applebot|Googlebot|bingbot|TikTokBot|Bytespider|Embedly|iframely|Snap URL Preview|Google-InspectionTool/i;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pageUrlFor(item: any, pageSlug: string | null): string {
  if (item.page_kind === "birthday" && pageSlug) {
    return `${APP_BASE_URL}/birthday/${pageSlug}?inspiration=${item.share_token}`;
  }
  if (item.page_kind === "event" && pageSlug) {
    return `${APP_BASE_URL}/event/${pageSlug}?inspiration=${item.share_token}`;
  }
  // Global admin posts (or unresolved slug) → standalone SPA route that opens
  // the detail modal directly.
  return `${APP_BASE_URL}/inspiration/${item.share_token}`;
}

function crawlerHtml(item: any, canonicalUrl: string): string {
  const title = (item.title || "Inspiration JDV").slice(0, 120);
  const rawDesc = (item.body || item.title || "Découvre cette inspiration sur Joie de Vivre").toString();
  const desc = rawDesc.replace(/\s+/g, " ").slice(0, 240);
  const image = item.media_type === "image" && item.media_url
    ? item.media_url
    : item.thumbnail_url || DEFAULT_OG;
  const isVideo = item.media_type === "video" && !!item.media_url;

  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}"/>
<link rel="canonical" href="${esc(canonicalUrl)}"/>
<meta property="og:type" content="${isVideo ? "video.other" : "article"}"/>
<meta property="og:site_name" content="Joie de Vivre"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:url" content="${esc(canonicalUrl)}"/>
<meta property="og:image" content="${esc(image)}"/>
<meta property="og:image:secure_url" content="${esc(image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
${isVideo ? `<meta property="og:video" content="${esc(item.media_url)}"/>
<meta property="og:video:secure_url" content="${esc(item.media_url)}"/>
<meta property="og:video:type" content="video/mp4"/>` : ""}
<meta name="twitter:card" content="${isVideo ? "player" : "summary_large_image"}"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(desc)}"/>
<meta name="twitter:image" content="${esc(image)}"/>
</head><body><h1>${esc(title)}</h1><p>${esc(desc)}</p><p><a href="${esc(canonicalUrl)}">Voir sur Joie de Vivre</a></p></body></html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || url.pathname.split("/").filter(Boolean).pop();
  const ua = req.headers.get("user-agent") || "";

  if (!token) {
    return Response.redirect(APP_BASE_URL, 302);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: item, error } = await supabase
    .from("inspiration_items")
    .select("*")
    .eq("share_token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !item) {
    return Response.redirect(APP_BASE_URL, 302);
  }

  // Resolve host page slug (birthday_pages / event_pages) for canonical URL.
  let pageSlug: string | null = null;
  if (item.page_id && item.page_kind !== "global") {
    const table = item.page_kind === "birthday" ? "birthday_pages" : "event_pages";
    const { data: p } = await supabase.from(table).select("slug").eq("id", item.page_id).maybeSingle();
    pageSlug = (p as any)?.slug ?? null;
  }

  const canonicalUrl = pageUrlFor(item, pageSlug);

  const isCrawler = CRAWLER_RE.test(ua);

  if (!isCrawler) {
    // Real users: honest 302 redirect to the SPA page. No HTML body avoids
    // any risk of mobile browsers rendering the source instead of following
    // the redirect.
    supabase.rpc("increment_inspiration_shares", { _id: item.id }).then(() => {}).catch(() => {});
    return new Response(null, {
      status: 302,
      headers: {
        Location: canonicalUrl,
        "cache-control": "no-store",
      },
    });
  }

  // Social crawlers: serve rich OG/Twitter HTML.
  return new Response(crawlerHtml(item, canonicalUrl), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
});