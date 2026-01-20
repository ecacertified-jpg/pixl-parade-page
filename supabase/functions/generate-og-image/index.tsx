import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  hashData,
  getCachedImage,
  cacheImage,
  createCacheRedirectResponse,
  getCacheClients,
} from "../_shared/og-cache-utils.ts";

// Couleurs JOIE DE VIVRE
const COLORS = {
  primary: "#7A5DC7",
  secondary: "#FAD4E1",
  background: "#E8E2F5",
  text: "#2E2E2E",
  accent: "#C084FC",
  white: "#FFFFFF",
  star: "#F59E0B",
  starEmpty: "#D1D5DB",
  muted: "#6B7280",
};

// Composant étoiles de notation
const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i === Math.ceil(rating) && rating % 1 >= 0.5;
    stars.push(
      <span key={i} style={{ color: filled || half ? COLORS.star : COLORS.starEmpty, fontSize: "32px" }}>
        {filled || half ? "★" : "☆"}
      </span>
    );
  }
  return <div style={{ display: "flex", gap: "4px" }}>{stars}</div>;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("id");
    const forceRefresh = url.searchParams.get("refresh") === "true";

    if (!productId) {
      return new Response("Product ID required", { status: 400 });
    }

    // Get Supabase clients
    const { supabase, supabaseAdmin } = getCacheClients();
    const cacheKey = `product_${productId}`;

    // Check for cached image (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    // Fetch product data
    const { data: product, error } = await supabase
      .from("products")
      .select(`
        id, name, description, price, currency, image_url,
        business_accounts!products_business_id_fkey (business_name)
      `)
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error);
      return new Response("Error fetching product", { status: 500 });
    }

    if (!product) {
      return new Response("Product not found", { status: 404 });
    }

    // Fetch ratings
    const { data: ratingsData } = await supabase
      .from("product_ratings")
      .select("rating")
      .eq("product_id", productId);

    const ratingCount = ratingsData?.length || 0;
    const averageRating = ratingCount > 0
      ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : 0;

    // Generate data hash for cache invalidation
    const dataHash = hashData(JSON.stringify({
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      rating_count: ratingCount,
      average_rating: averageRating.toFixed(1),
    }));

    // Check if data has changed (smart invalidation)
    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached && cached.dataHash === dataHash) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    // Prepare display data
    const formattedPrice = product.price
      ? `${product.price.toLocaleString("fr-FR")} ${product.currency || "XOF"}`
      : "";
    const vendorName = product.business_accounts?.business_name || "JOIE DE VIVRE";
    const productImage = product.image_url || "https://joiedevivre-africa.com/og-image.png";
    const displayName = product.name.length > 45
      ? product.name.substring(0, 42) + "..."
      : product.name;

    // Load Poppins font
    let fontData: ArrayBuffer;
    try {
      const fontResponse = await fetch(
        "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2"
      );
      fontData = await fontResponse.arrayBuffer();
    } catch (fontError) {
      console.error("Error loading font:", fontError);
      fontData = new ArrayBuffer(0);
    }

    // Generate OG image with React
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.secondary} 100%)`,
            padding: "40px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {/* Main content */}
          <div style={{ display: "flex", flex: 1, gap: "40px", alignItems: "center" }}>
            {/* Product image */}
            <div
              style={{
                width: "380px",
                height: "380px",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(122, 93, 199, 0.3)",
                display: "flex",
                flexShrink: 0,
              }}
            >
              <img
                src={productImage}
                width={380}
                height={380}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Product info */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "20px",
              }}
            >
              {/* Product name */}
              <div
                style={{
                  fontSize: "44px",
                  fontWeight: 700,
                  color: COLORS.text,
                  lineHeight: 1.2,
                  display: "flex",
                }}
              >
                {displayName}
              </div>

              {/* Stars and reviews */}
              {ratingCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <StarRating rating={averageRating} />
                  <span style={{ color: COLORS.text, fontSize: "24px", fontWeight: 600 }}>
                    {averageRating.toFixed(1)}/5
                  </span>
                  <span style={{ color: COLORS.muted, fontSize: "22px" }}>
                    ({ratingCount} avis)
                  </span>
                </div>
              )}

              {/* Price */}
              <div
                style={{
                  fontSize: "52px",
                  fontWeight: 700,
                  color: COLORS.primary,
                  display: "flex",
                }}
              >
                {formattedPrice}
              </div>

              {/* Vendor */}
              <div
                style={{
                  fontSize: "24px",
                  color: COLORS.muted,
                  display: "flex",
                }}
              >
                par {vendorName}
              </div>
            </div>
          </div>

          {/* Footer with branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "24px",
              padding: "20px 28px",
              background: COLORS.primary,
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                color: COLORS.white,
              }}
            >
              <span style={{ fontSize: "36px" }}>🎁</span>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                JOIE DE VIVRE
              </span>
            </div>
            <span
              style={{
                fontSize: "22px",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              joiedevivre-africa.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData.byteLength > 0
          ? [
              {
                name: "Poppins",
                data: fontData,
                style: "normal" as const,
                weight: 700,
              },
            ]
          : [],
      }
    );

    // Get image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Cache the generated image
    await cacheImage(supabaseAdmin, "product", productId, cacheKey, imageBuffer, dataHash);

    // Return the freshly generated image
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
});
