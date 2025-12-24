import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationResult {
  alertId: string;
  type: 'growth' | 'business';
  previousSeverity: string;
  newSeverity: string;
  escalationCount: number;
}

const ESCALATION_HOURS = 24;
const SEVERITY_LEVELS = ['info', 'warning', 'critical'];

function getNextSeverity(current: string): string {
  const currentIndex = SEVERITY_LEVELS.indexOf(current);
  if (currentIndex === -1) return 'warning';
  return SEVERITY_LEVELS[Math.min(currentIndex + 1, SEVERITY_LEVELS.length - 1)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 [escalate-unhandled-alerts] Starting escalation check...');

    const escalationThreshold = new Date();
    escalationThreshold.setHours(escalationThreshold.getHours() - ESCALATION_HOURS);

    const escalatedAlerts: EscalationResult[] = [];
    const alertsToNotify: any[] = [];

    // Escalate growth alerts
    const { data: growthAlerts, error: growthError } = await supabase
      .from('admin_growth_alerts')
      .select('*')
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .lt('triggered_at', escalationThreshold.toISOString())
      .or(`last_escalated_at.is.null,last_escalated_at.lt.${escalationThreshold.toISOString()}`);

    if (growthError) {
      console.error('Error fetching growth alerts:', growthError);
    } else {
      console.log(`📊 Found ${growthAlerts?.length || 0} growth alerts to escalate`);

      for (const alert of growthAlerts || []) {
        const currentSeverity = alert.severity || 'info';
        const newSeverity = getNextSeverity(currentSeverity);
        const escalationCount = (alert.escalation_count || 0) + 1;

        // Build escalation history
        const metadata = alert.metadata || {};
        const escalationHistory = metadata.escalation_history || [];
        escalationHistory.push({
          from: currentSeverity,
          to: newSeverity,
          at: new Date().toISOString(),
          reason: `Non traitée depuis ${ESCALATION_HOURS}h`,
        });

        const { error: updateError } = await supabase
          .from('admin_growth_alerts')
          .update({
            severity: newSeverity,
            original_severity: alert.original_severity || currentSeverity,
            escalation_count: escalationCount,
            last_escalated_at: new Date().toISOString(),
            metadata: {
              ...metadata,
              escalation_history: escalationHistory,
            },
          })
          .eq('id', alert.id);

        if (updateError) {
          console.error(`Error updating growth alert ${alert.id}:`, updateError);
        } else {
          escalatedAlerts.push({
            alertId: alert.id,
            type: 'growth',
            previousSeverity: currentSeverity,
            newSeverity,
            escalationCount,
          });

          alertsToNotify.push({
            ...alert,
            severity: newSeverity,
            escalation_count: escalationCount,
            type: 'growth',
          });
        }
      }
    }

    // Escalate business performance alerts
    const { data: businessAlerts, error: businessError } = await supabase
      .from('business_performance_alerts')
      .select('*, business_accounts(business_name, email)')
      .eq('is_read', false)
      .eq('is_dismissed', false)
      .eq('is_resolved', false)
      .lt('created_at', escalationThreshold.toISOString())
      .or(`last_escalated_at.is.null,last_escalated_at.lt.${escalationThreshold.toISOString()}`);

    if (businessError) {
      console.error('Error fetching business alerts:', businessError);
    } else {
      console.log(`📊 Found ${businessAlerts?.length || 0} business alerts to escalate`);

      for (const alert of businessAlerts || []) {
        const currentSeverity = alert.severity || 'warning';
        const newSeverity = getNextSeverity(currentSeverity);
        const escalationCount = (alert.escalation_count || 0) + 1;

        // Build escalation history
        const metadata = alert.metadata || {};
        const escalationHistory = metadata.escalation_history || [];
        escalationHistory.push({
          from: currentSeverity,
          to: newSeverity,
          at: new Date().toISOString(),
          reason: `Non traitée depuis ${ESCALATION_HOURS}h`,
        });

        const { error: updateError } = await supabase
          .from('business_performance_alerts')
          .update({
            severity: newSeverity,
            original_severity: alert.original_severity || currentSeverity,
            escalation_count: escalationCount,
            last_escalated_at: new Date().toISOString(),
            metadata: {
              ...metadata,
              escalation_history: escalationHistory,
            },
          })
          .eq('id', alert.id);

        if (updateError) {
          console.error(`Error updating business alert ${alert.id}:`, updateError);
        } else {
          escalatedAlerts.push({
            alertId: alert.id,
            type: 'business',
            previousSeverity: currentSeverity,
            newSeverity,
            escalationCount,
          });

          alertsToNotify.push({
            ...alert,
            severity: newSeverity,
            escalation_count: escalationCount,
            type: 'business',
            business_name: (alert as any).business_accounts?.business_name,
          });
        }
      }
    }

    // Send notifications for escalated alerts
    if (alertsToNotify.length > 0) {
      console.log(`📧 Sending escalation notifications for ${alertsToNotify.length} alerts...`);

      // Get active admins
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('is_active', true);

      // Create in-app notifications for each admin
      const notifications = [];
      for (const admin of admins || []) {
        notifications.push({
          user_id: admin.user_id,
          title: `⏰ ${alertsToNotify.length} alerte(s) escaladée(s)`,
          message: `${alertsToNotify.length} alerte(s) non traitée(s) depuis 24h+ ont été escaladées. Sévérité augmentée.`,
          type: 'admin_alert_escalation',
          action_url: '/admin/alerts',
          metadata: {
            escalated_count: alertsToNotify.length,
            critical_count: alertsToNotify.filter(a => a.severity === 'critical').length,
            alerts: alertsToNotify.map(a => ({
              id: a.id,
              type: a.type,
              message: a.message,
              severity: a.severity,
              escalation_count: a.escalation_count,
            })),
          },
        });
      }

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating notifications:', notifError);
        }
      }

      // Send email for critical escalations
      const criticalAlerts = alertsToNotify.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.log(`🚨 ${criticalAlerts.length} critical escalation(s) - triggering email notification...`);

        try {
          await supabase.functions.invoke('notify-kpi-alerts', {
            body: { 
              alerts: criticalAlerts,
              isEscalation: true,
              escalationMessage: `⏰ RAPPEL URGENT : ${criticalAlerts.length} alerte(s) critique(s) non traitée(s) depuis 24h+`,
            },
          });
        } catch (emailError) {
          console.error('Error sending escalation email:', emailError);
        }
      }
    }

    console.log(`✅ Escalation complete. ${escalatedAlerts.length} alert(s) escalated.`);

    return new Response(
      JSON.stringify({
        success: true,
        escalatedCount: escalatedAlerts.length,
        escalatedAlerts,
        summary: {
          growth: escalatedAlerts.filter(a => a.type === 'growth').length,
          business: escalatedAlerts.filter(a => a.type === 'business').length,
          nowCritical: escalatedAlerts.filter(a => a.newSeverity === 'critical').length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ [escalate-unhandled-alerts] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
