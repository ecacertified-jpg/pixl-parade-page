import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// List of known crawler User-Agents
const crawlerUserAgents = [
  "facebookexternalhit",
  "Facebot",
  "WhatsApp",
  "Twitterbot",
  "LinkedInBot",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "Pinterest",
  "Googlebot",
  "bingbot",
  "Applebot",
  "Embedly",
  "Quora Link Preview",
  "Showyoubot",
  "outbrain",
  "vkShare",
  "W3C_Validator",
  "redditbot",
  "Mediapartners-Google",
];

const isCrawler = (userAgent: string): boolean => {
  const ua = userAgent.toLowerCase();
  return crawlerUserAgents.some((bot) => ua.includes(bot.toLowerCase()));
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    // URL format: /fund-preview/fundId
    const fundId = pathParts[pathParts.length - 1];

    if (!fundId || fundId === "fund-preview") {
      return new Response("Fund ID required", { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch fund data
    const { data: fund, error } = await supabase
      .from("collective_funds")
      .select(`
        id,
        title,
        description,
        target_amount,
        current_amount,
        currency,
        occasion,
        status,
        business_product_id,
        beneficiary_contact_id,
        products:business_product_id (
          id,
          name,
          image_url,
          price
        ),
        contacts:beneficiary_contact_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq("id", fundId)
      .single();

    if (error || !fund) {
      console.error("Fund not found:", error);
      return new Response("Fund not found", { status: 404 });
    }

    // Calculate progress
    const currentAmount = fund.current_amount || 0;
    const targetAmount = fund.target_amount || 1;
    const progressPercent = Math.min(
      Math.round((currentAmount / targetAmount) * 100),
      100
    );

    // Get product info if available
    const product = fund.products as { id: string; name: string; image_url: string; price: number } | null;
    const contact = fund.contacts as { id: string; name: string; avatar_url: string } | null;

    // Format amounts
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat("fr-FR").format(amount);
    };

    // Build OG data
    const fundTitle = fund.title || "Cagnotte collective";
    const beneficiaryName = contact?.name || "un proche";
    const productName = product?.name || "";
    const productImage = product?.image_url || "";
    const currency = fund.currency || "XOF";
    const description = fund.description || `Participez à cette cagnotte pour ${beneficiaryName}`;

    // OG description with progress
    const ogDescription = `${progressPercent}% collecté • ${formatAmount(currentAmount)} / ${formatAmount(targetAmount)} ${currency}${productName ? ` • ${productName}` : ""}`;

    // Get occasion emoji
    const occasionEmojis: Record<string, string> = {
      birthday: "🎂",
      wedding: "💒",
      graduation: "🎓",
      baby: "👶",
      retirement: "🎉",
      promotion: "🚀",
    };
    const occasionEmoji = occasionEmojis[fund.occasion || ""] || "🎁";

    // Build URLs
    const origin = url.origin.replace("supabase.co/functions/v1", "lovable.app");
    const baseAppUrl = origin.includes("localhost") 
      ? "http://localhost:5173"
      : origin.replace(/supabase\.co.*/, "lovable.app").replace(/functions\/v1.*/, "");
    
    // Try to get the actual app URL from referer or use a default
    const appUrl = Deno.env.get("APP_URL") || "https://joiedevivre-africa.com";
    const fullFundUrl = `${appUrl}/fund/${fundId}`;
    const previewUrl = `${appUrl}/f/${fundId}`;

    // Default image if no product image
    const ogImage = productImage || `${appUrl}/og-image.png`;

    // Build Schema.org JSON-LD for Event/FundingScheme
    const schemaJsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      "name": fundTitle,
      "description": description,
      "image": ogImage,
      "url": fullFundUrl,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "organizer": {
        "@type": "Organization",
        "name": "JOIE DE VIVRE",
        "url": appUrl
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
        "url": fullFundUrl,
        "validFrom": new Date().toISOString()
      },
      "performer": {
        "@type": "Person",
        "name": beneficiaryName
      },
      "location": {
        "@type": "VirtualLocation",
        "url": fullFundUrl
      }
    });

    if (isCrawler(userAgent)) {
      // Return HTML with Open Graph meta tags for crawlers
      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${occasionEmoji} ${fundTitle} - Cagnotte Collective | JOIE DE VIVRE</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${occasionEmoji} ${fundTitle} - Cagnotte Collective | JOIE DE VIVRE">
  <meta name="description" content="${description}">
  <meta name="keywords" content="cagnotte ${fund.occasion || 'collective'}, cadeau groupe, ${beneficiaryName}, contribution en ligne, Côte d'Ivoire">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${previewUrl}">
  <meta property="og:title" content="${occasionEmoji} ${fundTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="JOIE DE VIVRE">
  <meta property="og:locale" content="fr_FR">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${previewUrl}">
  <meta name="twitter:title" content="${occasionEmoji} ${fundTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Hreflang for African markets -->
  <link rel="alternate" hreflang="fr-CI" href="${previewUrl}">
  <link rel="alternate" hreflang="fr-BJ" href="${previewUrl}">
  <link rel="alternate" hreflang="fr-SN" href="${previewUrl}">
  <link rel="alternate" hreflang="fr-ML" href="${previewUrl}">
  <link rel="alternate" hreflang="fr-BF" href="${previewUrl}">
  <link rel="alternate" hreflang="fr-TG" href="${previewUrl}">
  <link rel="alternate" hreflang="fr-CM" href="${previewUrl}">
  <link rel="alternate" hreflang="fr" href="${previewUrl}">
  <link rel="alternate" hreflang="x-default" href="${previewUrl}">
  <link rel="canonical" href="${previewUrl}">
  
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">${schemaJsonLd}</script>
  
  <!-- Additional meta -->
  <meta name="theme-color" content="#7A5DC7">
  
  <!-- Redirect real users -->
  <meta http-equiv="refresh" content="0;url=${fullFundUrl}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #7A5DC7 0%, #C084FC 50%, #FAD4E1 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { opacity: 0.9; }
    .progress {
      background: rgba(255,255,255,0.2);
      border-radius: 999px;
      height: 12px;
      margin: 1rem 0;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FFD700, #FFA500);
      border-radius: 999px;
      width: ${progressPercent}%;
    }
    a {
      color: white;
      background: rgba(255,255,255,0.2);
      padding: 12px 24px;
      border-radius: 999px;
      text-decoration: none;
      display: inline-block;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <p>${occasionEmoji}</p>
    <h1>${fundTitle}</h1>
    <p>Pour ${beneficiaryName}</p>
    <div class="progress"><div class="progress-bar"></div></div>
    <p><strong>${formatAmount(currentAmount)}</strong> / ${formatAmount(targetAmount)} ${currency}</p>
    <a href="${fullFundUrl}">Contribuer à cette cagnotte</a>
    <p style="font-size: 0.8rem; margin-top: 2rem;">Redirection en cours...</p>
  </div>
</body>
</html>`;

      return new Response(html, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    } else {
      // Redirect browsers to the fund page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: fullFundUrl,
        },
      });
    }
  } catch (error) {
    console.error("Error in fund-preview:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
