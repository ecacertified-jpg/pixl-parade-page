import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!productId) {
      return new Response("Product ID required", { status: 400 });
    }

    // Récupérer les données produit depuis Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Récupérer les ratings
    const { data: ratingsData } = await supabase
      .from("product_ratings")
      .select("rating")
      .eq("product_id", productId);

    const ratingCount = ratingsData?.length || 0;
    const averageRating = ratingCount > 0
      ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : 0;

    // Formater le prix
    const formattedPrice = product.price
      ? `${product.price.toLocaleString("fr-FR")} ${product.currency || "XOF"}`
      : "";
    const vendorName = product.business_accounts?.business_name || "JOIE DE VIVRE";
    const productImage = product.image_url || "https://joiedevivre-africa.com/og-image.png";
    
    // Tronquer le nom si trop long
    const displayName = product.name.length > 45
      ? product.name.substring(0, 42) + "..."
      : product.name;

    // Charger la police Poppins depuis Google Fonts
    let fontData: ArrayBuffer;
    try {
      const fontResponse = await fetch(
        "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2"
      );
      fontData = await fontResponse.arrayBuffer();
    } catch (fontError) {
      console.error("Error loading font:", fontError);
      // Continuer sans police custom
      fontData = new ArrayBuffer(0);
    }

    // Générer l'image OG avec React
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
          {/* Contenu principal */}
          <div style={{ display: "flex", flex: 1, gap: "40px", alignItems: "center" }}>
            {/* Image produit */}
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

            {/* Informations produit */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "20px",
              }}
            >
              {/* Nom du produit */}
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

              {/* Étoiles et avis */}
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

              {/* Prix */}
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

              {/* Vendeur */}
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

          {/* Footer avec branding */}
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

    // Ajouter les headers de cache
    const headers = new Headers(imageResponse.headers);
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(imageResponse.body, {
      status: imageResponse.status,
      headers,
    });
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Error generating image", { status: 500 });
  }
});
