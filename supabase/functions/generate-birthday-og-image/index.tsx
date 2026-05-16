import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import {
  hashData,
  getCachedImage,
  cacheImage,
  createCacheRedirectResponse,
  getCacheClients,
} from "../_shared/og-cache-utils.ts";
import { getPoppinsFontConfig } from "../_shared/og-font-loader.ts";

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
    const slug = url.searchParams.get("slug");
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const version = url.searchParams.get("v") || "0";

    if (!slug) {
      return new Response("slug required", { status: 400, headers: corsHeaders });
    }

    const { supabase, supabaseAdmin } = getCacheClients();

    const { data: page } = await supabase
      .from("birthday_pages")
      .select("user_id, slug, celebration_year, cover_image_url")
      .eq("slug", slug)
      .maybeSingle();

    if (!page) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, birthday, avatar_url")
      .eq("user_id", page.user_id)
      .maybeSingle();

    const firstName = (profile?.first_name || "notre ami(e)").trim();
    let age: number | null = null;
    if (profile?.birthday) {
      const m = profile.birthday.match(/^(\d{4})-/);
      if (m) {
        const by = parseInt(m[1], 10);
        if (by && by <= page.celebration_year) age = page.celebration_year - by;
      }
    }
    const avatar = profile?.avatar_url || "";

    // Include version in cache key + hash so a bumped ?v= forces a fresh
    // image while leaving older versions cached for crawlers that may
    // still hold the old URL.
    const cacheKey = `birthday_${slug}_${page.celebration_year}_${version}`;
    const dataHash = hashData(
      JSON.stringify({ firstName, age, avatar, y: page.celebration_year, v: version }),
    );

    if (!forceRefresh) {
      const cached = await getCachedImage(supabase, cacheKey);
      if (cached && cached.dataHash === dataHash) {
        return createCacheRedirectResponse(cached.url);
      }
    }

    const ageText = age ? `${age} ans` : "🎂";
    const fonts = await getPoppinsFontConfig();

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.secondary} 100%)`,
            padding: "60px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          <div style={{ display: "flex", flex: 1, gap: "48px", alignItems: "center" }}>
            <div
              style={{
                width: "340px",
                height: "340px",
                borderRadius: "9999px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: COLORS.primary,
                boxShadow: "0 20px 60px rgba(122, 93, 199, 0.35)",
                flexShrink: 0,
              }}
            >
              {avatar ? (
                <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "180px" }}>🎂</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "16px" }}>
              <div style={{ fontSize: "32px", color: COLORS.muted, display: "flex" }}>
                🎉 Anniversaire de
              </div>
              <div
                style={{
                  fontSize: "84px",
                  fontWeight: 700,
                  color: COLORS.text,
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                {firstName.length > 18 ? firstName.substring(0, 18) + "…" : firstName}
              </div>
              {age && (
                <div
                  style={{
                    fontSize: "56px",
                    fontWeight: 700,
                    color: COLORS.primary,
                    display: "flex",
                  }}
                >
                  {ageText} ✨
                </div>
              )}
              <div style={{ fontSize: "26px", color: COLORS.muted, display: "flex", marginTop: "8px" }}>
                Écris un message, partage tes photos, participe au cadeau collectif
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "24px",
              padding: "20px 28px",
              background: COLORS.primary,
              borderRadius: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", color: COLORS.white }}>
              <span style={{ fontSize: "36px" }}>🎁</span>
              <span style={{ fontSize: "32px", fontWeight: 600, letterSpacing: "0.5px" }}>
                JOIE DE VIVRE
              </span>
            </div>
            <span style={{ fontSize: "22px", color: "rgba(255,255,255,0.85)" }}>
              joiedevivre-africa.com
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );

    const imageBuffer = await imageResponse.arrayBuffer();
    await cacheImage(supabaseAdmin, "birthday", slug, cacheKey, imageBuffer, dataHash);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        // Long immutable-style cache: URL changes via ?v= when content changes.
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("generate-birthday-og-image error:", err);
    return new Response("Error generating image", { status: 500, headers: corsHeaders });
  }
});