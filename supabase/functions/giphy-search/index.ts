import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const cache = new Map<string, { ts: number; data: unknown }>();
const TTL = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("GIPHY_API_KEY");
    if (!apiKey) throw new Error("GIPHY_API_KEY not configured");

    const body = await req.json();
    const query = String(body?.query ?? "").trim().slice(0, 100);
    const type = ["gif", "sticker", "text"].includes(body?.type) ? body.type : "gif";
    const limit = Math.min(Math.max(parseInt(body?.limit ?? 24, 10) || 24, 1), 50);

    const cacheKey = `${type}:${query}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let endpoint = "";
    const params = new URLSearchParams({ api_key: apiKey, limit: String(limit), rating: "pg-13" });
    if (type === "text") {
      endpoint = "https://api.giphy.com/v1/text/search";
      params.set("s", query || "happy birthday");
    } else if (type === "sticker") {
      endpoint = query
        ? "https://api.giphy.com/v1/stickers/search"
        : "https://api.giphy.com/v1/stickers/trending";
      if (query) params.set("q", query);
    } else {
      endpoint = query
        ? "https://api.giphy.com/v1/gifs/search"
        : "https://api.giphy.com/v1/gifs/trending";
      if (query) params.set("q", query);
    }

    const resp = await fetch(`${endpoint}?${params.toString()}`);
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Giphy error", resp.status, t);
      throw new Error("Giphy API error");
    }
    const json = await resp.json();
    const items = (json.data ?? []).map((g: any) => ({
      id: g.id,
      title: g.title,
      url: g.images?.fixed_height?.url || g.images?.original?.url,
      preview: g.images?.fixed_height_small?.url || g.images?.preview_gif?.url,
      width: g.images?.fixed_height?.width,
      height: g.images?.fixed_height?.height,
    }));
    const data = { items };
    cache.set(cacheKey, { ts: Date.now(), data });
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("giphy-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});