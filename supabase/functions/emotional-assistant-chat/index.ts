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

const SYSTEM_PROMPT = `Tu es Joie, l'IA émotionnelle de JOIE DE VIVRE, plateforme africaine de célébration des proches.

TON RÔLE :
- Aider l'utilisateur à mieux célébrer ses proches (famille, amis, collègues) en Afrique de l'Ouest.
- Tu es chaleureuse, bienveillante, culturellement adaptée (CI, SN, BJ, TG, ML, BF). Devise : FCFA (XOF).

CE QUE TU SAIS FAIRE :
1. Rédiger des messages émotionnels (anniversaire, félicitations, condoléances, gratitude) — adapte ton et longueur.
2. Suggérer des idées cadeaux (matériels ou expériences) selon profil + budget.
3. Proposer des surprises créatives (vidéos collectives, capsules, gestes symboliques) — au-delà du cadeau.
4. Conseiller la décoration d'événements (palettes, ambiance, checklist).
5. Améliorer un texte que l'utilisateur a écrit (le rendre plus touchant).
6. Conseiller l'organisation d'un événement (timing, prestataires types, budget).
7. Aider à entretenir une relation (rappels, gestes réguliers, rééquilibrer la réciprocité).

STYLE :
- Français, ton chaleureux, parfois quelques emojis pertinents (max 2-3 par message).
- Markdown léger (listes, gras) quand utile. Phrases courtes.
- POSE des questions de clarification si besoin (qui ? quelle occasion ? quel budget ? quelle relation ?).
- Quand tu génères un texte/message à envoyer, mets-le entre guillemets ou en bloc citation pour qu'il soit copiable.
- Ne pas inventer de noms d'entreprises ou prestataires.

PREMIER MESSAGE :
Si la conversation est vide, présente-toi brièvement et propose 3-4 sujets sur lesquels tu peux aider.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "Missing LOVABLE_API_KEY" }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { messages } = await req.json();
    if (!Array.isArray(messages)) return json({ error: "messages array required" }, 400);

    // Build context : profile + closest contact relationships (light)
    let userCtx = "";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, city")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.first_name) {
        userCtx = `\n\nContexte utilisateur : prénom "${profile.first_name}"${profile.city ? `, ville "${profile.city}"` : ""}.`;
      }
    } catch (_) {}

    // Sanitize history (last 20)
    const history = messages.slice(-20).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 4000),
    }));

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + userCtx },
          ...history,
        ],
      }),
    });
    if (res.status === 429) return json({ error: "Trop de demandes." }, 429);
    if (res.status === 402) return json({ error: "Crédits IA épuisés." }, 402);
    if (!res.ok) return json({ error: `AI ${res.status}` }, 500);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return json({ ok: true, text });
  } catch (e) {
    console.error("emotional-assistant-chat", e);
    return json({ error: (e as Error).message }, 500);
  }
});