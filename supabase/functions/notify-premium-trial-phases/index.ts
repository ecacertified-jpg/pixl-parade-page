// Daily cron: sends emotional OneSignal pushes for each phase
// of the "Premium offert" experience (unlock, post-event, memories ending, archived).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, sendPushToUsers } from "../_shared/push-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") ?? "https://joiedevivre-africa.com";

type Grant = {
  id: string;
  user_id: string;
  target_type: "birthday_page" | "event_page" | "collective_fund";
  target_id: string;
  event_date: string | null;
  premium_until: string;
  memories_until: string;
  archived_at: string;
  notified_unlock: boolean;
  notified_post_event: boolean;
  notified_memories_ending: boolean;
  metadata: Record<string, unknown> | null;
};

function urlForTarget(g: Grant): string {
  switch (g.target_type) {
    case "birthday_page":
      return `${APP_URL}/birthday/${g.target_id}`;
    case "event_page":
      return `${APP_URL}/event/${g.target_id}`;
    case "collective_fund":
      return `${APP_URL}/fund/${g.target_id}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = getAdminClient();
  const nowIso = new Date().toISOString();
  const results = { unlock: 0, post_event: 0, memories_ending: 0, archived: 0 };

  const { data: grants, error } = await admin
    .from("premium_trial_grants")
    .select(
      "id,user_id,target_type,target_id,event_date,premium_until,memories_until,archived_at,notified_unlock,notified_post_event,notified_memories_ending,metadata"
    )
    .returns<Grant[]>();

  if (error) {
    console.error("[premium-trial] load error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const g of grants ?? []) {
    try {
      const url = urlForTarget(g);
      const premiumUntil = new Date(g.premium_until).getTime();
      const memoriesUntil = new Date(g.memories_until).getTime();
      const archivedAt = new Date(g.archived_at).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      // 1) UNLOCK — chaleureux, dès l'attribution
      if (!g.notified_unlock) {
        await sendPushToUsers({
          user_ids: [g.user_id],
          title: "🎁 Un cadeau JDV vous attend",
          message:
            "Joie de Vivre vous offre Premium pour rendre ce moment vraiment unique. Découvrez tout ce qui est débloqué pour vous.",
          url,
          category: "gift",
          type: "premium_trial_unlock",
          data: { grant_id: g.id, target_type: g.target_type, target_id: g.target_id },
        });
        await admin
          .from("premium_trial_grants")
          .update({ notified_unlock: true })
          .eq("id", g.id);
        await admin.from("premium_trial_events").insert({
          user_id: g.user_id,
          grant_id: g.id,
          event_type: "unlock_viewed",
          metadata: { channel: "push" },
        });
        results.unlock++;
      }

      // 2) POST-EVENT — au lendemain du jour J : phase souvenirs
      if (!g.notified_post_event && now >= premiumUntil) {
        await sendPushToUsers({
          user_ids: [g.user_id],
          title: "💫 Et si la fête continuait ?",
          message:
            "Les souvenirs de votre événement sont précieux. Pendant 7 jours, ils restent en accès Premium — partagez-les, sauvegardez-les, faites-les durer.",
          url,
          category: "gratitude",
          type: "premium_trial_post_event",
          data: { grant_id: g.id, phase: "memories" },
        });
        await admin
          .from("premium_trial_grants")
          .update({ notified_post_event: true })
          .eq("id", g.id);
        await admin.from("premium_trial_events").insert({
          user_id: g.user_id,
          grant_id: g.id,
          event_type: "memories_phase_entered",
          metadata: { channel: "push" },
        });
        results.post_event++;
      }

      // 3) MEMORIES ENDING — 24h avant la fin de la phase souvenirs (J+6)
      if (
        !g.notified_memories_ending &&
        now >= memoriesUntil - oneDay &&
        now < memoriesUntil
      ) {
        await sendPushToUsers({
          user_ids: [g.user_id],
          title: "⏳ Vos souvenirs s'apprêtent à dormir",
          message:
            "Demain, votre page entre en mode limité. Passez Premium pour la garder vivante et conserver chaque émotion à jamais.",
          url: `${APP_URL}/pricing?from=trial_memories_ending`,
          category: "gift",
          type: "premium_trial_memories_ending",
          data: { grant_id: g.id, phase: "limited_soon" },
        });
        await admin
          .from("premium_trial_grants")
          .update({ notified_memories_ending: true })
          .eq("id", g.id);
        await admin.from("premium_trial_events").insert({
          user_id: g.user_id,
          grant_id: g.id,
          event_type: "post_event_viewed",
          metadata: { phase: "limited_soon", channel: "push" },
        });
        results.memories_ending++;
      }

      // 4) ARCHIVED — au J+30, dernière relance émotionnelle (une seule fois via metadata flag)
      const meta = (g.metadata ?? {}) as Record<string, unknown>;
      if (!meta.notified_archived && now >= archivedAt) {
        await sendPushToUsers({
          user_ids: [g.user_id],
          title: "🌙 Vos souvenirs sont en sommeil",
          message:
            "Votre page est archivée mais rien n'est perdu. Réveillez-la en Premium et redonnez vie à ce moment unique.",
          url: `${APP_URL}/pricing?from=trial_archived`,
          category: "gift",
          type: "premium_trial_archived",
          data: { grant_id: g.id, phase: "archived" },
        });
        await admin
          .from("premium_trial_grants")
          .update({ metadata: { ...meta, notified_archived: true, notified_archived_at: nowIso } })
          .eq("id", g.id);
        await admin.from("premium_trial_events").insert({
          user_id: g.user_id,
          grant_id: g.id,
          event_type: "archived",
          metadata: { channel: "push" },
        });
        results.archived++;
      }
    } catch (e) {
      console.error("[premium-trial] grant error", g.id, e);
    }
  }

  return new Response(JSON.stringify({ ok: true, results, scanned: grants?.length ?? 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});