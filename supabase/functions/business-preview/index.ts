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

// Déterminer si la boutique est ouverte maintenant (timezone Abidjan = GMT)
interface DayHours {
  open?: string;
  close?: string;
  closed?: boolean;
}

function isOpenNow(openingHours: Record<string, DayHours> | null): { isOpen: boolean; hours: string | null } {
  if (!openingHours) return { isOpen: false, hours: null };
  
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const now = new Date();
  const currentDay = days[now.getUTCDay()];
  const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  
  const dayHours = openingHours[currentDay];
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return { isOpen: false, hours: null };
  }
  
  const isOpen = currentTime >= dayHours.open && currentTime <= dayHours.close;
  return { isOpen, hours: `${dayHours.open}-${dayHours.close}` };
}

// Formater les zones de livraison
interface DeliveryZone {
  name?: string;
  active?: boolean;
}

function formatDeliveryZones(zones: DeliveryZone[] | null): string {
  if (!zones || !Array.isArray(zones)) return "";
  
  const activeZones = zones.filter(z => z.active !== false && z.name).map(z => z.name!);
  if (activeZones.length === 0) return "";
  if (activeZones.length <= 3) return activeZones.join(", ");
  return `${activeZones.slice(0, 2).join(", ")} +${activeZones.length - 2}`;
}

// Formater la note avec étoiles
function formatRating(avg: number, count: number): string {
  if (count === 0) return "";
  return `${avg.toFixed(1)}/5 (${count} avis)`;
}

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

    // Fetch business details with enriched data
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
        status,
        opening_hours,
        delivery_zones,
        delivery_settings
      `)
      .eq("id", businessId)
      .eq("is_active", true)
      .eq("status", "active")
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

    // Calculate average rating from product ratings
    let averageRating = 0;
    let totalRatings = 0;
    
    const { data: ratingData } = await supabase
      .from("product_ratings")
      .select(`
        rating,
        products!inner(business_id, is_active)
      `)
      .eq("products.business_id", businessId)
      .eq("products.is_active", true);

    if (ratingData && ratingData.length > 0) {
      totalRatings = ratingData.length;
      averageRating = ratingData.reduce((acc, r) => acc + (r.rating || 0), 0) / totalRatings;
    }

    const appUrl = "https://pixl-parade-page.lovable.app";
    const businessName = business.business_name || "Boutique";
    const businessType = business.business_type || "";
    const description = business.description || `Découvrez ${businessName} sur JOIE DE VIVRE`;
    const logoUrl = business.logo_url || `${appUrl}/og-image.png`;
    const address = business.address || "";
    const productCountText = productsCount ? `${productsCount} produit${productsCount > 1 ? 's' : ''}` : "";
    
    // Enriched data
    const openStatus = isOpenNow(business.opening_hours as Record<string, DayHours> | null);
    const deliveryText = formatDeliveryZones(business.delivery_zones as DeliveryZone[] | null);
    const ratingText = formatRating(averageRating, totalRatings);
    
    const fullBusinessUrl = `${appUrl}/boutique/${businessId}`;
    const previewUrl = `${appUrl}/b/${businessId}`;

    // Build enriched description for OG tags
    const ogDescriptionParts: string[] = [];
    
    // Rating + Type
    if (ratingText) ogDescriptionParts.push(`⭐ ${ratingText}`);
    if (businessType) ogDescriptionParts.push(businessType);
    
    // Address + Delivery
    if (address) ogDescriptionParts.push(`📍 ${address}`);
    if (deliveryText) ogDescriptionParts.push(`🚚 ${deliveryText}`);
    
    // Opening status
    if (openStatus.hours) {
      ogDescriptionParts.push(openStatus.isOpen 
        ? `🟢 Ouvert (${openStatus.hours})`
        : `🔴 Fermé`
      );
    }
    
    // Products count
    if (productCountText) ogDescriptionParts.push(`🎁 ${productCountText}`);

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
  ${ratingText ? `<meta property="og:rating" content="${averageRating.toFixed(1)}">` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${previewUrl}">
  <meta property="twitter:title" content="🏪 ${businessName}">
  <meta property="twitter:description" content="${ogDescription}">
  <meta property="twitter:image" content="${logoUrl}">
  
  <!-- Redirect for browsers that somehow get here -->
  <meta http-equiv="refresh" content="0;url=${fullBusinessUrl}">
  
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; background: #f8f5ff; }
    img { max-width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #7A5DC7; }
    h1 { color: #7A5DC7; margin-bottom: 0.5rem; }
    .rating { color: #f59e0b; font-size: 1.2rem; font-weight: 600; margin: 0.5rem 0; }
    .type { color: #666; font-size: 1.1rem; margin: 0.25rem 0; }
    .address { color: #888; margin-top: 0.5rem; }
    .delivery { color: #7A5DC7; margin: 0.5rem 0; }
    .hours { margin: 0.5rem 0; font-weight: 500; }
    .hours.open { color: #22c55e; }
    .hours.closed { color: #ef4444; }
    .products { color: #7A5DC7; font-weight: 500; margin-top: 1rem; }
    a { color: #7A5DC7; text-decoration: none; display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #7A5DC7; color: white; border-radius: 2rem; }
    a:hover { background: #6b4fb8; }
  </style>
</head>
<body>
  <img src="${logoUrl}" alt="${businessName}">
  <h1>🏪 ${businessName}</h1>
  ${ratingText ? `<p class="rating">⭐ ${ratingText}</p>` : ''}
  ${businessType ? `<p class="type">${businessType}</p>` : ''}
  ${address ? `<p class="address">📍 ${address}</p>` : ''}
  ${deliveryText ? `<p class="delivery">🚚 Livraison: ${deliveryText}</p>` : ''}
  ${openStatus.hours ? `<p class="hours ${openStatus.isOpen ? 'open' : 'closed'}">${openStatus.isOpen ? '🟢 Ouvert maintenant' : '🔴 Fermé'} (${openStatus.hours})</p>` : ''}
  ${productCountText ? `<p class="products">🎁 ${productCountText}</p>` : ''}
  <a href="${fullBusinessUrl}">Voir la boutique →</a>
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
