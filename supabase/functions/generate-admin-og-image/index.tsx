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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COLORS = {
  primary: "#7A5DC7",
  secondary: "#FAD4E1",
  background: "#E8E2F5",
  text: "#2E2E2E",
  accent: "#C084FC",
  white: "#FFFFFF",
  muted: "#6B7280",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const forceRefresh = url.searchParams.get("refresh") === "true";

    if (!code || !code.startsWith("ADM-")) {
      return new Response("Invalid code", { status: 400, headers: corsHeaders });
    }

    const { supabase, supabaseAdmin } = getCacheClients();
    const cacheKey = `admin_${code}`;

    // Check cache
    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    // Fetch admin info
    let adminName = "";
    let avatarUrl = "";

    const { data: shareCode } = await supabaseAdmin
      .from("admin_share_codes")
      .select("admin_user_id")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (shareCode?.admin_user_id) {
      const { data: adminUser } = await supabaseAdmin
        .from("admin_users")
        .select("user_id")
        .eq("id", shareCode.admin_user_id)
        .maybeSingle();

      if (adminUser?.user_id) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("user_id", adminUser.user_id)
          .maybeSingle();

        if (profile) {
          adminName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
          avatarUrl = profile.avatar_url || "";
        }
      }
    }

    // Data hash for smart cache invalidation
    const dataHash = hashData(JSON.stringify({ adminName, avatarUrl }));

    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached && cached.dataHash === dataHash) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    const displayName = adminName || "un membre";

    // Load Poppins font
    let fontData: ArrayBuffer;
    try {
      const fontResponse = await fetch(
        "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2"
      );
      fontData = await fontResponse.arrayBuffer();
    } catch {
      fontData = new ArrayBuffer(0);
    }

    // Generate OG image
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.secondary} 50%, ${COLORS.background} 100%)`,
            fontFamily: "Poppins, sans-serif",
            padding: "60px",
          }}
        >
          {/* Top branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            <span style={{ fontSize: "48px" }}>🎁</span>
            <span
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: COLORS.primary,
                letterSpacing: "1px",
              }}
            >
              JOIE DE VIVRE
            </span>
          </div>

          {/* Avatar circle */}
          {avatarUrl ? (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                overflow: "hidden",
                border: `4px solid ${COLORS.primary}`,
                boxShadow: "0 8px 30px rgba(122, 93, 199, 0.3)",
                marginBottom: "32px",
                display: "flex",
              }}
            >
              <img
                src={avatarUrl}
                width={120}
                height={120}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "32px",
                boxShadow: "0 8px 30px rgba(122, 93, 199, 0.3)",
              }}
            >
              <span style={{ fontSize: "56px" }}>🎉</span>
            </div>
          )}

          {/* Main text */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: COLORS.text,
              marginBottom: "16px",
              display: "flex",
            }}
          >
            Rejoins-nous !
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "32px",
              color: COLORS.muted,
              marginBottom: "48px",
              display: "flex",
            }}
          >
            Invité par {displayName}
          </div>

          {/* Footer bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 40px",
              background: COLORS.primary,
              borderRadius: "16px",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.85)" }}>
              Célébrez les moments heureux ensemble
            </span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px" }}>
              •
            </span>
            <span style={{ fontSize: "18px", color: "rgba(255,255,255,0.7)" }}>
              joiedevivre-africa.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData.byteLength > 0
          ? [{ name: "Poppins", data: fontData, style: "normal" as const, weight: 700 }]
          : [],
      }
    );

    const imageBuffer = await imageResponse.arrayBuffer();

    // Cache the image
    await cacheImage(supabaseAdmin, "admin", code, cacheKey, imageBuffer, dataHash);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error generating admin OG image:", error);
    return new Response("Error generating image", { status: 500, headers: corsHeaders });
  }
});
