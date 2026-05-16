// Edge function : sert un aperçu OG (Open Graph) localisé selon le pays
// du partageur, lu depuis le paramètre `?c=` (CI / BJ / SN / TG / ML / BF).
//
// - Pour les crawlers (WhatsApp, Facebook, X, LinkedIn, Telegram…) :
//   renvoie un HTML statique avec <title> et meta og:* / twitter:* adaptés
//   au pays, ce qui donne un aperçu localisé dans les apps de messagerie.
// - Pour les humains : redirige vers la home `https://joiedevivre-africa.com/`
//   en conservant le paramètre `?c=` si présent.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

import {
  DEFAULT_OG_IMAGE_URL,
  OG_IMAGE_SITE_URL,
} from "../_shared/og-image-version.ts";

const SITE_URL = OG_IMAGE_SITE_URL;
const OG_IMAGE = DEFAULT_OG_IMAGE_URL;

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
  "redditbot",
  "Embedly",
  "Iframely",
];

interface CountryMeta {
  country: string;       // Nom du pays (ex: "Côte d'Ivoire")
  capital: string;       // Capitale économique (ex: "Abidjan")
  locale: string;        // og:locale (ex: "fr_CI")
  description: string;   // Description localisée
}

const COUNTRY_META: Record<string, CountryMeta> = {
  CI: {
    country: "Côte d'Ivoire",
    capital: "Abidjan",
    locale: "fr_CI",
    description:
      "Première plateforme de cadeaux collaboratifs en Côte d'Ivoire. Créez des cagnottes pour anniversaires, mariages et célébrations. Boutiques artisanales ivoiriennes.",
  },
  BJ: {
    country: "Bénin",
    capital: "Cotonou",
    locale: "fr_BJ",
    description:
      "Première plateforme de cadeaux collaboratifs au Bénin. Créez des cagnottes pour anniversaires, mariages et célébrations. Boutiques artisanales béninoises.",
  },
  SN: {
    country: "Sénégal",
    capital: "Dakar",
    locale: "fr_SN",
    description:
      "Première plateforme de cadeaux collaboratifs au Sénégal. Créez des cagnottes pour anniversaires, mariages et célébrations. Boutiques artisanales sénégalaises.",
  },
  TG: {
    country: "Togo",
    capital: "Lomé",
    locale: "fr_TG",
    description:
      "Première plateforme de cadeaux collaboratifs au Togo. Créez des cagnottes pour anniversaires, mariages et célébrations. Boutiques artisanales togolaises.",
  },
  ML: {
    country: "Mali",
    capital: "Bamako",
    locale: "fr_ML",
    description:
      "Première plateforme de cadeaux collaboratifs au Mali. Créez des cagnottes pour anniversaires, mariages et célébrations. Boutiques artisanales maliennes.",
  },
  BF: {
    country: "Burkina Faso",
    capital: "Ouagadougou",
    locale: "fr_BF",
    description:
      "Première plateforme de cadeaux collaboratifs au Burkina Faso. Créez des cagnottes pour anniversaires, mariages et célébrations. Boutiques artisanales burkinabées.",
  },
};

// Fallback générique panafricain : utilisé quand un code pays est fourni
// mais non supporté (ex: ?c=US, ?c=ZZ). On évite de tromper l'utilisateur
// avec un titre Côte d'Ivoire alors qu'il a explicitement demandé autre chose.
const GENERIC_META: CountryMeta = {
  country: "Afrique francophone",
  capital: "Capitales africaines",
  locale: "fr",
  description:
    "Première plateforme de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages et célébrations partout en Afrique.",
};

const DEFAULT_COUNTRY = "CI";

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return CRAWLER_PATTERNS.some((p) => userAgent.includes(p));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Normalise et catégorise le paramètre `?c=` :
 * - Pas de paramètre → défaut CI (lien canonique partagé sans contexte).
 * - Paramètre supporté → meta du pays correspondant.
 * - Paramètre fourni mais inconnu → meta générique "Afrique francophone".
 */
function resolveCountry(code: string | null): {
  meta: CountryMeta;
  code: string;
  isGeneric: boolean;
} {
  if (code === null || code.trim() === "") {
    return { meta: COUNTRY_META[DEFAULT_COUNTRY], code: DEFAULT_COUNTRY, isGeneric: false };
  }
  // Sanitise pour éviter d'injecter des caractères exotiques dans titres/URL.
  const upper = code.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  if (upper && upper in COUNTRY_META) {
    return { meta: COUNTRY_META[upper], code: upper, isGeneric: false };
  }
  return { meta: GENERIC_META, code: "", isGeneric: true };
}

function buildOgHtml(meta: CountryMeta, isGeneric: boolean, countryCode: string): string {
  const title = isGeneric
    ? `Joie de Vivre - Cadeaux Collectifs en ${meta.country} | Cagnottes Anniversaire`
    : `Joie de Vivre - Cadeaux Collectifs ${meta.country} | Cagnottes Anniversaire ${meta.capital}`;
  const description = meta.description;
  // Pour le générique on pointe vers la home propre (pas de ?c= invalide indexé).
  const url = isGeneric ? `${SITE_URL}/` : `${SITE_URL}/?c=${countryCode}`;

  const titleSafe = escapeHtml(title);
  const descriptionSafe = escapeHtml(description);

  return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${titleSafe}</title>
  <meta name="description" content="${descriptionSafe}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${titleSafe}"/>
  <meta property="og:description" content="${descriptionSafe}"/>
  <meta property="og:image" content="${OG_IMAGE}"/>
  <meta property="og:image:secure_url" content="${OG_IMAGE}"/>
  <meta property="og:image:type" content="image/png"/>
  <meta property="og:image:width" content="1376"/>
  <meta property="og:image:height" content="768"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:site_name" content="Joie de Vivre"/>
  <meta property="og:locale" content="${meta.locale}"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${titleSafe}"/>
  <meta name="twitter:description" content="${descriptionSafe}"/>
  <meta name="twitter:image" content="${OG_IMAGE}"/>

  <link rel="canonical" href="${url}"/>

  <!-- Redirection pour humains qui atterriraient ici -->
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
  <p>Redirection vers <a href="${url}">${titleSafe}</a>...</p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const countryParam = url.searchParams.get("c");
    const { meta, code: countryCode, isGeneric } = resolveCountry(countryParam);

    const userAgent = req.headers.get("user-agent");

    // Humains : redirection 302 vers la home (en conservant ?c= si présent)
    if (!isCrawler(userAgent)) {
      // Si code invalide (générique) : on ne propage PAS le ?c= invalide.
      const target =
        !isGeneric && countryParam
          ? `${SITE_URL}/?c=${countryCode}`
          : `${SITE_URL}/`;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: target,
          "Cache-Control": "no-cache",
        },
      });
    }

    // Crawlers : renvoie l'HTML OG localisé
    const html = buildOgHtml(meta, isGeneric, countryCode);
    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("home-preview error:", error);
    return new Response("Internal error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
