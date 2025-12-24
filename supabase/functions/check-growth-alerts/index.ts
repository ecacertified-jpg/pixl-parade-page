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

    // Calculate metrics
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Users metrics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: usersYesterday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', now.toISOString())
      .gte('created_at', yesterday.toISOString());

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

    const metrics: Record<string, MetricData> = {
      users: {
        current: totalUsers || 0,
        previous: (totalUsers || 0) - (usersLastWeek || 0),
        daily: usersYesterday || 0,
        dailyPrevious: 0, // Would need more complex query for daily record
      },
      businesses: {
        current: totalBusinesses || 0,
        previous: (totalBusinesses || 0) - (businessesLastWeek || 0),
        daily: businessesYesterday || 0,
        dailyPrevious: 0,
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

      switch (threshold.threshold_type) {
        case 'absolute':
          // Check if we've crossed this milestone
          if (metric.current >= threshold.threshold_value) {
            // Check if alert already exists for this milestone
            const { data: existingAlert } = await supabase
              .from('admin_growth_alerts')
              .select('id')
              .eq('threshold_id', threshold.id)
              .eq('alert_type', 'milestone')
              .single();

            if (!existingAlert) {
              shouldAlert = true;
              alertType = 'milestone';
              message = `🎉 Milestone atteint : ${threshold.threshold_value} ${threshold.metric_type === 'users' ? 'utilisateurs' : 'entreprises'} !`;
            }
          }
          break;

        case 'daily_count':
          if (metric.daily >= threshold.threshold_value) {
            shouldAlert = true;
            alertType = 'daily_record';
            message = `📈 Record quotidien : ${metric.daily} ${threshold.metric_type === 'users' ? 'inscriptions' : 'nouveaux business'} hier !`;
            previousValue = metric.dailyPrevious;
          }
          break;

        case 'percentage':
          const weeklyGrowth = threshold.comparison_period === 'week' ? usersLastWeek : usersYesterday;
          const previousWeekly = threshold.comparison_period === 'week' ? usersPreviousWeek : 0;
          
          if (threshold.metric_type === 'businesses') {
            const bWeekly = threshold.comparison_period === 'week' ? businessesLastWeek : businessesYesterday;
            const bPrevious = threshold.comparison_period === 'week' ? businessesPreviousWeek : 0;
            
            if ((bPrevious || 0) > 0) {
              const growth = (((bWeekly || 0) - (bPrevious || 0)) / (bPrevious || 1)) * 100;
              if (growth >= threshold.threshold_value) {
                shouldAlert = true;
                alertType = 'growth_spike';
                growthPercentage = Math.round(growth);
                previousValue = bPrevious;
                message = `🚀 Croissance exceptionnelle : +${Math.round(growth)}% de business cette semaine !`;
              }
            }
          } else {
            if ((previousWeekly || 0) > 0) {
              const growth = (((weeklyGrowth || 0) - (previousWeekly || 0)) / (previousWeekly || 1)) * 100;
              if (growth >= threshold.threshold_value) {
                shouldAlert = true;
                alertType = 'growth_spike';
                growthPercentage = Math.round(growth);
                previousValue = previousWeekly;
                message = `🚀 Croissance exceptionnelle : +${Math.round(growth)}% d'inscriptions cette semaine !`;
              }
            }
          }
          break;
      }

      if (shouldAlert) {
        // Check if similar alert was created recently (avoid duplicates)
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
