import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CountryMetrics {
  countryCode: string;
  users: number;
  businesses: number;
  revenue: number;
  orders: number;
  usersAchievement: number | null;
  businessesAchievement: number | null;
  revenueAchievement: number | null;
  ordersAchievement: number | null;
  usersGrowth: number | null;
  businessesGrowth: number | null;
  revenueGrowth: number | null;
  ordersGrowth: number | null;
}

interface StrugglingStatus {
  id: string;
  country_code: string;
  is_struggling: boolean;
  severity: 'warning' | 'critical';
  struggling_metrics: string[];
  struggling_since: string | null;
}

const COUNTRY_NAMES: Record<string, string> = {
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BJ: "Bénin",
  ML: "Mali",
  BF: "Burkina Faso",
  TG: "Togo",
};

const COUNTRY_FLAGS: Record<string, string> = {
  CI: "🇨🇮",
  SN: "🇸🇳",
  BJ: "🇧🇯",
  ML: "🇲🇱",
  BF: "🇧🇫",
  TG: "🇹🇬",
};

const METRIC_LABELS: Record<string, string> = {
  users: "Utilisateurs",
  businesses: "Entreprises",
  revenue: "Revenus",
  orders: "Commandes",
};

const THRESHOLDS = {
  criticalAchievement: 50,   // < 50% = critique
  warningAchievement: 70,    // < 70% = avertissement
  criticalGrowth: -10,       // < -10% croissance = avertissement
};

Deno.serve(async (req) => {
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

    console.log(`🔍 Checking struggling countries for ${currentMonth}/${currentYear}`);

    // 1. Get all country objectives for current month
    const { data: objectives } = await supabase
      .from('monthly_objectives')
      .select('*')
      .eq('year', currentYear)
      .eq('month', currentMonth);

    const countryCodes = [...new Set((objectives || []).map(o => o.country_code))];

    if (countryCodes.length === 0) {
      console.log('No objectives defined, checking all known countries');
      countryCodes.push(...Object.keys(COUNTRY_NAMES));
    }

    // 2. Calculate metrics for each country
    const countryMetrics: Record<string, CountryMetrics> = {};

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
        .eq('status', 'approved');

      // Get orders and revenue for current month
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: ordersData } = await supabase
        .from('business_orders')
        .select('total_amount, business_account_id')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .in('status', ['completed', 'delivered', 'confirmed']);

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

      // Get objectives for this country
      const countryObjectives = (objectives || []).filter(o => o.country_code === countryCode);
      
      const getAchievement = (metricType: string, actualValue: number): number | null => {
        const obj = countryObjectives.find(o => o.metric_type === metricType);
        if (!obj || obj.target_value <= 0) return null;
        return (actualValue / obj.target_value) * 100;
      };

      // Get previous month metrics for growth calculation
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1).toISOString();
      const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59).toISOString();

      const { count: prevUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('country_code', countryCode)
        .lte('created_at', endOfPrevMonth);

      const calcGrowth = (current: number, previous: number): number | null => {
        if (previous <= 0) return null;
        return ((current - previous) / previous) * 100;
      };

      countryMetrics[countryCode] = {
        countryCode,
        users: usersCount || 0,
        businesses: businessesCount || 0,
        revenue,
        orders: ordersCount,
        usersAchievement: getAchievement('users', usersCount || 0),
        businessesAchievement: getAchievement('businesses', businessesCount || 0),
        revenueAchievement: getAchievement('revenue', revenue),
        ordersAchievement: getAchievement('orders', ordersCount),
        usersGrowth: calcGrowth(usersCount || 0, prevUsersCount || 0),
        businessesGrowth: null, // Would need more queries
        revenueGrowth: null,
        ordersGrowth: null,
      };
    }

    // 3. Get current struggling status
    const { data: currentStatuses } = await supabase
      .from('country_struggling_status')
      .select('*');

    const statusMap = new Map<string, StrugglingStatus>();
    (currentStatuses || []).forEach(s => statusMap.set(s.country_code, s as StrugglingStatus));

    // 4. Evaluate each country
    const newlyStruggling: { countryCode: string; severity: 'warning' | 'critical'; metrics: string[]; details: Record<string, number> }[] = [];
    const recovered: { countryCode: string }[] = [];

    for (const countryCode of countryCodes) {
      const metrics = countryMetrics[countryCode];
      if (!metrics) continue;

      const strugglingMetrics: string[] = [];
      const details: Record<string, number> = {};
      let hasCritical = false;

      // Check achievements
      const checkAchievement = (key: string, value: number | null) => {
        if (value === null) return;
        details[key] = value;
        if (value < THRESHOLDS.criticalAchievement) {
          strugglingMetrics.push(key);
          hasCritical = true;
        } else if (value < THRESHOLDS.warningAchievement) {
          strugglingMetrics.push(key);
        }
      };

      checkAchievement('users', metrics.usersAchievement);
      checkAchievement('businesses', metrics.businessesAchievement);
      checkAchievement('revenue', metrics.revenueAchievement);
      checkAchievement('orders', metrics.ordersAchievement);

      // Check growth (negative growth is also a warning sign)
      if (metrics.usersGrowth !== null && metrics.usersGrowth < THRESHOLDS.criticalGrowth) {
        if (!strugglingMetrics.includes('users')) strugglingMetrics.push('users');
        details['users_growth'] = metrics.usersGrowth;
      }

      const isNowStruggling = strugglingMetrics.length >= 2 || hasCritical;
      const severity: 'warning' | 'critical' = hasCritical ? 'critical' : 'warning';

      const previousStatus = statusMap.get(countryCode);
      const wasStruggling = previousStatus?.is_struggling || false;

      if (isNowStruggling && !wasStruggling) {
        // Country ENTERS struggling mode
        newlyStruggling.push({ countryCode, severity, metrics: strugglingMetrics, details });
        
        // Upsert status
        await supabase
          .from('country_struggling_status')
          .upsert({
            country_code: countryCode,
            is_struggling: true,
            severity,
            struggling_metrics: strugglingMetrics,
            struggling_since: new Date().toISOString(),
            last_status_change: new Date().toISOString(),
            metadata: { metrics: countryMetrics[countryCode], details },
          }, { onConflict: 'country_code' });

      } else if (!isNowStruggling && wasStruggling) {
        // Country EXITS struggling mode (recovery)
        recovered.push({ countryCode });
        
        await supabase
          .from('country_struggling_status')
          .update({
            is_struggling: false,
            struggling_metrics: [],
            last_status_change: new Date().toISOString(),
          })
          .eq('country_code', countryCode);

      } else if (isNowStruggling && wasStruggling) {
        // Still struggling - update severity if changed
        if (previousStatus && previousStatus.severity !== severity) {
          await supabase
            .from('country_struggling_status')
            .update({
              severity,
              struggling_metrics: strugglingMetrics,
              metadata: { metrics: countryMetrics[countryCode], details },
            })
            .eq('country_code', countryCode);
        }
      }
    }

    // 5. Send notifications for newly struggling countries
    if (newlyStruggling.length > 0) {
      console.log(`🚨 ${newlyStruggling.length} country(ies) entered struggling mode`);

      for (const { countryCode, severity, metrics, details } of newlyStruggling) {
        const countryName = COUNTRY_NAMES[countryCode] || countryCode;
        const flag = COUNTRY_FLAGS[countryCode] || '🌍';
        
        const metricsText = metrics.map(m => {
          const label = METRIC_LABELS[m] || m;
          const value = details[m];
          return value !== undefined ? `${label}: ${value.toFixed(1)}%` : label;
        }).join(', ');

        try {
          await supabase.functions.invoke('admin-notify-critical', {
            body: {
              type: 'struggling_country',
              title: severity === 'critical' 
                ? `🚨 Marché en difficulté critique: ${flag} ${countryName}`
                : `⚠️ Marché en difficulté: ${flag} ${countryName}`,
              message: `${countryName} est maintenant en mode difficulté. Métriques concernées: ${metricsText}`,
              adminName: 'Système',
              entityId: countryCode,
              entityType: 'country',
              actionUrl: `/admin/countries/comparison`,
              metadata: {
                countryCode,
                countryName,
                severity,
                metrics,
                details,
              },
            },
          });
          console.log(`✅ Notification sent for ${countryCode}`);
        } catch (notifyError) {
          console.error(`Error sending notification for ${countryCode}:`, notifyError);
        }
      }
    }

    // 6. Send notifications for recovered countries
    if (recovered.length > 0) {
      console.log(`🎉 ${recovered.length} country(ies) recovered`);

      for (const { countryCode } of recovered) {
        const countryName = COUNTRY_NAMES[countryCode] || countryCode;
        const flag = COUNTRY_FLAGS[countryCode] || '🌍';

        try {
          await supabase.functions.invoke('admin-notify-critical', {
            body: {
              type: 'struggling_country_recovery',
              title: `🎉 Marché en récupération: ${flag} ${countryName}`,
              message: `Bonne nouvelle ! ${countryName} n'est plus en mode difficulté. Tous les objectifs sont maintenant au-dessus de 70%.`,
              adminName: 'Système',
              entityId: countryCode,
              entityType: 'country',
              actionUrl: `/admin/countries/comparison`,
              metadata: {
                countryCode,
                countryName,
              },
            },
          });
          console.log(`✅ Recovery notification sent for ${countryCode}`);
        } catch (notifyError) {
          console.error(`Error sending recovery notification for ${countryCode}:`, notifyError);
        }
      }
    }

    console.log(`✅ Struggling countries check complete. Newly struggling: ${newlyStruggling.length}, Recovered: ${recovered.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        newly_struggling: newlyStruggling.length,
        recovered: recovered.length,
        details: {
          struggling: newlyStruggling.map(s => s.countryCode),
          recovered: recovered.map(r => r.countryCode),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-struggling-countries:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
