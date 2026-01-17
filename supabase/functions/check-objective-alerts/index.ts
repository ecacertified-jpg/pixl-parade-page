import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CountryMetrics {
  countryCode: string;
  users: number;
  businesses: number;
  revenue: number;
  orders: number;
}

interface Objective {
  id: string;
  country_code: string;
  year: number;
  month: number;
  metric_type: string;
  target_value: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BJ: "Bénin",
  ML: "Mali",
  BF: "Burkina Faso",
  TG: "Togo",
};

const METRIC_LABELS: Record<string, string> = {
  users: "Utilisateurs",
  businesses: "Entreprises",
  revenue: "Revenus",
  orders: "Commandes",
};

const THRESHOLDS = {
  critical: 50,  // < 50% = critique
  warning: 70,   // < 70% = avertissement
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`Checking objectives for ${currentMonth}/${currentYear}`);

    // 1. Fetch all objectives for current month
    const { data: objectives, error: objError } = await supabase
      .from('monthly_objectives')
      .select('*')
      .eq('year', currentYear)
      .eq('month', currentMonth);

    if (objError) {
      console.error('Error fetching objectives:', objError);
      throw objError;
    }

    if (!objectives || objectives.length === 0) {
      console.log('No objectives defined for current month');
      return new Response(
        JSON.stringify({ message: 'No objectives to check', alerts_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Calculate actual metrics per country
    const countryMetrics: Record<string, CountryMetrics> = {};
    const countryCodes = [...new Set(objectives.map((o: Objective) => o.country_code))];

    for (const countryCode of countryCodes) {
      // Get users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('country_code', countryCode);

      // Get businesses count
      const { count: businessesCount } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('country_code', countryCode)
        .eq('status', 'active');

      // Get orders and revenue for current month
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: ordersData } = await supabase
        .from('business_orders')
        .select('total_amount, business_account_id')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .in('status', ['completed', 'delivered', 'confirmed']);

      // Filter orders by country (via business)
      let ordersCount = 0;
      let revenue = 0;

      if (ordersData && ordersData.length > 0) {
        const businessIds = ordersData.map(o => o.business_account_id);
        const { data: businesses } = await supabase
          .from('business_accounts')
          .select('id, country_code')
          .in('id', businessIds)
          .eq('country_code', countryCode);

        const countryBusinessIds = new Set(businesses?.map(b => b.id) || []);
        
        for (const order of ordersData) {
          if (countryBusinessIds.has(order.business_account_id)) {
            ordersCount++;
            revenue += order.total_amount || 0;
          }
        }
      }

      countryMetrics[countryCode] = {
        countryCode,
        users: usersCount || 0,
        businesses: businessesCount || 0,
        revenue,
        orders: ordersCount,
      };
    }

    // 3. Check each objective and create alerts if needed
    const alertsCreated: string[] = [];
    const criticalAlerts: any[] = [];

    for (const objective of objectives as Objective[]) {
      const metrics = countryMetrics[objective.country_code];
      if (!metrics) continue;

      const actualValue = metrics[objective.metric_type as keyof CountryMetrics] as number || 0;
      const targetValue = objective.target_value;

      if (targetValue <= 0) continue;

      const achievementRate = (actualValue / targetValue) * 100;

      // Check if alert already exists for this objective
      const { data: existingAlert } = await supabase
        .from('country_objective_alerts')
        .select('id')
        .eq('country_code', objective.country_code)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('metric_type', objective.metric_type)
        .single();

      let severity: 'critical' | 'warning' | null = null;
      let message = '';

      if (achievementRate < THRESHOLDS.critical) {
        severity = 'critical';
        const countryName = COUNTRY_NAMES[objective.country_code] || objective.country_code;
        const metricLabel = METRIC_LABELS[objective.metric_type] || objective.metric_type;
        message = `⚠️ Objectif critique non atteint : ${countryName} - ${metricLabel} à ${achievementRate.toFixed(1)}% (${actualValue}/${targetValue})`;
      } else if (achievementRate < THRESHOLDS.warning) {
        severity = 'warning';
        const countryName = COUNTRY_NAMES[objective.country_code] || objective.country_code;
        const metricLabel = METRIC_LABELS[objective.metric_type] || objective.metric_type;
        message = `⚠️ Objectif en retard : ${countryName} - ${metricLabel} à ${achievementRate.toFixed(1)}% (${actualValue}/${targetValue})`;
      }

      if (severity) {
        if (existingAlert) {
          // Update existing alert
          await supabase
            .from('country_objective_alerts')
            .update({
              actual_value: actualValue,
              achievement_rate: achievementRate,
              severity,
              message,
              triggered_at: new Date().toISOString(),
            })
            .eq('id', existingAlert.id);
        } else {
          // Create new alert
          const { error: insertError } = await supabase
            .from('country_objective_alerts')
            .insert({
              country_code: objective.country_code,
              year: currentYear,
              month: currentMonth,
              metric_type: objective.metric_type,
              target_value: targetValue,
              actual_value: actualValue,
              achievement_rate: achievementRate,
              alert_type: severity === 'critical' ? 'objective_critical' : 'objective_not_met',
              severity,
              message,
              metadata: {
                objective_id: objective.id,
                country_name: COUNTRY_NAMES[objective.country_code],
                metric_label: METRIC_LABELS[objective.metric_type],
              },
            });

          if (!insertError) {
            alertsCreated.push(`${objective.country_code}-${objective.metric_type}`);
            
            if (severity === 'critical') {
              criticalAlerts.push({
                country_code: objective.country_code,
                country_name: COUNTRY_NAMES[objective.country_code],
                metric_type: objective.metric_type,
                metric_label: METRIC_LABELS[objective.metric_type],
                achievement_rate: achievementRate,
                actual_value: actualValue,
                target_value: targetValue,
              });
            }
          }
        }
      } else if (existingAlert) {
        // Achievement is now >= 70%, delete the alert
        await supabase
          .from('country_objective_alerts')
          .delete()
          .eq('id', existingAlert.id);
      }
    }

    // 4. Send notifications for critical alerts
    if (criticalAlerts.length > 0) {
      try {
        await supabase.functions.invoke('admin-notify-critical', {
          body: {
            type: 'objective_critical',
            title: `${criticalAlerts.length} objectif(s) critique(s) non atteint(s)`,
            message: criticalAlerts.map(a => 
              `${a.country_name}: ${a.metric_label} à ${a.achievement_rate.toFixed(1)}%`
            ).join('\n'),
            adminName: 'Système',
            entityId: 'objectives',
            entityType: 'objective',
            actionUrl: '/admin/countries/comparison',
            metadata: { alerts: criticalAlerts },
          },
        });
      } catch (notifyError) {
        console.error('Error sending critical notifications:', notifyError);
      }
    }

    // 5. Check for struggling countries (state changes)
    try {
      await supabase.functions.invoke('notify-struggling-countries', {
        body: { year: currentYear, month: currentMonth },
      });
    } catch (strugglingError) {
      console.error('Error checking struggling countries:', strugglingError);
    }

    console.log(`Created ${alertsCreated.length} alerts, ${criticalAlerts.length} critical`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alertsCreated.length,
        critical_count: criticalAlerts.length,
        details: alertsCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-objective-alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});