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

// Generate Unicode star rating display
const generateStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalf && fullStars < 5) stars += '☆';
  stars += '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
  return stars;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("id");
    const userAgent = req.headers.get("user-agent") || "";

    if (!productId) {
      return new Response("Product ID required", { status: 400, headers: corsHeaders });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch product details
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        currency,
        image_url,
        business_accounts!products_business_id_fkey (
          id,
          business_name
        )
      `)
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error);
      return new Response("Error fetching product", { status: 500, headers: corsHeaders });
    }

    if (!product) {
      return new Response("Product not found", { status: 404, headers: corsHeaders });
    }

    // Fetch product ratings for Schema.org aggregateRating
    const { data: ratingsData } = await supabase
      .from("product_ratings")
      .select("rating, review_text, created_at, user_id")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch profiles for reviewer names
    let profilesMap: Record<string, string> = {};
    if (ratingsData && ratingsData.length > 0) {
      const userIds = [...new Set(ratingsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name")
        .in("user_id", userIds);
      
      profiles?.forEach(p => {
        profilesMap[p.user_id] = p.first_name || "Utilisateur";
      });
    }

    // Calculate rating stats
    const ratingCount = ratingsData?.length || 0;
    const averageRating = ratingCount > 0 
      ? (ratingsData!.reduce((sum, r) => sum + r.rating, 0) / ratingCount).toFixed(1)
      : null;

    const appUrl = "https://joiedevivre-africa.com";
    const productName = product.name || "Produit";
    const productDescription = product.description || `Découvrez ${productName} sur JOIE DE VIVRE`;
    const price = product.price ? `${product.price.toLocaleString("fr-FR")} ${product.currency || "XOF"}` : "";
    const imageUrl = product.image_url || `${appUrl}/og-image.png`;
    const vendorName = product.business_accounts?.business_name || "JOIE DE VIVRE";
    const vendorId = product.business_accounts?.id;
    const fullProductUrl = vendorId 
      ? `${appUrl}/boutique/${vendorId}?product=${productId}`
      : `${appUrl}/shop?product=${productId}`;
    const previewUrl = `${appUrl}/p/${productId}`;

    // Build Schema.org JSON-LD for Product with ratings
    const schemaJsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": productName,
      "description": productDescription,
      "image": imageUrl,
      "url": fullProductUrl,
      "offers": {
        "@type": "Offer",
        "price": product.price || 0,
        "priceCurrency": product.currency || "XOF",
        "availability": "https://schema.org/InStock",
        "url": fullProductUrl,
        "seller": {
          "@type": "Organization",
          "name": vendorName
        }
      },
      "brand": {
        "@type": "Brand",
        "name": vendorName
      },
      "sku": productId,
      "category": "Cadeaux",
      // AggregateRating for star ratings in search results
      ...(ratingCount > 0 && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": averageRating,
          "reviewCount": ratingCount,
          "bestRating": "5",
          "worstRating": "1"
        }
      }),
      // Individual reviews (max 5 for crawlers)
      ...(ratingsData && ratingsData.length > 0 && {
        "review": ratingsData.slice(0, 5).map(r => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": (profilesMap[r.user_id] || "Client").charAt(0) + "."
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": r.rating,
            "bestRating": "5",
            "worstRating": "1"
          },
          ...(r.review_text && { "reviewBody": r.review_text }),
          "datePublished": r.created_at.split("T")[0]
        }))
      })
    });

    // Si c'est un crawler, retourner le HTML avec les meta tags OG
    if (isCrawler(userAgent)) {
      console.log(`Crawler detected: ${userAgent}`);
      
      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName} - JOIE DE VIVRE</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${productName} - ${price} | JOIE DE VIVRE">
  <meta name="description" content="${ratingCount > 0 ? `${generateStarRating(parseFloat(averageRating!))} ${averageRating}/5 (${ratingCount} avis) - ` : ''}${price} par ${vendorName}. ${productDescription.substring(0, 120)}">
  <meta name="keywords" content="cadeau ${productName}, achat Abidjan, boutique Côte d'Ivoire, ${vendorName}, cadeaux Afrique">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${previewUrl}">
  <meta property="og:title" content="${productName} - ${price}">
  <meta property="og:description" content="${ratingCount > 0 ? `${generateStarRating(parseFloat(averageRating!))} ${averageRating}/5 (${ratingCount} avis) - ` : ''}${price} par ${vendorName}. ${productDescription.substring(0, 100)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${productName} - ${vendorName}">
  <meta property="og:site_name" content="JOIE DE VIVRE">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:updated_time" content="${new Date().toISOString()}">
  
  <!-- Product specific Open Graph -->
  <meta property="product:price:amount" content="${product.price || 0}">
  <meta property="product:price:currency" content="${product.currency || 'XOF'}">
  <meta property="product:retailer_item_id" content="${productId}">
  <meta property="product:availability" content="in stock">
  <meta property="product:brand" content="${vendorName}">
  <meta property="product:condition" content="new">
  <meta property="og:price:amount" content="${product.price || 0}">
  <meta property="og:price:currency" content="${product.currency || 'XOF'}">
  
  <!-- Pinterest Rich Pin -->
  <meta name="pinterest-rich-pin" content="true">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${previewUrl}">
  <meta property="twitter:title" content="${productName} - ${price}">
  <meta property="twitter:description" content="${ratingCount > 0 ? `${generateStarRating(parseFloat(averageRating!))} ${averageRating}/5 - ` : ''}${price} par ${vendorName}">
  <meta property="twitter:image" content="${imageUrl}">
  <meta property="twitter:image:alt" content="${productName}">
  
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
  
  <!-- Redirect for browsers that somehow get here -->
  <meta http-equiv="refresh" content="0;url=${fullProductUrl}">
  
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
    img { max-width: 100%; height: auto; border-radius: 12px; }
    h1 { color: #7A5DC7; }
    .price { font-size: 1.5rem; font-weight: bold; color: #7A5DC7; }
    .vendor { color: #666; }
    a { color: #7A5DC7; }
  </style>
</head>
<body>
  <img src="${imageUrl}" alt="${productName}">
  <h1>${productName}</h1>
  <p class="price">${price}</p>
  <p class="vendor">par ${vendorName}</p>
  <p><a href="${fullProductUrl}">Voir sur JOIE DE VIVRE →</a></p>
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
    console.log(`Browser detected, redirecting to: ${fullProductUrl}`);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: fullProductUrl,
      },
    });
  } catch (error) {
    console.error("Error in product-preview:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
