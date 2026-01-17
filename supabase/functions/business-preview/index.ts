import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Liste des User-Agents de crawlers connus
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
  "SocialFlow",
];

const isCrawler = (userAgent: string): boolean => {
  const ua = userAgent.toLowerCase();
  return crawlerUserAgents.some((bot) => ua.includes(bot.toLowerCase()));
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("id");
    const userAgent = req.headers.get("user-agent") || "";

    if (!businessId) {
      return new Response("Business ID required", { status: 400, headers: corsHeaders });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch business details
    const { data: business, error } = await supabase
      .from("business_accounts")
      .select(`
        id,
        business_name,
        business_type,
        description,
        logo_url,
        address,
        is_active,
        status
      `)
      .eq("id", businessId)
      .eq("is_active", true)
      .eq("status", "approved")
      .maybeSingle();

    if (error) {
      console.error("Error fetching business:", error);
      return new Response("Error fetching business", { status: 500, headers: corsHeaders });
    }

    if (!business) {
      return new Response("Business not found", { status: 404, headers: corsHeaders });
    }

    // Count active products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true);

    const appUrl = "https://pixl-parade-page.lovable.app";
    const businessName = business.business_name || "Boutique";
    const businessType = business.business_type || "";
    const description = business.description || `Découvrez ${businessName} sur JOIE DE VIVRE`;
    const logoUrl = business.logo_url || `${appUrl}/og-image.png`;
    const address = business.address || "";
    const productCountText = productsCount ? `${productsCount} produit${productsCount > 1 ? 's' : ''} disponible${productsCount > 1 ? 's' : ''}` : "";
    
    const fullBusinessUrl = `${appUrl}/boutique/${businessId}`;
    const previewUrl = `${appUrl}/b/${businessId}`;

    // Build description for OG tags
    const ogDescriptionParts = [
      businessType,
      address,
      productCountText,
    ].filter(Boolean);
    const ogDescription = ogDescriptionParts.length > 0 
      ? ogDescriptionParts.join(" • ") 
      : description.substring(0, 150);

    // Si c'est un crawler, retourner le HTML avec les meta tags OG
    if (isCrawler(userAgent)) {
      console.log(`Crawler detected: ${userAgent}`);
      
      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏪 ${businessName} - JOIE DE VIVRE</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${businessName} - JOIE DE VIVRE">
  <meta name="description" content="${ogDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="business.business">
  <meta property="og:url" content="${previewUrl}">
  <meta property="og:title" content="🏪 ${businessName}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${logoUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${businessName}">
  <meta property="og:site_name" content="JOIE DE VIVRE">
  <meta property="og:locale" content="fr_FR">
  
  <!-- Business specific -->
  ${address ? `<meta property="business:contact_data:locality" content="${address}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${previewUrl}">
  <meta property="twitter:title" content="🏪 ${businessName}">
  <meta property="twitter:description" content="${ogDescription}">
  <meta property="twitter:image" content="${logoUrl}">
  
  <!-- Redirect for browsers that somehow get here -->
  <meta http-equiv="refresh" content="0;url=${fullBusinessUrl}">
  
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
    img { max-width: 150px; height: 150px; border-radius: 50%; object-fit: cover; }
    h1 { color: #7A5DC7; }
    .type { color: #666; font-size: 1.1rem; }
    .address { color: #888; margin-top: 0.5rem; }
    .products { color: #7A5DC7; font-weight: 500; margin-top: 1rem; }
    a { color: #7A5DC7; }
  </style>
</head>
<body>
  <img src="${logoUrl}" alt="${businessName}">
  <h1>🏪 ${businessName}</h1>
  ${businessType ? `<p class="type">${businessType}</p>` : ''}
  ${address ? `<p class="address">📍 ${address}</p>` : ''}
  ${productCountText ? `<p class="products">🎁 ${productCountText}</p>` : ''}
  <p><a href="${fullBusinessUrl}">Voir la boutique sur JOIE DE VIVRE →</a></p>
</body>
</html>`;

      return new Response(html, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Pour les navigateurs normaux, rediriger vers l'application
    console.log(`Browser detected, redirecting to: ${fullBusinessUrl}`);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: fullBusinessUrl,
      },
    });
  } catch (error) {
    console.error("Error in business-preview:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
