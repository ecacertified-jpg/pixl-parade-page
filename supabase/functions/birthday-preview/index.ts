import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://joiedevivre-africa.com";
const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";
const DEFAULT_OG = `${SITE_URL}/og-image.png`;

const CRAWLER_PATTERNS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "Slackbot",
  "TelegramBot",
  "Discordbot",
  "Googlebot",
  "bingbot",
  "Applebot",
  "PinterestBot",
  "Pinterest",
  "vkShare",
  "Viber",
  "Snapchat",
  "redditbot",
  "embedly",
  "Iframely",
];

function isCrawler(ua: string | null): boolean {
  if (!ua) return false;
  return CRAWLER_PATTERNS.some((p) => ua.toLowerCase().includes(p.toLowerCase()));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function computeAge(birthday: string | null, year: number): number | null {
  if (!birthday) return null;
  const m = birthday.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const birthYear = parseInt(m[1], 10);
  if (!birthYear || birthYear > year) return null;
  return year - birthYear;
}

function buildHtml(opts: {
  firstName: string;
  age: number | null;
  slug: string;
  coverImage: string;
  celebrationYear: number;
}): string {
  const { firstName, age, slug, coverImage, celebrationYear } = opts;
  const ageText = age ? `${age} ans` : "";
  const titleRaw = age
    ? `Anniversaire de ${firstName} — ${ageText} | Joie de Vivre`
    : `Anniversaire de ${firstName} | Joie de Vivre`;
  const descRaw = age
    ? `Célébrez les ${ageText} de ${firstName} ! Écrivez un message, partagez vos photos et participez au cadeau collectif.`
    : `Célébrez l'anniversaire de ${firstName} ! Écrivez un message, partagez vos photos et participez au cadeau collectif.`;
  const url = `${SITE_URL}/birthday/${slug}`;
  const title = escapeHtml(titleRaw);
  const description = escapeHtml(descRaw);
  const image = escapeHtml(coverImage);

  return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>

  <meta property="og:type" content="profile"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:image" content="${image}"/>
  <meta property="og:image:secure_url" content="${image}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:image:alt" content="${escapeHtml(`Anniversaire de ${firstName}`)}"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:site_name" content="Joie de Vivre"/>
  <meta property="og:locale" content="fr_FR"/>

  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${image}"/>
  <meta name="twitter:image:alt" content="${escapeHtml(`Anniversaire de ${firstName}`)}"/>

  <link rel="canonical" href="${url}"/>
  <meta http-equiv="refresh" content="0;url=${url}"/>

  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: titleRaw,
    description: descRaw,
    url,
    image: coverImage,
    startDate: `${celebrationYear}-01-01`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: "Joie de Vivre",
      url: SITE_URL,
    },
  })}</script>
</head>
<body>
  <p>Redirection vers <a href="${url}">${title}</a>...</p>
</body>
</html>`;
}

function buildFallbackHtml(slug: string): string {
  const url = `${SITE_URL}/birthday/${slug}`;
  const title = "Joie de Vivre — Cagnottes Cadeaux Anniversaire Afrique";
  const description =
    "Cagnottes collaboratives en Afrique francophone pour anniversaires, mariages et fêtes.";
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${DEFAULT_OG}"/>
<meta property="og:image:width" content="1376"/>
<meta property="og:image:height" content="768"/>
<meta property="og:url" content="${url}"/>
<meta property="og:site_name" content="Joie de Vivre"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:image" content="${DEFAULT_OG}"/>
<link rel="canonical" href="${url}"/>
<meta http-equiv="refresh" content="0;url=${url}"/>
</head><body><p><a href="${url}">${title}</a></p></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1];

    if (!slug || slug === "birthday-preview") {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const userAgent = req.headers.get("user-agent");
    const targetUrl = `${SITE_URL}/birthday/${slug}`;

    // Humans → redirect to SPA
    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: targetUrl,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Crawlers → render OG HTML
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: page } = await supabase
      .from("birthday_pages")
      .select("user_id, slug, celebration_year, cover_image_url, is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (!page) {
      return new Response(buildFallbackHtml(slug), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, birthday, avatar_url")
      .eq("user_id", page.user_id)
      .maybeSingle();

    const firstName = profile?.first_name?.trim() || "notre ami(e)";
    const age = computeAge(profile?.birthday ?? null, page.celebration_year);
    const coverImage =
      page.cover_image_url || profile?.avatar_url || DEFAULT_OG;

    const html = buildHtml({
      firstName,
      age,
      slug: page.slug,
      coverImage,
      celebrationYear: page.celebration_year,
    });

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("birthday-preview error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});