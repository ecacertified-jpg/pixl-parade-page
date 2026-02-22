import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_THRESHOLD = 80;
const MIN_VOLUME = 5;
const ANTI_SPAM_HOURS = 2;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 [check-whatsapp-otp-health] Starting OTP health check...');

    // 1. Read threshold from growth_alert_thresholds
    let threshold = DEFAULT_THRESHOLD;
    let periodHours = 1;

    const { data: thresholdData } = await supabase
      .from('growth_alert_thresholds')
      .select('threshold_value, comparison_period, is_active')
      .eq('metric_type', 'whatsapp_otp_success_rate')
      .eq('is_active', true)
      .single();

    if (thresholdData) {
      threshold = thresholdData.threshold_value;
      const periodMatch = thresholdData.comparison_period?.match(/^(\d+)h$/);
      if (periodMatch) {
        periodHours = parseInt(periodMatch[1], 10);
      }
    }

    // 2. Calculate OTP stats over the period
    const periodStart = new Date();
    periodStart.setHours(periodStart.getHours() - periodHours);

    const { data: otpCodes, error: otpError } = await supabase
      .from('whatsapp_otp_codes')
      .select('id, verified_at')
      .gte('created_at', periodStart.toISOString());

    if (otpError) {
      console.error('Error fetching OTP codes:', otpError);
      throw otpError;
    }

    const totalSent = otpCodes?.length || 0;
    const totalVerified = otpCodes?.filter(c => c.verified_at !== null).length || 0;
    const successRate = totalSent > 0 ? Math.round((totalVerified / totalSent) * 100 * 100) / 100 : 100;

    const report = {
      timestamp: new Date().toISOString(),
      period_hours: periodHours,
      total_sent: totalSent,
      total_verified: totalVerified,
      success_rate: successRate,
      threshold,
      status: 'ok' as string,
      alert_created: false,
    };

    console.log('📊 [check-whatsapp-otp-health] Stats:', JSON.stringify(report));

    // 3. Check minimum volume
    if (totalSent < MIN_VOLUME) {
      report.status = 'insufficient_volume';
      console.log(`ℹ️ Volume insuffisant (${totalSent}/${MIN_VOLUME}). Pas d'alerte.`);
      return new Response(JSON.stringify({ success: true, ...report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Check if rate is below threshold
    if (successRate >= threshold) {
      report.status = 'healthy';
      console.log(`✅ Taux de succès OK: ${successRate}% >= ${threshold}%`);
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
      .eq('type', 'otp_success_rate_drop')
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
        type: 'otp_success_rate_drop',
        title: 'Alerte OTP WhatsApp : taux de succès bas',
        message: `Le taux de succès OTP est de ${successRate}% (seuil: ${threshold}%) sur la dernière heure. ${totalSent} OTP envoyés, ${totalVerified} vérifiés.`,
        severity: 'critical',
        action_url: '/admin/whatsapp-otp',
        metadata: {
          success_rate: successRate,
          threshold,
          total_sent: totalSent,
          total_verified: totalVerified,
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
    console.log(`🚨 [check-whatsapp-otp-health] ALERTE CRÉÉE: taux ${successRate}% < seuil ${threshold}%`);

    return new Response(JSON.stringify({ success: true, ...report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ [check-whatsapp-otp-health] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
