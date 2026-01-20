import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductShareMetrics {
  productId: string;
  productName: string;
  businessId: string;
  businessOwnerId: string;
  totalShares: number;
  totalClicks: number;
  totalConversions: number;
  conversionValue: number;
  conversionRate: number;
  last24hShares: number;
  previous24hShares: number;
  growthPercentage: number;
}

interface ViralityThreshold {
  metric_type: string;
  milestone_values: number[] | null;
  spike_percentage: number;
  min_conversion_rate: number;
  is_active: boolean;
  notify_business: boolean;
  min_delay_hours: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting virality check...');

    // Fetch thresholds configuration
    const { data: thresholds, error: thresholdsError } = await supabaseAdmin
      .from('virality_alert_thresholds')
      .select('*')
      .eq('is_active', true);

    if (thresholdsError) {
      console.error('Error fetching thresholds:', thresholdsError);
      throw thresholdsError;
    }

    const thresholdsMap = new Map<string, ViralityThreshold>();
    thresholds?.forEach(t => thresholdsMap.set(t.metric_type, t));

    // Fetch all active products with their businesses
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        business_id,
        business_owner_id,
        business_accounts!inner(user_id)
      `)
      .eq('is_active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    console.log(`Checking ${products?.length || 0} products for virality...`);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    let alertsCreated = 0;
    let notificationsSent = 0;

    for (const product of products || []) {
      try {
        // Get share metrics for this product
        const { data: shareStats } = await supabaseAdmin
          .from('product_shares')
          .select('id, click_count, created_at')
          .eq('product_id', product.id);

        const totalShares = shareStats?.length || 0;
        const totalClicks = shareStats?.reduce((sum, s) => sum + (s.click_count || 0), 0) || 0;

        // Get shares in last 24h vs previous 24h
        const last24hShares = shareStats?.filter(s => 
          new Date(s.created_at) >= new Date(yesterday)
        ).length || 0;

        const previous24hShares = shareStats?.filter(s => 
          new Date(s.created_at) >= new Date(twoDaysAgo) && 
          new Date(s.created_at) < new Date(yesterday)
        ).length || 0;

        // Get conversion data from share events
        const { data: conversionEvents } = await supabaseAdmin
          .from('product_share_events')
          .select('conversion_value')
          .eq('product_id', product.id)
          .eq('event_type', 'conversion');

        const totalConversions = conversionEvents?.length || 0;
        const conversionValue = conversionEvents?.reduce((sum, e) => 
          sum + (e.conversion_value || 0), 0) || 0;

        const conversionRate = totalClicks > 0 
          ? (totalConversions / totalClicks) * 100 
          : 0;

        const growthPercentage = previous24hShares > 0 
          ? ((last24hShares - previous24hShares) / previous24hShares) * 100 
          : (last24hShares > 0 ? 100 : 0);

        const metrics: ProductShareMetrics = {
          productId: product.id,
          productName: product.name,
          businessId: product.business_id,
          businessOwnerId: product.business_accounts?.user_id || product.business_owner_id,
          totalShares,
          totalClicks,
          totalConversions,
          conversionValue,
          conversionRate,
          last24hShares,
          previous24hShares,
          growthPercentage
        };

        // Check shares milestones
        const sharesThreshold = thresholdsMap.get('shares_count');
        if (sharesThreshold && totalShares > 0) {
          const milestones = sharesThreshold.milestone_values || [10, 25, 50, 100, 250, 500, 1000];
          
          for (const milestone of milestones) {
            if (totalShares >= milestone) {
              // Check if we already have this alert today
              const { data: existingAlert } = await supabaseAdmin
                .from('product_virality_alerts')
                .select('id')
                .eq('product_id', product.id)
                .eq('alert_type', 'shares_milestone')
                .eq('milestone_value', milestone)
                .eq('alert_date', today)
                .maybeSingle();

              if (!existingAlert) {
                // Check if we ever alerted for this milestone
                const { data: anyAlert } = await supabaseAdmin
                  .from('product_virality_alerts')
                  .select('id')
                  .eq('product_id', product.id)
                  .eq('alert_type', 'shares_milestone')
                  .eq('milestone_value', milestone)
                  .maybeSingle();

                if (!anyAlert) {
                  const severity = milestone >= 100 ? 'success' : 'info';
                  const message = `🎉 Votre produit "${product.name}" a atteint ${milestone} partages !`;

                  await supabaseAdmin.from('product_virality_alerts').insert({
                    product_id: product.id,
                    business_id: product.business_id,
                    alert_type: 'shares_milestone',
                    severity,
                    current_shares: totalShares,
                    current_clicks: totalClicks,
                    current_conversions: totalConversions,
                    conversion_rate: conversionRate,
                    conversion_value: conversionValue,
                    milestone_value: milestone,
                    message,
                    alert_date: today,
                    metadata: { milestone, totalShares }
                  });

                  alertsCreated++;
                  console.log(`Created shares_milestone alert for ${product.name}: ${milestone} shares`);

                  // Send notification to business owner
                  if (sharesThreshold.notify_business && metrics.businessOwnerId) {
                    await sendNotification(supabaseAdmin, {
                      userId: metrics.businessOwnerId,
                      title: '🔥 Produit viral !',
                      message: `"${product.name}" a atteint ${milestone} partages !`,
                      type: 'celebration',
                      actionUrl: `/business/products/${product.id}`
                    });
                    notificationsSent++;
                  }
                }
              }
            }
          }
        }

        // Check shares spike
        const spikeThreshold = thresholdsMap.get('shares_spike');
        if (spikeThreshold && last24hShares >= 5 && growthPercentage >= (spikeThreshold.spike_percentage || 100)) {
          const { data: existingAlert } = await supabaseAdmin
            .from('product_virality_alerts')
            .select('id')
            .eq('product_id', product.id)
            .eq('alert_type', 'shares_spike')
            .eq('alert_date', today)
            .maybeSingle();

          if (!existingAlert) {
            const message = `📈 "${product.name}" explose ! +${Math.round(growthPercentage)}% de partages en 24h`;

            await supabaseAdmin.from('product_virality_alerts').insert({
              product_id: product.id,
              business_id: product.business_id,
              alert_type: 'shares_spike',
              severity: 'success',
              current_shares: totalShares,
              current_clicks: totalClicks,
              previous_shares: previous24hShares,
              share_growth_percentage: growthPercentage,
              message,
              period_type: 'day',
              alert_date: today,
              metadata: { last24hShares, previous24hShares, growthPercentage }
            });

            alertsCreated++;
            console.log(`Created shares_spike alert for ${product.name}: +${Math.round(growthPercentage)}%`);

            if (spikeThreshold.notify_business && metrics.businessOwnerId) {
              await sendNotification(supabaseAdmin, {
                userId: metrics.businessOwnerId,
                title: '📈 Pic de partages !',
                message: `"${product.name}" +${Math.round(growthPercentage)}% en 24h`,
                type: 'info',
                actionUrl: `/business/products/${product.id}`
              });
              notificationsSent++;
            }
          }
        }

        // Check high conversion rate
        const conversionThreshold = thresholdsMap.get('conversion_rate');
        if (conversionThreshold && totalConversions >= 3 && conversionRate >= (conversionThreshold.min_conversion_rate || 15)) {
          const { data: existingAlert } = await supabaseAdmin
            .from('product_virality_alerts')
            .select('id')
            .eq('product_id', product.id)
            .eq('alert_type', 'high_conversion_rate')
            .eq('alert_date', today)
            .maybeSingle();

          if (!existingAlert) {
            const message = `💰 "${product.name}" convertit exceptionnellement : ${conversionRate.toFixed(1)}% des clics → achats !`;

            await supabaseAdmin.from('product_virality_alerts').insert({
              product_id: product.id,
              business_id: product.business_id,
              alert_type: 'high_conversion_rate',
              severity: 'success',
              current_shares: totalShares,
              current_clicks: totalClicks,
              current_conversions: totalConversions,
              conversion_rate: conversionRate,
              conversion_value: conversionValue,
              message,
              alert_date: today,
              metadata: { conversionRate, totalConversions, conversionValue }
            });

            alertsCreated++;
            console.log(`Created high_conversion_rate alert for ${product.name}: ${conversionRate.toFixed(1)}%`);

            if (conversionThreshold.notify_business && metrics.businessOwnerId) {
              await sendNotification(supabaseAdmin, {
                userId: metrics.businessOwnerId,
                title: '💰 Taux de conversion exceptionnel !',
                message: `"${product.name}" : ${conversionRate.toFixed(1)}% de conversion`,
                type: 'celebration',
                actionUrl: `/business/products/${product.id}`
              });
              notificationsSent++;
            }
          }
        }

        // Check conversions milestones
        const conversionsThreshold = thresholdsMap.get('conversions_count');
        if (conversionsThreshold && totalConversions > 0) {
          const milestones = conversionsThreshold.milestone_values || [5, 10, 25, 50, 100];
          
          for (const milestone of milestones) {
            if (totalConversions >= milestone) {
              const { data: anyAlert } = await supabaseAdmin
                .from('product_virality_alerts')
                .select('id')
                .eq('product_id', product.id)
                .eq('alert_type', 'conversions_milestone')
                .eq('milestone_value', milestone)
                .maybeSingle();

              if (!anyAlert) {
                const message = `🛒 "${product.name}" a généré ${milestone} ventes via les partages !`;

                await supabaseAdmin.from('product_virality_alerts').insert({
                  product_id: product.id,
                  business_id: product.business_id,
                  alert_type: 'conversions_milestone',
                  severity: 'success',
                  current_shares: totalShares,
                  current_clicks: totalClicks,
                  current_conversions: totalConversions,
                  conversion_rate: conversionRate,
                  conversion_value: conversionValue,
                  milestone_value: milestone,
                  message,
                  alert_date: today,
                  metadata: { milestone, totalConversions, conversionValue }
                });

                alertsCreated++;
                console.log(`Created conversions_milestone alert for ${product.name}: ${milestone} conversions`);

                if (conversionsThreshold.notify_business && metrics.businessOwnerId) {
                  await sendNotification(supabaseAdmin, {
                    userId: metrics.businessOwnerId,
                    title: '🛒 Nouveau jalon de ventes !',
                    message: `"${product.name}" : ${milestone} ventes via partages`,
                    type: 'celebration',
                    actionUrl: `/business/products/${product.id}`
                  });
                  notificationsSent++;
                }
              }
            }
          }
        }

      } catch (productError) {
        console.error(`Error processing product ${product.id}:`, productError);
      }
    }

    console.log(`Virality check complete. Created ${alertsCreated} alerts, sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        productsChecked: products?.length || 0,
        alertsCreated,
        notificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Virality check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function sendNotification(
  supabase: any,
  params: {
    userId: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
  }
) {
  try {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      action_url: params.actionUrl,
      is_read: false,
      metadata: { source: 'virality_alert' }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}