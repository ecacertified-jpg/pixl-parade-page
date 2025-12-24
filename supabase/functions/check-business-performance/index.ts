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
  warning_threshold: number;
  critical_threshold: number;
  comparison_period: string;
  is_active: boolean;
  notify_business: boolean;
  notify_admin: boolean;
}

interface BusinessMetrics {
  businessId: string;
  businessName: string;
  currentRevenue: number;
  previousRevenue: number;
  currentOrders: number;
  previousOrders: number;
  daysSinceLastOrder: number;
  currentRating: number;
  previousRating: number;
  currentConversionRate: number;
  previousConversionRate: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Starting business performance check...');

    // 1. Get active thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('business_alert_thresholds')
      .select('*')
      .eq('is_active', true);

    if (thresholdsError) {
      console.error('Error fetching thresholds:', thresholdsError);
      throw thresholdsError;
    }

    console.log(`📊 Found ${thresholds?.length || 0} active thresholds`);

    // 2. Get all active businesses
    const { data: businesses, error: businessesError } = await supabase
      .from('business_accounts')
      .select('id, business_name')
      .eq('is_active', true);

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      throw businessesError;
    }

    console.log(`🏢 Found ${businesses?.length || 0} active businesses`);

    const now = new Date();
    const alertsToCreate: any[] = [];

    // 3. Calculate metrics for each business
    for (const business of businesses || []) {
      console.log(`📈 Checking ${business.business_name}...`);
      
      const metrics = await calculateBusinessMetrics(supabase, business.id, business.business_name);
      
      // 4. Check each threshold
      for (const threshold of thresholds || []) {
        const alert = checkThreshold(business, metrics, threshold as Threshold, now);
        if (alert) {
          // Check if similar alert already exists (not dismissed, not resolved, within 7 days)
          const { data: existingAlert } = await supabase
            .from('business_performance_alerts')
            .select('id')
            .eq('business_id', business.id)
            .eq('alert_type', alert.alert_type)
            .eq('is_dismissed', false)
            .eq('is_resolved', false)
            .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existingAlert) {
            alertsToCreate.push(alert);
            console.log(`⚠️ Alert created for ${business.business_name}: ${alert.alert_type} (${alert.severity})`);
          }
        }
      }
    }

    // 5. Insert all new alerts
    if (alertsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('business_performance_alerts')
        .insert(alertsToCreate);

      if (insertError) {
        console.error('Error inserting alerts:', insertError);
        throw insertError;
      }
      
      console.log(`✅ Created ${alertsToCreate.length} new alerts`);
    } else {
      console.log('✅ No new alerts to create');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        businessesChecked: businesses?.length || 0,
        alertsCreated: alertsToCreate.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in check-business-performance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateBusinessMetrics(
  supabase: any, 
  businessId: string, 
  businessName: string
): Promise<BusinessMetrics> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Get current week orders
  const { data: currentWeekOrders } = await supabase
    .from('business_orders')
    .select('total_amount, status')
    .eq('business_account_id', businessId)
    .gte('created_at', oneWeekAgo.toISOString())
    .lt('created_at', now.toISOString());

  // Get previous week orders
  const { data: previousWeekOrders } = await supabase
    .from('business_orders')
    .select('total_amount, status')
    .eq('business_account_id', businessId)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', oneWeekAgo.toISOString());

  // Get last order date
  const { data: lastOrder } = await supabase
    .from('business_orders')
    .select('created_at')
    .eq('business_account_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get current month ratings
  const { data: currentMonthRatings } = await supabase
    .from('business_orders')
    .select('customer_rating')
    .eq('business_account_id', businessId)
    .not('customer_rating', 'is', null)
    .gte('created_at', oneMonthAgo.toISOString());

  // Get previous month ratings
  const { data: previousMonthRatings } = await supabase
    .from('business_orders')
    .select('customer_rating')
    .eq('business_account_id', businessId)
    .not('customer_rating', 'is', null)
    .gte('created_at', twoMonthsAgo.toISOString())
    .lt('created_at', oneMonthAgo.toISOString());

  // Calculate metrics
  const currentRevenue = (currentWeekOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
  const previousRevenue = (previousWeekOrders || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
  
  const currentOrders = (currentWeekOrders || []).length;
  const previousOrders = (previousWeekOrders || []).length;

  const daysSinceLastOrder = lastOrder?.created_at 
    ? Math.floor((now.getTime() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const currentRating = calculateAverage(currentMonthRatings, 'customer_rating');
  const previousRating = calculateAverage(previousMonthRatings, 'customer_rating');

  // Conversion rate (confirmed / total)
  const currentConfirmed = (currentWeekOrders || []).filter((o: any) => o.status === 'delivered' || o.status === 'confirmed').length;
  const previousConfirmed = (previousWeekOrders || []).filter((o: any) => o.status === 'delivered' || o.status === 'confirmed').length;
  
  const currentConversionRate = currentOrders > 0 ? (currentConfirmed / currentOrders) * 100 : 0;
  const previousConversionRate = previousOrders > 0 ? (previousConfirmed / previousOrders) * 100 : 0;

  return {
    businessId,
    businessName,
    currentRevenue,
    previousRevenue,
    currentOrders,
    previousOrders,
    daysSinceLastOrder,
    currentRating,
    previousRating,
    currentConversionRate,
    previousConversionRate,
  };
}

function calculateAverage(data: any[] | null, field: string): number {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
  return sum / data.length;
}

function checkThreshold(
  business: { id: string; business_name: string },
  metrics: BusinessMetrics,
  threshold: Threshold,
  now: Date
): any | null {
  let currentValue = 0;
  let previousValue = 0;
  let alertType = '';
  let message = '';

  switch (threshold.metric_type) {
    case 'revenue':
      currentValue = metrics.currentRevenue;
      previousValue = metrics.previousRevenue;
      alertType = 'revenue_drop';
      break;
    case 'orders':
      currentValue = metrics.currentOrders;
      previousValue = metrics.previousOrders;
      alertType = 'orders_drop';
      break;
    case 'inactivity':
      currentValue = metrics.daysSinceLastOrder;
      previousValue = 0;
      alertType = 'inactivity';
      break;
    case 'rating':
      currentValue = metrics.currentRating;
      previousValue = metrics.previousRating;
      alertType = 'rating_drop';
      break;
    case 'conversion_rate':
      currentValue = metrics.currentConversionRate;
      previousValue = metrics.previousConversionRate;
      alertType = 'conversion_drop';
      break;
    default:
      return null;
  }

  let changePercentage = 0;
  let severity: 'warning' | 'critical' | null = null;

  if (threshold.threshold_type === 'inactivity_days') {
    // For inactivity, check days directly
    if (currentValue >= threshold.critical_threshold) {
      severity = 'critical';
      message = `${business.business_name} n'a reçu aucune commande depuis ${currentValue} jours`;
    } else if (currentValue >= threshold.warning_threshold) {
      severity = 'warning';
      message = `${business.business_name} n'a reçu aucune commande depuis ${currentValue} jours`;
    }
  } else if (threshold.threshold_type === 'percentage_drop') {
    // Calculate percentage drop
    if (previousValue > 0) {
      changePercentage = ((previousValue - currentValue) / previousValue) * 100;
      
      if (changePercentage >= threshold.critical_threshold) {
        severity = 'critical';
      } else if (changePercentage >= threshold.warning_threshold) {
        severity = 'warning';
      }

      if (severity) {
        const metricLabels: Record<string, string> = {
          revenue: 'chiffre d\'affaires',
          orders: 'nombre de commandes',
          conversion_rate: 'taux de conversion',
        };
        message = `${business.business_name}: baisse de ${changePercentage.toFixed(1)}% du ${metricLabels[threshold.metric_type] || threshold.metric_type}`;
      }
    }
  } else if (threshold.threshold_type === 'absolute_drop') {
    // For ratings, check absolute drop
    const drop = previousValue - currentValue;
    
    if (previousValue > 0 && drop >= threshold.critical_threshold) {
      severity = 'critical';
      changePercentage = (drop / previousValue) * 100;
      message = `${business.business_name}: note moyenne en baisse de ${drop.toFixed(1)} points (${previousValue.toFixed(1)} → ${currentValue.toFixed(1)})`;
    } else if (previousValue > 0 && drop >= threshold.warning_threshold) {
      severity = 'warning';
      changePercentage = (drop / previousValue) * 100;
      message = `${business.business_name}: note moyenne en baisse de ${drop.toFixed(1)} points (${previousValue.toFixed(1)} → ${currentValue.toFixed(1)})`;
    }
  }

  if (severity && message) {
    return {
      business_id: business.id,
      alert_type: alertType,
      metric_type: threshold.metric_type,
      severity,
      current_value: currentValue,
      previous_value: previousValue,
      change_percentage: changePercentage,
      period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: now.toISOString(),
      message,
      metadata: {
        threshold_id: threshold.id,
        comparison_period: threshold.comparison_period,
      },
    };
  }

  return null;
}
