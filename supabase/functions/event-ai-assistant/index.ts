import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Action = "generate_checklist" | "suggest_budget" | "suggest_vendors" | "ask";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(system: string, userPrompt: string, jsonMode = false): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY!,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { event_id, action, question } = body as { event_id: string; action: Action; question?: string };
    if (!event_id || !action) return json({ error: "event_id and action required" }, 400);

    const { data: ev, error: evErr } = await supabase
      .from("event_pages")
      .select("id, creator_id, title, occasion, description, event_date")
      .eq("id", event_id)
      .single();
    if (evErr || !ev) return json({ error: "Event not found" }, 404);
    if (ev.creator_id !== user.id) return json({ error: "Forbidden" }, 403);

    const ctx = `Événement: "${ev.title}"
Type: ${ev.occasion}
Date: ${ev.event_date ?? "à définir"}
Description: ${ev.description ?? "—"}`;

    if (action === "generate_checklist") {
      const system = `Tu es un assistant expert en organisation d'événements en Afrique de l'Ouest (Côte d'Ivoire, Sénégal, etc.). Tu génères des checklists pratiques, culturellement adaptées et réalistes.`;
      const prompt = `Génère une checklist d'organisation pour cet événement.
${ctx}

Renvoie STRICTEMENT un JSON: { "items": [ { "task": "...", "category": "Lieu|Tenue|Invitations|Animation|Restauration|Décoration|Logistique|Autre", "due_offset_days": -30 } ] }
- 10 à 15 tâches concrètes
- due_offset_days = nombre de jours AVANT l'événement (négatif), 0 pour le jour J
- En français, ton bienveillant`;
      const raw = await callGemini(system, prompt, true);
      let parsed: any;
      try { parsed = JSON.parse(raw); } catch { return json({ error: "AI parse error", raw }, 500); }
      const items = Array.isArray(parsed?.items) ? parsed.items : [];

      const rows = items.slice(0, 20).map((it: any, i: number) => ({
        event_id,
        task: String(it.task ?? "").slice(0, 300),
        category: it.category ? String(it.category).slice(0, 60) : null,
        due_offset_days: typeof it.due_offset_days === "number" ? it.due_offset_days : null,
        position: i,
        ai_generated: true,
      })).filter((r: any) => r.task);

      if (rows.length === 0) return json({ error: "No items generated" }, 500);

      const { error: insErr } = await supabase.from("event_checklist_items").insert(rows);
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ ok: true, count: rows.length });
    }

    if (action === "suggest_budget") {
      const system = `Tu es un consultant budget pour événements en Afrique de l'Ouest (devise XOF / FCFA). Tu donnes des fourchettes réalistes en FCFA.`;
      const prompt = `Propose une répartition budgétaire pour cet événement, en français, format Markdown clair avec un tableau (Poste | Fourchette XOF | Notes) et un total estimé bas/haut. ${ctx}`;
      const text = await callGemini(system, prompt);
      return json({ ok: true, text });
    }

    if (action === "suggest_vendors") {
      const system = `Tu es un assistant qui recommande les TYPES de prestataires nécessaires pour un événement africain (sans inventer de noms d'entreprises).`;
      const prompt = `Liste les types de prestataires à prévoir et ce qu'il faut leur demander. Format Markdown, listes à puces. ${ctx}`;
      const text = await callGemini(system, prompt);
      return json({ ok: true, text });
    }

    if (action === "ask") {
      if (!question || question.length < 2) return json({ error: "question required" }, 400);
      const system = `Tu es un assistant d'organisation d'événements (Joie de Vivre), bienveillant, concret, culturellement adapté à l'Afrique de l'Ouest. Réponds en français, format Markdown.`;
      const prompt = `Contexte:\n${ctx}\n\nQuestion: ${question.slice(0, 1000)}`;
      const text = await callGemini(system, prompt);
      return json({ ok: true, text });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("event-ai-assistant error", e);
    return json({ error: (e as Error).message }, 500);
  }
});