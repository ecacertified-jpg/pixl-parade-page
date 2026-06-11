import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAdminClient, sendPushToUsers } from "../_shared/push-sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = getAdminClient();
    const today = new Date();
    const targets = [
      { date: ymd(addDays(today, 7)), label: "dans 7 jours", emoji: "💍" },
      { date: ymd(addDays(today, 1)), label: "demain",       emoji: "💒" },
      { date: ymd(today),             label: "aujourd'hui",  emoji: "🎉" },
    ];

    let totalSent = 0;
    for (const t of targets) {
      const { data: weddings } = await admin
        .from("event_pages")
        .select("id, slug, title, creator_id, spouse_user_id, event_date, occasion")
        .eq("occasion", "wedding")
        .eq("event_date", t.date)
        .eq("is_active", true);

      for (const w of weddings ?? []) {
        const recipients = new Set<string>();
        if (w.creator_id) recipients.add(w.creator_id);
        if (w.spouse_user_id) recipients.add(w.spouse_user_id);

        const { data: orgs } = await admin
          .from("event_organizers")
          .select("user_id")
          .eq("page_id", w.id)
          .not("user_id", "is", null);
        for (const o of orgs ?? []) if (o.user_id) recipients.add(o.user_id as string);

        const { data: guests } = await admin
          .from("event_guests")
          .select("contact_id")
          .eq("page_id", w.id)
          .not("contact_id", "is", null);
        const contactIds = (guests ?? []).map((g: any) => g.contact_id).filter(Boolean);
        if (contactIds.length > 0) {
          const { data: contacts } = await admin
            .from("contacts")
            .select("linked_user_id")
            .in("id", contactIds);
          for (const c of contacts ?? []) {
            if ((c as any).linked_user_id) recipients.add((c as any).linked_user_id);
          }
        }

        if (recipients.size === 0) continue;

        const r = await sendPushToUsers({
          user_ids: Array.from(recipients),
          title: `${t.emoji} Mariage ${t.label} !`,
          message: `${w.title || "Un mariage"} se célèbre ${t.label}. Prépare ton plus beau message et ton cadeau 💝`,
          url: `/event/${w.slug}`,
          category: "birthday",
          type: "wedding_reminder",
          preference_key: "push_wedding_reminder",
          data: { event_id: w.id, event_date: w.event_date },
        });
        totalSent += r.sent;
      }
    }

    return new Response(JSON.stringify({ ok: true, total_sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-upcoming-weddings error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});