import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPIAlert {
  alert_type: string;
  metric_type: string;
  message: string;
  current_value: number;
  previous_value?: number;
  growth_percentage?: number;
  metadata?: {
    is_critical?: boolean;
    threshold_value?: number;
    comparison_period?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { alerts } = await req.json() as { alerts: KPIAlert[] };

    if (!alerts || alerts.length === 0) {
      console.log('ℹ️ [notify-kpi-alerts] No alerts to notify');
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔔 [notify-kpi-alerts] Processing ${alerts.length} alert(s)...`);

    // Get admin users with notification preferences
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
      .eq('is_active', true);

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      throw adminError;
    }

    // Get admin emails
    const adminEmails: string[] = [];
    
    for (const admin of (adminUsers || [])) {
      const prefs = admin.admin_report_preferences;
      
      // Check if admin wants alerts
      if (prefs && !prefs.is_active) continue;
      if (prefs && !prefs.include_alerts) continue;

      // Get email override or fetch from auth
      if (prefs?.email_override) {
        adminEmails.push(prefs.email_override);
      } else {
        const { data: authUser } = await supabase.auth.admin.getUserById(admin.user_id);
        if (authUser?.user?.email) {
          adminEmails.push(authUser.user.email);
        }
      }
    }

    console.log(`📧 Found ${adminEmails.length} admin(s) to notify`);

    if (adminEmails.length === 0 || !resendApiKey) {
      console.log('⚠️ No admins to notify or RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: true, notified: 0, reason: 'No recipients or missing API key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build email content
    const alertTypeLabels: Record<string, string> = {
      milestone: '🎉 Milestone',
      growth_spike: '🚀 Croissance',
      daily_record: '📈 Record',
      decline: '⚠️ Baisse',
    };

    const metricLabels: Record<string, string> = {
      users: 'Utilisateurs',
      businesses: 'Entreprises',
      revenue: 'Revenus',
      orders: 'Commandes',
      contributions: 'Contributions',
    };

    const criticalAlerts = alerts.filter(a => a.metadata?.is_critical);
    const isCritical = criticalAlerts.length > 0;

    const alertRows = alerts.map(alert => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; font-weight: 600; color: ${alert.alert_type === 'decline' ? '#dc2626' : '#7A5DC7'};">
          ${alertTypeLabels[alert.alert_type] || alert.alert_type}
        </td>
        <td style="padding: 12px;">
          ${metricLabels[alert.metric_type] || alert.metric_type}
        </td>
        <td style="padding: 12px;">
          ${alert.message}
        </td>
        <td style="padding: 12px; text-align: right;">
          ${alert.current_value?.toLocaleString('fr-FR') || '-'}
        </td>
        <td style="padding: 12px; text-align: right; color: ${(alert.growth_percentage || 0) >= 0 ? '#16a34a' : '#dc2626'};">
          ${alert.growth_percentage ? `${alert.growth_percentage >= 0 ? '+' : ''}${alert.growth_percentage}%` : '-'}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
        <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <div style="background: ${isCritical ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'linear-gradient(135deg, #7A5DC7, #9b87d8)'}; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">
              ${isCritical ? '⚠️ Alertes KPI Critiques' : '📊 Alertes KPI'}
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">
              JOIE DE VIVRE - ${alerts.length} nouvelle(s) alerte(s)
            </p>
          </div>

          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Type</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Métrique</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Message</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280;">Valeur</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280;">Variation</th>
                </tr>
              </thead>
              <tbody>
                ${alertRows}
              </tbody>
            </table>

            <div style="margin-top: 24px; text-align: center;">
              <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/admin/alerts" 
                 style="display: inline-block; background: #7A5DC7; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Voir toutes les alertes
              </a>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Cet email a été envoyé automatiquement par JOIE DE VIVRE.
              <br>Vous pouvez gérer vos préférences de notification dans les paramètres admin.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend
    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: 'JOIE DE VIVRE <onboarding@resend.dev>',
      to: adminEmails,
      subject: isCritical 
        ? `⚠️ [CRITIQUE] ${alerts.length} alerte(s) KPI - JOIE DE VIVRE`
        : `📊 ${alerts.length} alerte(s) KPI - JOIE DE VIVRE`,
      html: htmlContent,
    });

    console.log('✅ Email sent successfully:', emailResponse);

    // Create in-app notifications for admins
    const notificationInserts = (adminUsers || []).map(admin => ({
      user_id: admin.user_id,
      title: isCritical ? '⚠️ Alertes KPI critiques' : '📊 Nouvelles alertes KPI',
      message: `${alerts.length} nouvelle(s) alerte(s) détectée(s)`,
      type: 'admin_alert',
      action_url: '/admin/alerts',
      metadata: {
        alert_count: alerts.length,
        is_critical: isCritical,
        alert_types: [...new Set(alerts.map(a => a.alert_type))],
      },
    }));

    if (notificationInserts.length > 0) {
      await supabase.from('notifications').insert(notificationInserts);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: adminEmails.length,
        emailResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ [notify-kpi-alerts] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
