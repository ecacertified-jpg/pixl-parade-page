import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://joiedevivre-africa.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

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
  "vkShare",
  "Viber",
  "Snapchat",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CRAWLER_PATTERNS.some((p) => userAgent.includes(p));
}

function buildOgHtml(code: string, adminName: string): string {
  const title = adminName
    ? `Rejoins Joie de Vivre ! Invité par ${adminName}`
    : "Rejoins Joie de Vivre ! 🎉";
  const description =
    "Célébrez les moments heureux avec vos proches. Offrez et recevez des cadeaux collectifs en Côte d'Ivoire.";
  const url = `${SITE_URL}/join/${code}`;

  return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:image" content="${OG_IMAGE}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:site_name" content="Joie de Vivre"/>
  <meta property="og:locale" content="fr_CI"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image" content="${OG_IMAGE}"/>

  <!-- hreflang -->
  <link rel="alternate" hreflang="fr-CI" href="${url}"/>
  <link rel="alternate" hreflang="fr-BJ" href="${url}"/>
  <link rel="alternate" hreflang="fr-SN" href="${url}"/>
  <link rel="alternate" hreflang="fr-ML" href="${url}"/>
  <link rel="alternate" hreflang="fr-TG" href="${url}"/>
  <link rel="alternate" hreflang="fr-BF" href="${url}"/>
  <link rel="alternate" hreflang="fr-NE" href="${url}"/>
  <link rel="canonical" href="${url}"/>

  <!-- Redirect for humans who somehow land here -->
  <meta http-equiv="refresh" content="0;url=${url}"/>

  <!-- Schema.org -->
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    image: OG_IMAGE,
    publisher: {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Path: /join-preview/ADM-XXXX
    const code = pathParts[pathParts.length - 1];

    if (!code || !code.startsWith("ADM-")) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const userAgent = req.headers.get("user-agent");

    // For regular browsers, redirect immediately
    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${SITE_URL}/join/${code}`,
          "Cache-Control": "no-cache",
        },
      });
    }

    // For crawlers, fetch admin name and return OG HTML
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let adminName = "";

    const { data: shareCode } = await supabase
      .from("admin_share_codes")
      .select("admin_user_id")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (shareCode?.admin_user_id) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("id", shareCode.admin_user_id)
        .maybeSingle();

      if (adminUser?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", adminUser.user_id)
          .maybeSingle();

        if (profile) {
          adminName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
        }
      }
    }

    const html = buildOgHtml(code, adminName);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("join-preview error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
