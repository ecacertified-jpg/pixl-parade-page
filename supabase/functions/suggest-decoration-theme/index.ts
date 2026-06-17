import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const { occasion, style, budget_xof, guests, venue } = await req.json();
    const occ = String(occasion ?? "anniversaire").slice(0, 40);
    const sty = String(style ?? "moderne").slice(0, 40);
    const budget = typeof budget_xof === "number" ? `${budget_xof} XOF` : "moyen";
    const guestCount = typeof guests === "number" ? guests : 20;
    const venueDesc = String(venue ?? "intérieur").slice(0, 80);

    const system = `Tu es une décoratrice événementielle pour l'Afrique de l'Ouest. Tu proposes des thèmes cohérents, élégants et réalisables avec un budget modéré, en valorisant les pagnes/tissus locaux quand pertinent.`;

    const prompt = `Propose un thème déco pour: occasion "${occ}", style "${sty}", ${guestCount} invités, lieu "${venueDesc}", budget ${budget}.

Renvoie STRICTEMENT JSON: {
  "theme_name": "...",
  "mood": "...",
  "palette": ["#HEX","#HEX","#HEX","#HEX"],
  "key_elements": ["..."],
  "checklist": [{"item":"...","quantity":"...","estimated_cost_xof":0}],
  "tips": "..."
}
- palette: 4 couleurs hex cohérentes
- key_elements: 5-7 éléments visuels clés
- checklist: 6-10 items à acheter/préparer
- tips: 2-3 conseils pratiques`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) return json({ error: "Trop de demandes." }, 429);
    if (res.status === 402) return json({ error: "Crédits IA épuisés." }, 402);
    if (!res.ok) return json({ error: `AI ${res.status}` }, 500);

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return json({ error: "Parse error", raw }, 500); }

    return json({ ok: true, theme: parsed });
  } catch (e) {
    console.error("suggest-decoration-theme", e);
    return json({ error: (e as Error).message }, 500);
  }
});