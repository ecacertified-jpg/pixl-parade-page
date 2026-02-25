import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  hashData,
  getCachedImage,
  cacheImage,
  createCacheRedirectResponse,
  getCacheClients,
  calculateProgressBucket,
} from "../_shared/og-cache-utils.ts";
import { getPoppinsFontConfig } from "../_shared/og-font-loader.ts";

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
  success: "#22C55E",
  gold: "#F59E0B",
};

// Occasion emojis
const occasionEmojis: Record<string, string> = {
  birthday: "🎂",
  wedding: "💒",
  graduation: "🎓",
  baby: "👶",
  retirement: "🎉",
  promotion: "🚀",
  other: "🎁",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fundId = url.searchParams.get("id");
    const forceRefresh = url.searchParams.get("refresh") === "true";

    if (!fundId) {
      return new Response("Fund ID required", { status: 400, headers: corsHeaders });
    }

    // Get Supabase clients
    const { supabase, supabaseAdmin } = getCacheClients();

    // Fetch fund data with product and contact
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
        products:business_product_id (
          id,
          name,
          image_url
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
      return new Response("Fund not found", { status: 404, headers: corsHeaders });
    }

    // Calculate progress for cache key (bucket system)
    const currentAmount = fund.current_amount || 0;
    const targetAmount = fund.target_amount || 1;
    const progressBucket = calculateProgressBucket(currentAmount, targetAmount);
    const progressPercent = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);

    // Cache key includes progress bucket to reduce regeneration
    const cacheKey = `fund_${fundId}_progress${progressBucket}`;

    // Check for cached image (unless force refresh)
    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    // Get contributor count
    const { count: contributorCount } = await supabase
      .from("fund_contributions")
      .select("*", { count: "exact", head: true })
      .eq("fund_id", fundId);

    // Generate data hash
    const dataHash = hashData(JSON.stringify({
      title: fund.title,
      progress_bucket: progressBucket,
      occasion: fund.occasion,
      contributor_count: contributorCount,
    }));

    // Check if data has changed
    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached && cached.dataHash === dataHash) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    // Extract data
    const product = fund.products as { id: string; name: string; image_url: string } | null;
    const contact = fund.contacts as { id: string; name: string; avatar_url: string } | null;
    const currency = fund.currency || "XOF";
    const occasion = fund.occasion || "other";
    const emoji = occasionEmojis[occasion] || "🎁";
    const beneficiaryName = contact?.name || "un proche";
    const productName = product?.name || "";
    const productImage = product?.image_url || "";

    // Format amounts
    const formatAmount = (amount: number) => new Intl.NumberFormat("fr-FR").format(amount);

    // Load Poppins font (.ttf format compatible with satori)
    const fonts = await getPoppinsFontConfig();

    // Generate OG image
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
          <div style={{ display: "flex", flex: 1, gap: "40px" }}>
            {/* Left: Product image or beneficiary avatar */}
            <div
              style={{
                width: "320px",
                height: "320px",
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(122, 93, 199, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: productImage ? "transparent" : COLORS.primary,
              }}
            >
              {productImage ? (
                <img
                  src={productImage}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : contact?.avatar_url ? (
                <img
                  src={contact.avatar_url}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ fontSize: "120px" }}>{emoji}</span>
              )}
            </div>

            {/* Right: Fund info */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              {/* Emoji + Title */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "48px" }}>{emoji}</span>
                <h1
                  style={{
                    fontSize: "42px",
                    fontWeight: 700,
                    color: COLORS.text,
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  {fund.title.length > 35 ? fund.title.substring(0, 35) + "..." : fund.title}
                </h1>
              </div>

              {/* Beneficiary */}
              <div
                style={{
                  fontSize: "28px",
                  color: "#6B7280",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Pour <span style={{ color: COLORS.primary, fontWeight: 600 }}>{beneficiaryName}</span>
              </div>

              {/* Product name if available */}
              {productName && (
                <div
                  style={{
                    fontSize: "22px",
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🎁 {productName.length > 40 ? productName.substring(0, 40) + "..." : productName}
                </div>
              )}

              {/* Progress bar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "24px",
                    background: "rgba(122, 93, 199, 0.2)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: progressPercent > 15 ? "12px" : "0",
                    }}
                  >
                    {progressPercent > 15 && (
                      <span style={{ color: COLORS.white, fontSize: "14px", fontWeight: 600 }}>
                        {progressPercent}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Amounts */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "40px",
                      fontWeight: 700,
                      color: COLORS.primary,
                    }}
                  >
                    {formatAmount(currentAmount)}
                  </span>
                  <span style={{ fontSize: "24px", color: "#6B7280" }}>
                    / {formatAmount(targetAmount)} {currency}
                  </span>
                </div>

                {/* Contributors count */}
                {(contributorCount || 0) > 0 && (
                  <div
                    style={{
                      fontSize: "20px",
                      color: "#9CA3AF",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    👥 {contributorCount} contributeur{(contributorCount || 0) > 1 ? "s" : ""}
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
        fonts,
      }
    );

    // Get image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Cache the generated image
    await cacheImage(supabaseAdmin, "fund", fundId, cacheKey, imageBuffer, dataHash);

    // Return the freshly generated image
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error generating fund OG image:", error);
    return new Response("Error generating image", { status: 500, headers: corsHeaders });
  }
});
