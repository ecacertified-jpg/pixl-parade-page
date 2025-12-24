import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Threshold {
  id: string;
  metric_type: string;
  threshold_type: string;
  threshold_value: number;
  comparison_period: string;
  is_active: boolean;
  notify_methods: string[];
}

interface MetricData {
  current: number;
  previous: number;
  daily: number;
  dailyPrevious: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 [check-growth-alerts] Starting growth alerts check...');

    // Fetch active thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('growth_alert_thresholds')
      .select('*')
      .eq('is_active', true);

    if (thresholdsError) {
      console.error('Error fetching thresholds:', thresholdsError);
      throw thresholdsError;
    }

    console.log(`📊 Found ${thresholds?.length || 0} active thresholds`);

    // Calculate date ranges
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Users metrics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: usersYesterday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', now.toISOString())
      .gte('created_at', yesterday.toISOString());

    const { count: usersTwoDaysAgo } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', yesterday.toISOString())
      .gte('created_at', twoDaysAgo.toISOString());

    const { count: usersLastWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastWeek.toISOString());

    const { count: usersPreviousWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', lastWeek.toISOString())
      .gte('created_at', twoWeeksAgo.toISOString());

    // Businesses metrics
    const { count: totalBusinesses } = await supabase
      .from('business_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: businessesYesterday } = await supabase
      .from('business_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('created_at', now.toISOString())
      .gte('created_at', yesterday.toISOString());

    const { count: businessesLastWeek } = await supabase
      .from('business_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', lastWeek.toISOString());

    const { count: businessesPreviousWeek } = await supabase
      .from('business_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('created_at', lastWeek.toISOString())
      .gte('created_at', twoWeeksAgo.toISOString());

    // Revenue metrics (from orders)
    const { data: ordersToday } = await supabase
      .from('business_orders')
      .select('total_amount')
      .gte('created_at', yesterday.toISOString())
      .eq('status', 'delivered');

    const { data: ordersYesterday } = await supabase
      .from('business_orders')
      .select('total_amount')
      .lt('created_at', yesterday.toISOString())
      .gte('created_at', twoDaysAgo.toISOString())
      .eq('status', 'delivered');

    const { data: ordersLastWeek } = await supabase
      .from('business_orders')
      .select('total_amount')
      .gte('created_at', lastWeek.toISOString())
      .eq('status', 'delivered');

    const { data: ordersPreviousWeek } = await supabase
      .from('business_orders')
      .select('total_amount')
      .lt('created_at', lastWeek.toISOString())
      .gte('created_at', twoWeeksAgo.toISOString())
      .eq('status', 'delivered');

    const { data: ordersLastMonth } = await supabase
      .from('business_orders')
      .select('total_amount')
      .gte('created_at', lastMonth.toISOString())
      .eq('status', 'delivered');

    const { data: ordersPreviousMonth } = await supabase
      .from('business_orders')
      .select('total_amount')
      .lt('created_at', lastMonth.toISOString())
      .gte('created_at', twoMonthsAgo.toISOString())
      .eq('status', 'delivered');

    // Contributions metrics
    const { data: contributionsToday } = await supabase
      .from('fund_contributions')
      .select('amount')
      .gte('created_at', yesterday.toISOString());

    const { data: contributionsYesterday } = await supabase
      .from('fund_contributions')
      .select('amount')
      .lt('created_at', yesterday.toISOString())
      .gte('created_at', twoDaysAgo.toISOString());

    const { data: contributionsLastWeek } = await supabase
      .from('fund_contributions')
      .select('amount')
      .gte('created_at', lastWeek.toISOString());

    const { data: contributionsPreviousWeek } = await supabase
      .from('fund_contributions')
      .select('amount')
      .lt('created_at', lastWeek.toISOString())
      .gte('created_at', twoWeeksAgo.toISOString());

    // Calculate sums
    const sumAmount = (data: any[] | null) => 
      (data || []).reduce((acc, item) => acc + (item.total_amount || item.amount || 0), 0);

    const revenueToday = sumAmount(ordersToday);
    const revenueYesterday = sumAmount(ordersYesterday);
    const revenueLastWeek = sumAmount(ordersLastWeek);
    const revenuePreviousWeek = sumAmount(ordersPreviousWeek);
    const revenueLastMonth = sumAmount(ordersLastMonth);
    const revenuePreviousMonth = sumAmount(ordersPreviousMonth);

    const contributionsTodaySum = sumAmount(contributionsToday);
    const contributionsYesterdaySum = sumAmount(contributionsYesterday);
    const contributionsLastWeekSum = sumAmount(contributionsLastWeek);
    const contributionsPreviousWeekSum = sumAmount(contributionsPreviousWeek);

    const metrics: Record<string, MetricData> = {
      users: {
        current: totalUsers || 0,
        previous: (totalUsers || 0) - (usersLastWeek || 0),
        daily: usersYesterday || 0,
        dailyPrevious: usersTwoDaysAgo || 0,
      },
      businesses: {
        current: totalBusinesses || 0,
        previous: (totalBusinesses || 0) - (businessesLastWeek || 0),
        daily: businessesYesterday || 0,
        dailyPrevious: 0,
      },
      revenue: {
        current: revenueLastMonth,
        previous: revenuePreviousMonth,
        daily: revenueToday,
        dailyPrevious: revenueYesterday,
      },
      orders: {
        current: ordersLastWeek?.length || 0,
        previous: ordersPreviousWeek?.length || 0,
        daily: ordersToday?.length || 0,
        dailyPrevious: ordersYesterday?.length || 0,
      },
      contributions: {
        current: contributionsLastWeekSum,
        previous: contributionsPreviousWeekSum,
        daily: contributionsTodaySum,
        dailyPrevious: contributionsYesterdaySum,
      },
    };

    console.log('📈 Metrics calculated:', JSON.stringify(metrics));

    // Check thresholds and create alerts
    const alertsToCreate: any[] = [];

    for (const threshold of (thresholds || []) as Threshold[]) {
      const metric = metrics[threshold.metric_type];
      if (!metric) continue;

      let shouldAlert = false;
      let alertType = '';
      let message = '';
      let growthPercentage = null;
      let previousValue = null;

      const metricLabels: Record<string, { singular: string; plural: string; unit?: string }> = {
        users: { singular: 'utilisateur', plural: 'utilisateurs' },
        businesses: { singular: 'entreprise', plural: 'entreprises' },
        revenue: { singular: 'revenu', plural: 'revenus', unit: ' XOF' },
        orders: { singular: 'commande', plural: 'commandes' },
        contributions: { singular: 'contribution', plural: 'contributions', unit: ' XOF' },
      };

      const label = metricLabels[threshold.metric_type] || { singular: threshold.metric_type, plural: threshold.metric_type };

      switch (threshold.threshold_type) {
        case 'absolute':
          // Check if we've crossed this milestone
          if (metric.current >= threshold.threshold_value) {
            const { data: existingAlert } = await supabase
              .from('admin_growth_alerts')
              .select('id')
              .eq('threshold_id', threshold.id)
              .eq('alert_type', 'milestone')
              .single();

            if (!existingAlert) {
              shouldAlert = true;
              alertType = 'milestone';
              message = `🎉 Milestone atteint : ${threshold.threshold_value.toLocaleString('fr-FR')}${label.unit || ''} ${label.plural} !`;
            }
          }
          break;

        case 'daily_count':
          if (metric.daily >= threshold.threshold_value) {
            shouldAlert = true;
            alertType = 'daily_record';
            previousValue = metric.dailyPrevious;
            message = `📈 Record quotidien : ${metric.daily.toLocaleString('fr-FR')}${label.unit || ''} ${label.plural} hier !`;
          }
          break;

        case 'percentage':
          let currentPeriod = 0;
          let previousPeriod = 0;

          if (threshold.comparison_period === 'week') {
            if (threshold.metric_type === 'users') {
              currentPeriod = usersLastWeek || 0;
              previousPeriod = usersPreviousWeek || 0;
            } else if (threshold.metric_type === 'businesses') {
              currentPeriod = businessesLastWeek || 0;
              previousPeriod = businessesPreviousWeek || 0;
            } else if (threshold.metric_type === 'revenue') {
              currentPeriod = revenueLastWeek;
              previousPeriod = revenuePreviousWeek;
            } else if (threshold.metric_type === 'orders') {
              currentPeriod = ordersLastWeek?.length || 0;
              previousPeriod = ordersPreviousWeek?.length || 0;
            } else if (threshold.metric_type === 'contributions') {
              currentPeriod = contributionsLastWeekSum;
              previousPeriod = contributionsPreviousWeekSum;
            }
          } else if (threshold.comparison_period === 'day') {
            currentPeriod = metric.daily;
            previousPeriod = metric.dailyPrevious;
          } else if (threshold.comparison_period === 'month') {
            currentPeriod = metric.current;
            previousPeriod = metric.previous;
          }

          if (previousPeriod > 0) {
            const growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
            
            // Check for growth spike (positive threshold)
            if (growth >= threshold.threshold_value && threshold.threshold_value > 0) {
              shouldAlert = true;
              alertType = 'growth_spike';
              growthPercentage = Math.round(growth);
              previousValue = previousPeriod;
              message = `🚀 Croissance : +${Math.round(growth)}% de ${label.plural} cette ${threshold.comparison_period === 'week' ? 'semaine' : threshold.comparison_period === 'day' ? 'journée' : 'période'} !`;
            }
            
            // Check for decline (negative threshold value means drop detection)
            if (growth <= threshold.threshold_value && threshold.threshold_value < 0) {
              shouldAlert = true;
              alertType = 'decline';
              growthPercentage = Math.round(growth);
              previousValue = previousPeriod;
              message = `⚠️ Baisse : ${Math.round(growth)}% de ${label.plural} (${previousPeriod.toLocaleString('fr-FR')} → ${currentPeriod.toLocaleString('fr-FR')})`;
            }
          }
          break;
      }

      if (shouldAlert) {
        // Check if similar alert was created recently
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        
        const { data: recentAlert } = await supabase
          .from('admin_growth_alerts')
          .select('id')
          .eq('threshold_id', threshold.id)
          .eq('alert_type', alertType)
          .gte('triggered_at', oneHourAgo.toISOString())
          .single();

        if (!recentAlert) {
          const isCritical = alertType === 'decline' || 
            (growthPercentage && Math.abs(growthPercentage) >= 50);

          alertsToCreate.push({
            threshold_id: threshold.id,
            alert_type: alertType,
            metric_type: threshold.metric_type,
            current_value: alertType === 'daily_record' ? metric.daily : metric.current,
            previous_value: previousValue,
            growth_percentage: growthPercentage,
            message,
            metadata: {
              threshold_value: threshold.threshold_value,
              comparison_period: threshold.comparison_period,
              is_critical: isCritical,
            },
          });
        }
      }
    }

    // Insert alerts
    if (alertsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('admin_growth_alerts')
        .insert(alertsToCreate);

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }

      console.log(`✅ Created ${alertsToCreate.length} growth alert(s)`);

      // Trigger notification for critical alerts
      const criticalAlerts = alertsToCreate.filter(a => a.metadata?.is_critical);
      if (criticalAlerts.length > 0) {
        console.log(`🔔 ${criticalAlerts.length} critical alert(s) - triggering notifications...`);
        
        try {
          await supabase.functions.invoke('notify-kpi-alerts', {
            body: { alerts: criticalAlerts }
          });
        } catch (notifyError) {
          console.error('Error sending notifications:', notifyError);
        }
      }
    } else {
      console.log('ℹ️ No new alerts to create');
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertsCreated: alertsToCreate.length,
        metrics,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ [check-growth-alerts] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
