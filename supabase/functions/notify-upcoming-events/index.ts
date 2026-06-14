import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsApp } from "../_shared/sms-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") ?? "https://joiedevivre-africa.com";

type Milestone = "J-30" | "J-7" | "J-1" | "J-0";

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMessage(
  guestName: string,
  eventTitle: string,
  occasion: string | null,
  eventDate: string,
  slug: string,
  rsvpToken: string | null,
  milestone: Milestone,
) {
  const prettyDate = new Date(eventDate + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const label =
    milestone === "J-30" ? "dans 30 jours" :
    milestone === "J-7"  ? "dans 1 semaine" :
    milestone === "J-1"  ? "demain" : "aujourd'hui";
  const emoji = occasion === "wedding" ? "💍" : "🎉";
  const eventUrl = `${APP_URL}/event/${slug}`;
  const rsvpUrl = rsvpToken ? `${APP_URL}/rsvp/${rsvpToken}` : eventUrl;

  return `${emoji} Bonjour ${guestName} !\n\n*${eventTitle}* a lieu ${label} (${prettyDate}).\n\n${rsvpToken ? `Confirme ta présence ici : ${rsvpUrl}` : `Détails : ${eventUrl}`}\n\nJOIE DE VIVRE`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const today = new Date();
    const targets: { milestone: Milestone; date: string }[] = [
      { milestone: "J-30", date: ymd(addDays(today, 30)) },
      { milestone: "J-7",  date: ymd(addDays(today, 7)) },
      { milestone: "J-1",  date: ymd(addDays(today, 1)) },
      { milestone: "J-0",  date: ymd(today) },
    ];

    let totalSent = 0;
    let totalSkipped = 0;

    for (const t of targets) {
      const { data: events, error: evErr } = await admin
        .from("event_pages")
        .select("id, slug, title, occasion, event_date, is_active")
        .eq("event_date", t.date)
        .eq("is_active", true);

      if (evErr) { console.error("event_pages fetch", evErr); continue; }

      for (const ev of events ?? []) {
        const { data: guests } = await admin
          .from("event_guests")
          .select("id, name, phone, rsvp_token, rsvp_response")
          .eq("page_id", ev.id);

        for (const g of guests ?? []) {
          if (!g.phone) continue;
          // Skip if guest declined
          if (g.rsvp_response === "no") continue;

          // Dedupe via unique constraint
          const { data: existing } = await admin
            .from("event_reminder_log")
            .select("id")
            .eq("event_id", ev.id)
            .eq("guest_id", g.id)
            .eq("milestone", t.milestone)
            .maybeSingle();
          if (existing) { totalSkipped++; continue; }

          const msg = buildMessage(
            g.name || "ami",
            ev.title || "Notre événement",
            ev.occasion,
            ev.event_date,
            ev.slug,
            g.rsvp_token,
            t.milestone,
          );

          const r = await sendWhatsApp(g.phone, msg);
          await admin.from("event_reminder_log").insert({
            event_id: ev.id,
            guest_id: g.id,
            milestone: t.milestone,
            channel: "whatsapp",
            status: r.success ? "sent" : "failed",
            error: r.success ? null : r.error ?? null,
          });
          if (r.success) totalSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, total_sent: totalSent, total_skipped: totalSkipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("notify-upcoming-events error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});