import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://joiedevivre-africa.com";
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;

const CRAWLER_PATTERNS = [
  "facebookexternalhit", "Facebot", "Twitterbot", "WhatsApp", "LinkedInBot",
  "Slackbot", "TelegramBot", "Discordbot", "Googlebot", "bingbot", "Applebot",
  "PinterestBot", "Pinterest", "vkShare", "Viber", "Snapchat", "redditbot",
  "embedly", "Iframely",
];

const OCCASION_LABELS: Record<string, { label: string; emoji: string }> = {
  wedding: { label: "Mariage", emoji: "💍" },
  baptism: { label: "Baptême", emoji: "👶" },
  engagement: { label: "Fiançailles", emoji: "💞" },
  graduation: { label: "Diplôme", emoji: "🎓" },
  promotion: { label: "Promotion", emoji: "🎉" },
  other: { label: "Événement", emoji: "✨" },
};

function isCrawler(ua: string | null): boolean {
  if (!ua) return false;
  const low = ua.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => low.includes(p.toLowerCase()));
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildHtml(opts: {
  title: string; description: string; image: string; url: string;
  occasionLabel: string;
}): string {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const image = escapeHtml(opts.image);
  const url = opts.url;
  return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:secure_url" content="${image}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt" content="${escapeHtml(opts.occasionLabel)}"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:site_name" content="Joie de Vivre"/>
  <meta property="og:locale" content="fr_FR"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${image}"/>
  <link rel="canonical" href="${url}"/>
  <meta http-equiv="refresh" content="0;url=${url}"/>
</head>
<body><p>Redirection vers <a href="${url}">${title}</a>...</p></body>
</html>`;
}

function buildFallbackHtml(slug: string, basePath: string): string {
  const url = `${SITE_URL}/${basePath}/${slug}`;
  return buildHtml({
    title: "Joie de Vivre — Célébrons ensemble",
    description: "Écrivez un message, partagez vos photos et participez au cadeau collectif.",
    image: DEFAULT_OG,
    url,
    occasionLabel: "Événement",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1];
    // Detect whether the original public path was /evenement/* or /event/*
    // by looking at the referer or forwarded path; default to /event/.
    const fwd = req.headers.get("x-forwarded-uri") || req.headers.get("referer") || "";
    const basePath = fwd.includes("/evenement/") ? "evenement" : "event";

    if (!slug || slug === "event-preview") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const userAgent = req.headers.get("user-agent");
    const targetUrl = `${SITE_URL}/${basePath}/${slug}`;

    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: targetUrl, "Cache-Control": "no-cache" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: page } = await supabase
      .from("event_pages")
      .select("slug, title, description, occasion, cover_image_url, event_date, is_active, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (!page) {
      return new Response(buildFallbackHtml(slug, basePath), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const occ = OCCASION_LABELS[page.occasion] ?? OCCASION_LABELS.other;
    const titleRaw = `${occ.emoji} ${page.title} — ${occ.label} | Joie de Vivre`;
    const descRaw = page.description?.trim() ||
      `Célébrez ce ${occ.label.toLowerCase()} ! Écrivez un message, partagez vos photos et participez au cadeau collectif.`;

    const version = Math.floor(new Date(page.updated_at ?? Date.now()).getTime() / 1000).toString();
    const sep = (u: string) => (u.includes("?") ? "&" : "?");
    const image = page.cover_image_url
      ? `${page.cover_image_url}${sep(page.cover_image_url)}v=${version}`
      : DEFAULT_OG;

    const html = buildHtml({
      title: titleRaw,
      description: descRaw,
      image,
      url: `${SITE_URL}/${basePath}/${page.slug}`,
      occasionLabel: occ.label,
    });

    const etag = `W/"event-${page.slug}-${version}"`;
    if (req.headers.get("if-none-match") === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...corsHeaders, ETag: etag,
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
        },
      });
    }

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
        ETag: etag,
      },
    });
  } catch (err) {
    console.error("event-preview error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});