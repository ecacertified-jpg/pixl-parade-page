import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TONE_LABEL: Record<string, string> = {
  joyeux: "joyeux, festif, plein d'énergie, avec des emojis pétillants",
  tendre: "tendre, doux, sincère, plein d'affection",
  humour: "drôle, taquin, avec une touche d'humour bienveillant",
  solennel: "solennel, élégant, posé, profond et inspirant",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { first_name, tone, occasion } = await req.json();
    const safeName = String(first_name ?? "").trim().slice(0, 50) || "cette personne";
    const toneKey = String(tone ?? "joyeux").toLowerCase();
    const toneDesc = TONE_LABEL[toneKey] ?? TONE_LABEL.joyeux;
    const safeOccasion = String(occasion ?? "anniversaire").trim().slice(0, 50);

    const prompt = `Rédige un message ${toneDesc} pour souhaiter un(e) ${safeOccasion} à ${safeName}. ` +
      `Maximum 2-3 phrases courtes, en français, naturel et chaleureux, 1 à 3 emojis pertinents. ` +
      `Ne commence pas par "Cher" ou "Chère". Pas de formule de politesse classique. ` +
      `Réponds uniquement par le message, sans guillemets ni explication.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Tu es un rédacteur expert en messages d'anniversaire en français pour l'Afrique de l'Ouest." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Trop de demandes, réessaie dans un instant." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error("AI gateway error");
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});