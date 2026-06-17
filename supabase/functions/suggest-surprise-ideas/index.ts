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

    const { recipient_name, relationship, occasion, budget_xof, interests } = await req.json();
    const name = String(recipient_name ?? "cette personne").slice(0, 80);
    const rel = String(relationship ?? "proche").slice(0, 40);
    const occ = String(occasion ?? "anniversaire").slice(0, 40);
    const budget = typeof budget_xof === "number" ? `${budget_xof} XOF` : "modeste";
    const tastes = Array.isArray(interests) ? interests.slice(0, 5).join(", ") : "—";

    const system = `Tu es un expert en surprises émotionnelles pour l'Afrique de l'Ouest (Côte d'Ivoire, Sénégal, etc.). Tu proposes des idées CRÉATIVES qui vont AU-DELÀ du cadeau matériel : gestes symboliques, mises en scène, vidéos collectives, capsules souvenirs, rituels.`;

    const prompt = `Propose 5 idées de surprise pour ${name} (${rel}) à l'occasion : ${occ}.
Budget total: ${budget}. Centres d'intérêt: ${tastes}.

Renvoie STRICTEMENT JSON: { "ideas": [ { "title": "...", "description": "...", "emotion": "joie|tendresse|nostalgie|fierté|complicité", "effort": "facile|moyen|ambitieux", "estimated_cost_xof": 0 } ] }
- 5 idées variées (au moins 2 sans achat)
- description: 1-2 phrases concrètes, ton chaleureux français
- estimated_cost_xof: estimation FCFA, 0 si gratuit`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) return json({ error: "Trop de demandes, réessayez." }, 429);
    if (res.status === 402) return json({ error: "Crédits IA épuisés." }, 402);
    if (!res.ok) return json({ error: `AI ${res.status}` }, 500);

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { return json({ error: "Parse error", raw }, 500); }

    return json({ ok: true, ideas: parsed.ideas ?? [] });
  } catch (e) {
    console.error("suggest-surprise-ideas", e);
    return json({ error: (e as Error).message }, 500);
  }
});