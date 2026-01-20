import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// JOIE DE VIVRE Colors
const COLORS = {
  primary: "#7A5DC7",
  secondary: "#FAD4E1",
  background: "#E8E2F5",
  text: "#2E2E2E",
  accent: "#C084FC",
  white: "#FFFFFF",
  gold: "#F59E0B",
  muted: "#6B7280",
};

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {Array(fullStars)
        .fill(0)
        .map((_, i) => (
          <span key={`full-${i}`} style={{ color: COLORS.gold, fontSize: "28px" }}>
            ★
          </span>
        ))}
      {hasHalfStar && (
        <span style={{ color: COLORS.gold, fontSize: "28px" }}>★</span>
      )}
      {Array(emptyStars)
        .fill(0)
        .map((_, i) => (
          <span key={`empty-${i}`} style={{ color: "#D1D5DB", fontSize: "28px" }}>
            ★
          </span>
        ))}
    </div>
  );
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("id");

    if (!businessId) {
      return new Response("Business ID required", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch business data
    const { data: business, error } = await supabase
      .from("business_accounts")
      .select(`
        id,
        business_name,
        business_type,
        description,
        logo_url,
        address
      `)
      .eq("id", businessId)
      .eq("is_active", true)
      .eq("status", "active")
      .single();

    if (error || !business) {
      console.error("Business not found:", error);
      return new Response("Business not found", { status: 404, headers: corsHeaders });
    }

    // Count active products
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("is_active", true);

    // Get ratings from product_ratings
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

    // Extract data
    const businessName = business.business_name || "Boutique";
    const businessType = business.business_type || "";
    const logoUrl = business.logo_url || "";
    const address = business.address || "";

    // Load Poppins font
    const fontData = await fetch(
      "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2"
    ).then((res) => res.arrayBuffer());

    // Generate OG image
    return new ImageResponse(
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
            {/* Left: Logo */}
            <div
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                overflow: "hidden",
                border: `6px solid ${COLORS.primary}`,
                boxShadow: "0 20px 60px rgba(122, 93, 199, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: logoUrl ? COLORS.white : COLORS.primary,
                flexShrink: 0,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ fontSize: "80px" }}>🏪</span>
              )}
            </div>

            {/* Right: Business info */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              {/* Business name */}
              <h1
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  color: COLORS.text,
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {businessName.length > 28 ? businessName.substring(0, 28) + "..." : businessName}
              </h1>

              {/* Business type */}
              {businessType && (
                <div
                  style={{
                    fontSize: "26px",
                    color: COLORS.primary,
                    fontWeight: 500,
                  }}
                >
                  {businessType}
                </div>
              )}

              {/* Rating */}
              {totalRatings > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                  <StarRating rating={averageRating} />
                  <span style={{ fontSize: "24px", color: COLORS.muted }}>
                    {averageRating.toFixed(1)}/5 ({totalRatings} avis)
                  </span>
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
                {/* Products count */}
                {(productsCount || 0) > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      background: "rgba(122, 93, 199, 0.15)",
                      borderRadius: "30px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>🎁</span>
                    <span style={{ fontSize: "22px", color: COLORS.primary, fontWeight: 600 }}>
                      {productsCount} produit{(productsCount || 0) > 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Address */}
                {address && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      background: "rgba(122, 93, 199, 0.15)",
                      borderRadius: "30px",
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>📍</span>
                    <span style={{ fontSize: "20px", color: COLORS.muted }}>
                      {address.length > 25 ? address.substring(0, 25) + "..." : address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "24px",
              padding: "16px 24px",
              background: COLORS.primary,
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: COLORS.white,
              }}
            >
              <span style={{ fontSize: "32px" }}>🎁</span>
              <span style={{ fontSize: "28px", fontWeight: 600 }}>JOIE DE VIVRE</span>
            </div>
            <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.8)" }}>
              joiedevivre-africa.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Poppins",
            data: fontData,
            style: "normal",
            weight: 700,
          },
        ],
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error generating business OG image:", error);
    return new Response("Error generating image", { status: 500, headers: corsHeaders });
  }
});
