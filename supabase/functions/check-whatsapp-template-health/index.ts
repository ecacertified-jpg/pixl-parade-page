import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KNOWN_TEMPLATES = [
  "joiedevivre_otp",
  "joiedevivre_contact_added",
  "joiedevivre_birthday_reminder",
  "joiedevivre_birthday_friend_alert",
  "joiedevivre_birthday_create_fund_nudge",
  "joiedevivre_birthday_celebration",
  "joiedevivre_refund_alert",
  "joiedevivre_contribution_reminder",
  "joiedevivre_gift_order",
  "joiedevivre_group_contribution",
  "joiedevivre_fund_beneficiary_invite",
  "joiedevivre_contribution_update",
  "joiedevivre_fund_ready",
  "joiedevivre_fund_completed",
  "joiedevivre_new_order",
  "joiedevivre_order_confirmed",
  "joiedevivre_order_rejected",
  "joiedevivre_join_reminder",
  "joiedevivre_delivery_reminder",
  "joiedevivre_welcome_add_friends",
  "joiedevivre_friends_circle_reminder",
];

const MIN_SENDS = 5;
const ANTI_SPAM_HOURS = 6;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get logs from last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: logs, error: logsError } = await supabaseAdmin
      .from("whatsapp_template_logs")
      .select("template_name, status")
      .gte("created_at", since);

    if (logsError) throw logsError;

    // 2. Aggregate stats per template
    const statsMap = new Map<string, { total: number; sent: number; failed: number }>();
    for (const row of logs || []) {
      const s = statsMap.get(row.template_name) || { total: 0, sent: 0, failed: 0 };
      s.total++;
      if (row.status === "sent") s.sent++;
      else s.failed++;
      statsMap.set(row.template_name, s);
    }

    // 3. Identify problematic templates
    type HealthIssue = {
      name: string;
      status: "failing" | "degraded";
      successRate: number;
      total: number;
      sent: number;
      failed: number;
    };

    const issues: HealthIssue[] = [];

    for (const name of KNOWN_TEMPLATES) {
      const stats = statsMap.get(name);
      if (!stats || stats.total < MIN_SENDS) continue;

      const successRate = Math.round((stats.sent / stats.total) * 100);

      if (stats.failed === stats.total) {
        issues.push({ name, status: "failing", successRate, ...stats });
      } else if (successRate < 80) {
        issues.push({ name, status: "degraded", successRate, ...stats });
      }
    }

    if (issues.length === 0) {
      console.log("All WhatsApp templates are healthy");
      return new Response(JSON.stringify({ status: "healthy", checked: KNOWN_TEMPLATES.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Anti-spam check: skip templates already alerted in last 6h
    const antiSpamSince = new Date(Date.now() - ANTI_SPAM_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentAlerts } = await supabaseAdmin
      .from("admin_notifications")
      .select("entity_id")
      .eq("type", "whatsapp_template_health")
      .gte("created_at", antiSpamSince);

    const recentlyAlerted = new Set((recentAlerts || []).map((a: any) => a.entity_id));
    const newIssues = issues.filter((i) => !recentlyAlerted.has(i.name));

    if (newIssues.length === 0) {
      console.log("Issues found but already alerted recently:", issues.map((i) => i.name));
      return new Response(JSON.stringify({ status: "already_alerted", issues: issues.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Create admin notifications
    const notifications = newIssues.map((issue) => ({
      type: "whatsapp_template_health",
      title: `Template WhatsApp ${issue.status === "failing" ? "en échec" : "dégradé"}: ${issue.name}`,
      message: `Taux de succès: ${issue.successRate}% (${issue.sent}/${issue.total} envois réussis sur 24h)`,
      severity: issue.status === "failing" ? "critical" : "warning",
      entity_type: "whatsapp_template",
      entity_id: issue.name,
      action_url: "/admin/whatsapp-templates",
      metadata: {
        success_rate: issue.successRate,
        total: issue.total,
        sent: issue.sent,
        failed: issue.failed,
        checked_at: new Date().toISOString(),
      },
    }));

    const { error: insertError } = await supabaseAdmin
      .from("admin_notifications")
      .insert(notifications);

    if (insertError) throw insertError;

    console.log(`Created ${notifications.length} template health alerts:`, newIssues.map((i) => `${i.name} (${i.status})`));

    // 6. Send grouped email to admins via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      // Get admin emails
      const { data: admins } = await supabaseAdmin
        .from("admin_users")
        .select("user_id")
        .eq("is_active", true);

      if (admins && admins.length > 0) {
        const adminIds = admins.map((a: any) => a.user_id);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", adminIds);

        // Get emails from auth.users via admin API
        const adminEmails: string[] = [];
        for (const adminId of adminIds) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(adminId);
          if (userData?.user?.email) {
            adminEmails.push(userData.user.email);
          }
        }

        if (adminEmails.length > 0) {
          const failingList = newIssues
            .map((i) => `• <strong>${i.name}</strong> — ${i.status === "failing" ? "🔴 En échec" : "🟡 Dégradé"} (${i.successRate}% succès, ${i.total} envois)`)
            .join("<br>");

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Joie de Vivre <alerts@joiedevivre-africa.com>",
              to: adminEmails,
              subject: `⚠️ ${newIssues.length} template(s) WhatsApp en alerte`,
              html: `
                <h2>Rapport santé des templates WhatsApp</h2>
                <p>${newIssues.length} template(s) nécessitent votre attention :</p>
                <p>${failingList}</p>
                <br>
                <p><a href="https://joiedevivre-africa.com/admin/whatsapp-templates">Voir le dashboard →</a></p>
                <p style="color: #999; font-size: 12px;">Vérification automatique toutes les 6 heures</p>
              `,
            }),
          });
          console.log(`Alert email sent to ${adminEmails.length} admin(s)`);
        }
      }
    }

    return new Response(
      JSON.stringify({ status: "alerts_created", count: newIssues.length, templates: newIssues.map((i) => i.name) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking template health:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
