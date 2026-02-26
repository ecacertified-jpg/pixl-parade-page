import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_THRESHOLD = 10;
const MIN_VOLUME = 10;
const ANTI_SPAM_HOURS = 6;
const DEFAULT_PERIOD_HOURS = 24;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 [check-whatsapp-delivery-health] Starting delivery health check...');

    // 1. Read threshold from growth_alert_thresholds
    let threshold = DEFAULT_THRESHOLD;
    let periodHours = DEFAULT_PERIOD_HOURS;

    const { data: thresholdData } = await supabase
      .from('growth_alert_thresholds')
      .select('threshold_value, comparison_period, is_active')
      .eq('metric_type', 'whatsapp_delivery_failure_rate')
      .eq('is_active', true)
      .single();

    if (thresholdData) {
      threshold = thresholdData.threshold_value;
      const periodMatch = thresholdData.comparison_period?.match(/^(\d+)h$/);
      if (periodMatch) {
        periodHours = parseInt(periodMatch[1], 10);
      }
    }

    // 2. Calculate delivery stats over the period
    const periodStart = new Date();
    periodStart.setHours(periodStart.getHours() - periodHours);

    const { data: alerts, error: alertsError } = await supabase
      .from('birthday_contact_alerts')
      .select('id, status')
      .eq('channel', 'whatsapp')
      .gte('created_at', periodStart.toISOString());

    if (alertsError) {
      console.error('Error fetching delivery alerts:', alertsError);
      throw alertsError;
    }

    const totalSent = alerts?.length || 0;
    const totalFailed = alerts?.filter(a => a.status === 'failed').length || 0;
    const failureRate = totalSent > 0 ? Math.round((totalFailed / totalSent) * 100 * 100) / 100 : 0;

    const report = {
      timestamp: new Date().toISOString(),
      period_hours: periodHours,
      total_sent: totalSent,
      total_failed: totalFailed,
      failure_rate: failureRate,
      threshold,
      status: 'ok' as string,
      alert_created: false,
      email_sent: false,
    };

    console.log('📊 [check-whatsapp-delivery-health] Stats:', JSON.stringify(report));

    // 3. Check minimum volume
    if (totalSent < MIN_VOLUME) {
      report.status = 'insufficient_volume';
      console.log(`ℹ️ Volume insuffisant (${totalSent}/${MIN_VOLUME}). Pas d'alerte.`);
      return new Response(JSON.stringify({ success: true, ...report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Check if failure rate is below threshold (healthy)
    if (failureRate <= threshold) {
      report.status = 'healthy';
      console.log(`✅ Taux d'échec OK: ${failureRate}% <= ${threshold}%`);
      return new Response(JSON.stringify({ success: true, ...report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Anti-spam: check for recent alert
    const antiSpamThreshold = new Date();
    antiSpamThreshold.setHours(antiSpamThreshold.getHours() - ANTI_SPAM_HOURS);

    const { data: recentAlerts } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('type', 'whatsapp_delivery_failure_rate')
      .gte('created_at', antiSpamThreshold.toISOString())
      .limit(1);

    if (recentAlerts && recentAlerts.length > 0) {
      report.status = 'alert_suppressed_antispam';
      console.log('⏳ Alerte supprimée (anti-spam): alerte récente existe déjà.');
      return new Response(JSON.stringify({ success: true, ...report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Create admin notification
    const { error: notifError } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'whatsapp_delivery_failure_rate',
        title: 'Alerte WhatsApp : taux d\'échec élevé',
        message: `Le taux d'échec WhatsApp est de ${failureRate}% (seuil: ${threshold}%) sur les ${periodHours} dernières heures. ${totalSent} messages envoyés, ${totalFailed} échoués.`,
        severity: 'critical',
        action_url: '/admin/messaging-delivery',
        metadata: {
          failure_rate: failureRate,
          threshold,
          total_sent: totalSent,
          total_failed: totalFailed,
          period_hours: periodHours,
          checked_at: new Date().toISOString(),
        },
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
      throw notifError;
    }

    report.status = 'alert_created';
    report.alert_created = true;
    console.log(`🚨 [check-whatsapp-delivery-health] ALERTE CRÉÉE: taux ${failureRate}% > seuil ${threshold}%`);

    // 7. Send email alert to admins
    if (resendApiKey) {
      try {
        const { data: adminUsers, error: adminError } = await supabase
          .from('admin_users')
          .select(`
            user_id,
            role,
            admin_report_preferences (
              is_active,
              include_alerts,
              email_override
            )
          `)
          .eq('is_active', true)
          .in('role', ['super_admin', 'admin']);

        if (adminError) {
          console.error('Error fetching admin users for email:', adminError);
        } else {
          const adminEmails: string[] = [];

          for (const admin of (adminUsers || [])) {
            const prefs = admin.admin_report_preferences;
            if (prefs && !prefs.is_active) continue;
            if (prefs && !prefs.include_alerts) continue;

            if (prefs?.email_override) {
              adminEmails.push(prefs.email_override);
            } else {
              const { data: authUser } = await supabase.auth.admin.getUserById(admin.user_id);
              if (authUser?.user?.email) {
                adminEmails.push(authUser.user.email);
              }
            }
          }

          if (adminEmails.length > 0) {
            console.log(`📧 Sending delivery alert email to ${adminEmails.length} admin(s)...`);

            const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app');
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px;">🚨 Alerte Livraison WhatsApp</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Taux d'échec critique détecté</p>
                  </div>
                  <div style="padding: 24px;">
                    <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0;">
                      Le taux d'échec de livraison WhatsApp a dépassé le seuil critique. Voici les détails :
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Taux d'échec</td>
                        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #dc2626; font-size: 16px;">${failureRate}%</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Seuil configuré</td>
                        <td style="padding: 10px 12px; text-align: right; font-size: 14px;">${threshold}%</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Messages envoyés</td>
                        <td style="padding: 10px 12px; text-align: right; font-size: 14px;">${totalSent}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e5e7eb;">
                        <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Messages échoués</td>
                        <td style="padding: 10px 12px; text-align: right; font-size: 14px;">${totalFailed}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: 600; color: #6b7280; font-size: 13px;">Période</td>
                        <td style="padding: 10px 12px; text-align: right; font-size: 14px;">${periodHours}h</td>
                      </tr>
                    </table>
                    <div style="text-align: center;">
                      <a href="${appUrl}/admin/messaging-delivery" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        Voir le dashboard livraison
                      </a>
                    </div>
                  </div>
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      JOIE DE VIVRE — Alerte automatique. Gérez vos préférences dans les paramètres admin.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `;

            const resend = new Resend(resendApiKey);
            const emailResponse = await resend.emails.send({
              from: 'JOIE DE VIVRE <noreply@joiedevivre-africa.com>',
              to: adminEmails,
              subject: `🚨 [CRITIQUE] Alerte WhatsApp - Taux d'échec à ${failureRate}%`,
              html: htmlContent,
            });

            report.email_sent = true;
            console.log('✅ Email delivery alert sent:', emailResponse);
          } else {
            console.log('⚠️ No admin emails found for delivery alert');
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending delivery alert email (non-blocking):', emailError);
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured, skipping email alert');
    }

    return new Response(JSON.stringify({ success: true, ...report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [check-whatsapp-delivery-health] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
