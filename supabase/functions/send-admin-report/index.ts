import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  report_type: 'daily' | 'weekly' | 'monthly';
  test_mode?: boolean;
  test_email?: string;
}

interface Metrics {
  newUsers: number;
  newUsersDiff: number;
  newFunds: number;
  newFundsDiff: number;
  amountCollected: number;
  amountDiff: number;
  newBusinesses: number;
  businessDiff: number;
  newOrders: number;
  ordersDiff: number;
  activeAlerts: number;
  topPerformers: { name: string; revenue: number }[];
}

interface AdminRecipient {
  email: string;
  prefs: {
    include_kpis: boolean;
    include_charts_summary: boolean;
    include_alerts: boolean;
    include_top_performers: boolean;
  };
  role: string;
  assignedCountries: string[] | null;
}

// Country name mapping for report titles
const COUNTRY_NAMES: Record<string, string> = {
  'CI': "Côte d'Ivoire",
  'BJ': 'Bénin',
  'SN': 'Sénégal'
};

const getCountryNames = (codes: string[] | null): string => {
  if (!codes || codes.length === 0) return 'Global';
  return codes.map(code => COUNTRY_NAMES[code] || code).join(', ');
};

const getDateRange = (reportType: string) => {
  const now = new Date();
  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (reportType) {
    case 'daily':
      currentEnd = now;
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 1);
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 1);
      break;
    case 'weekly':
      currentEnd = now;
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 7);
      break;
    case 'monthly':
      currentEnd = now;
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 30);
      break;
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }

  return { currentStart, currentEnd, previousStart, previousEnd };
};

const calculateDiff = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
};

const getReportTitle = (reportType: string): string => {
  switch (reportType) {
    case 'daily': return 'Rapport Quotidien';
    case 'weekly': return 'Rapport Hebdomadaire';
    case 'monthly': return 'Rapport Mensuel';
    default: return 'Rapport';
  }
};

const getPeriodLabel = (reportType: string): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  
  switch (reportType) {
    case 'daily':
      return now.toLocaleDateString('fr-FR', options);
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('fr-FR', options)}`;
    case 'monthly':
      const monthStart = new Date(now);
      monthStart.setDate(monthStart.getDate() - 30);
      return `${monthStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('fr-FR', options)}`;
    default:
      return now.toLocaleDateString('fr-FR', options);
  }
};

/**
 * Fetch metrics filtered by country codes
 * If countryFilter is null/empty, fetch global metrics (for super_admins)
 */
const fetchMetricsForCountries = async (
  supabase: SupabaseClient,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date,
  reportType: string,
  countryFilter: string[] | null
): Promise<Metrics> => {
  const hasCountryFilter = countryFilter && countryFilter.length > 0;
  console.log(`Fetching metrics with country filter: ${hasCountryFilter ? countryFilter.join(', ') : 'GLOBAL'}`);

  // New Users - filter by profile.country_code
  let currentUsersQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString());
  
  let previousUsersQuery = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (hasCountryFilter) {
    currentUsersQuery = currentUsersQuery.in('country_code', countryFilter!);
    previousUsersQuery = previousUsersQuery.in('country_code', countryFilter!);
  }

  const [{ count: currentUsers }, { count: previousUsers }] = await Promise.all([
    currentUsersQuery,
    previousUsersQuery
  ]);

  // New Funds - filter by collective_funds.country_code
  let currentFundsQuery = supabase
    .from('collective_funds')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString());
  
  let previousFundsQuery = supabase
    .from('collective_funds')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (hasCountryFilter) {
    currentFundsQuery = currentFundsQuery.in('country_code', countryFilter!);
    previousFundsQuery = previousFundsQuery.in('country_code', countryFilter!);
  }

  const [{ count: currentFunds }, { count: previousFunds }] = await Promise.all([
    currentFundsQuery,
    previousFundsQuery
  ]);

  // Contributions - need to join with collective_funds to filter by country
  // For simplicity, we'll fetch contributions and filter by fund's country
  let currentContributionsQuery = supabase
    .from('fund_contributions')
    .select('amount, collective_funds!inner(country_code)')
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString());
  
  let previousContributionsQuery = supabase
    .from('fund_contributions')
    .select('amount, collective_funds!inner(country_code)')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (hasCountryFilter) {
    currentContributionsQuery = currentContributionsQuery.in('collective_funds.country_code', countryFilter!);
    previousContributionsQuery = previousContributionsQuery.in('collective_funds.country_code', countryFilter!);
  }

  const [{ data: currentContributions }, { data: previousContributions }] = await Promise.all([
    currentContributionsQuery,
    previousContributionsQuery
  ]);

  const currentAmount = currentContributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  const previousAmount = previousContributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

  // New Businesses - filter by business_accounts.country_code
  let currentBusinessesQuery = supabase
    .from('business_accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString());
  
  let previousBusinessesQuery = supabase
    .from('business_accounts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (hasCountryFilter) {
    currentBusinessesQuery = currentBusinessesQuery.in('country_code', countryFilter!);
    previousBusinessesQuery = previousBusinessesQuery.in('country_code', countryFilter!);
  }

  const [{ count: currentBusinesses }, { count: previousBusinesses }] = await Promise.all([
    currentBusinessesQuery,
    previousBusinessesQuery
  ]);

  // Orders - need to join with business_accounts to filter by country
  let currentOrdersQuery = supabase
    .from('business_orders')
    .select('*, business_accounts!inner(country_code)', { count: 'exact', head: true })
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString());
  
  let previousOrdersQuery = supabase
    .from('business_orders')
    .select('*, business_accounts!inner(country_code)', { count: 'exact', head: true })
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString());

  if (hasCountryFilter) {
    currentOrdersQuery = currentOrdersQuery.in('business_accounts.country_code', countryFilter!);
    previousOrdersQuery = previousOrdersQuery.in('business_accounts.country_code', countryFilter!);
  }

  const [{ count: currentOrders }, { count: previousOrders }] = await Promise.all([
    currentOrdersQuery,
    previousOrdersQuery
  ]);

  // Active Alerts - these are global for now (admins need to see all alerts in their scope)
  const { count: growthAlerts } = await supabase
    .from('admin_growth_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('is_dismissed', false);

  const { count: businessAlerts } = await supabase
    .from('business_performance_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('is_dismissed', false);

  // Top Performers - filter by business country
  let topPerformers: { name: string; revenue: number }[] = [];
  if (reportType !== 'daily') {
    let ordersQuery = supabase
      .from('business_orders')
      .select('business_account_id, total_amount, business_accounts!inner(country_code)')
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', currentEnd.toISOString());

    if (hasCountryFilter) {
      ordersQuery = ordersQuery.in('business_accounts.country_code', countryFilter!);
    }

    const { data: orders } = await ordersQuery;

    // Get business names - with country filter if applicable
    let businessQuery = supabase
      .from('business_accounts')
      .select('id, business_name, country_code');
    
    if (hasCountryFilter) {
      businessQuery = businessQuery.in('country_code', countryFilter!);
    }

    const { data: businesses } = await businessQuery;

    if (orders && businesses) {
      const revenueByBusiness: Record<string, number> = {};
      orders.forEach(order => {
        revenueByBusiness[order.business_account_id] = 
          (revenueByBusiness[order.business_account_id] || 0) + Number(order.total_amount);
      });

      topPerformers = Object.entries(revenueByBusiness)
        .map(([id, revenue]) => ({
          name: businesses.find(b => b.id === id)?.business_name || 'Inconnu',
          revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }
  }

  return {
    newUsers: currentUsers || 0,
    newUsersDiff: calculateDiff(currentUsers || 0, previousUsers || 0),
    newFunds: currentFunds || 0,
    newFundsDiff: calculateDiff(currentFunds || 0, previousFunds || 0),
    amountCollected: currentAmount,
    amountDiff: calculateDiff(currentAmount, previousAmount),
    newBusinesses: currentBusinesses || 0,
    businessDiff: calculateDiff(currentBusinesses || 0, previousBusinesses || 0),
    newOrders: currentOrders || 0,
    ordersDiff: calculateDiff(currentOrders || 0, previousOrders || 0),
    activeAlerts: (growthAlerts || 0) + (businessAlerts || 0),
    topPerformers
  };
};

const generateEmailHTML = (
  metrics: Metrics, 
  reportType: string, 
  prefs: AdminRecipient['prefs'],
  countryScope: string
): string => {
  const diffIcon = (diff: number) => diff >= 0 ? '↑' : '↓';
  const diffColor = (diff: number) => diff >= 0 ? '#22c55e' : '#ef4444';
  
  const kpisSection = prefs.include_kpis ? `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #7A5DC7; font-size: 18px; margin-bottom: 16px;">📊 Indicateurs clés</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px; background: #f8f7fc; border-radius: 8px; text-align: center; width: 33%;">
            <div style="font-size: 24px; font-weight: bold; color: #2E2E2E;">${formatNumber(metrics.newUsers)}</div>
            <div style="font-size: 12px; color: #666;">Nouveaux utilisateurs</div>
            <div style="font-size: 12px; color: ${diffColor(metrics.newUsersDiff)};">${diffIcon(metrics.newUsersDiff)} ${Math.abs(metrics.newUsersDiff)}%</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="padding: 12px; background: #f8f7fc; border-radius: 8px; text-align: center; width: 33%;">
            <div style="font-size: 24px; font-weight: bold; color: #2E2E2E;">${formatNumber(metrics.newFunds)}</div>
            <div style="font-size: 12px; color: #666;">Nouvelles cagnottes</div>
            <div style="font-size: 12px; color: ${diffColor(metrics.newFundsDiff)};">${diffIcon(metrics.newFundsDiff)} ${Math.abs(metrics.newFundsDiff)}%</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="padding: 12px; background: #f8f7fc; border-radius: 8px; text-align: center; width: 33%;">
            <div style="font-size: 24px; font-weight: bold; color: #2E2E2E;">${formatCurrency(metrics.amountCollected)}</div>
            <div style="font-size: 12px; color: #666;">Montant collecté</div>
            <div style="font-size: 12px; color: ${diffColor(metrics.amountDiff)};">${diffIcon(metrics.amountDiff)} ${Math.abs(metrics.amountDiff)}%</div>
          </td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <tr>
          <td style="padding: 12px; background: #f8f7fc; border-radius: 8px; text-align: center; width: 50%;">
            <div style="font-size: 20px; font-weight: bold; color: #2E2E2E;">${formatNumber(metrics.newBusinesses)}</div>
            <div style="font-size: 12px; color: #666;">Nouveaux prestataires</div>
            <div style="font-size: 12px; color: ${diffColor(metrics.businessDiff)};">${diffIcon(metrics.businessDiff)} ${Math.abs(metrics.businessDiff)}%</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="padding: 12px; background: #f8f7fc; border-radius: 8px; text-align: center; width: 50%;">
            <div style="font-size: 20px; font-weight: bold; color: #2E2E2E;">${formatNumber(metrics.newOrders)}</div>
            <div style="font-size: 12px; color: #666;">Commandes passées</div>
            <div style="font-size: 12px; color: ${diffColor(metrics.ordersDiff)};">${diffIcon(metrics.ordersDiff)} ${Math.abs(metrics.ordersDiff)}%</div>
          </td>
        </tr>
      </table>
    </div>
  ` : '';

  const alertsSection = prefs.include_alerts && metrics.activeAlerts > 0 ? `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #7A5DC7; font-size: 18px; margin-bottom: 16px;">⚠️ Alertes actives</h2>
      <div style="padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <div style="font-weight: bold; color: #92400e;">${metrics.activeAlerts} alerte(s) requiert(ent) votre attention</div>
        <div style="color: #92400e; font-size: 14px; margin-top: 4px;">Consultez le dashboard pour plus de détails</div>
      </div>
    </div>
  ` : '';

  const topPerformersSection = prefs.include_top_performers && metrics.topPerformers.length > 0 ? `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #7A5DC7; font-size: 18px; margin-bottom: 16px;">🏆 Top Prestataires</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${metrics.topPerformers.map((performer, index) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0;">
              <span style="display: inline-block; width: 24px; height: 24px; background: ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'}; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 8px;">${index + 1}</span>
              ${performer.name}
            </td>
            <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #7A5DC7;">${formatCurrency(performer.revenue)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  // Add scope indicator in the report
  const scopeIndicator = countryScope !== 'Global' ? `
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
      <div style="font-size: 14px; color: #1e40af;">
        📍 <strong>Périmètre :</strong> ${countryScope}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7A5DC7, #C084FC); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎁 JOIE DE VIVRE</h1>
          <div style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 18px;">${getReportTitle(reportType)}</div>
          <div style="color: rgba(255,255,255,0.8); margin-top: 4px; font-size: 14px;">📅 ${getPeriodLabel(reportType)}</div>
          ${countryScope !== 'Global' ? `<div style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; display: inline-block;">📍 ${countryScope}</div>` : ''}
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          ${scopeIndicator}
          ${kpisSection}
          ${alertsSection}
          ${topPerformersSection}

          <!-- CTA -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://vaimfeurvzokepqqqrsl.lovable.app/admin" 
               style="display: inline-block; padding: 14px 32px; background: #7A5DC7; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📊 Voir le dashboard complet
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>Ce rapport a été généré automatiquement par JOIE DE VIVRE.</p>
          <p>Pour modifier vos préférences de rapport, <a href="https://vaimfeurvzokepqqqrsl.lovable.app/admin/settings" style="color: #7A5DC7;">cliquez ici</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-admin-report function called");

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { report_type, test_mode, test_email }: ReportRequest = await req.json();
    console.log(`Generating ${report_type} report, test_mode: ${test_mode}`);

    // Get date ranges
    const { currentStart, currentEnd, previousStart, previousEnd } = getDateRange(report_type);
    console.log(`Date range: ${currentStart.toISOString()} to ${currentEnd.toISOString()}`);

    // Get recipients with their admin info (including assigned_countries)
    let recipients: AdminRecipient[] = [];

    if (test_mode && test_email) {
      // Test mode: send to specified email with global metrics
      recipients = [{
        email: test_email,
        prefs: {
          include_kpis: true,
          include_charts_summary: true,
          include_alerts: true,
          include_top_performers: true
        },
        role: 'super_admin',
        assignedCountries: null
      }];
    } else {
      // Normal mode: get subscribed admins with their country assignments
      const { data: adminPrefs } = await supabase
        .from('admin_report_preferences')
        .select(`
          admin_user_id,
          email_override,
          include_kpis,
          include_charts_summary,
          include_alerts,
          include_top_performers,
          report_types
        `)
        .eq('is_active', true)
        .contains('report_types', [report_type]);

      if (adminPrefs && adminPrefs.length > 0) {
        const adminUserIds = adminPrefs.map(p => p.admin_user_id);
        
        // Get admin users with their roles and assigned countries
        const { data: adminUsers } = await supabase
          .from('admin_users')
          .select('user_id, role, assigned_countries, is_active')
          .in('user_id', adminUserIds)
          .eq('is_active', true);

        for (const pref of adminPrefs) {
          const adminUser = adminUsers?.find(a => a.user_id === pref.admin_user_id);
          if (!adminUser) continue;

          let email = pref.email_override;
          
          if (!email) {
            // Try to get email from auth.users
            const { data: authUser } = await supabase.auth.admin.getUserById(pref.admin_user_id);
            email = authUser?.user?.email;
          }

          if (email) {
            recipients.push({
              email,
              prefs: {
                include_kpis: pref.include_kpis,
                include_charts_summary: pref.include_charts_summary,
                include_alerts: pref.include_alerts,
                include_top_performers: pref.include_top_performers
              },
              role: adminUser.role,
              assignedCountries: adminUser.assigned_countries as string[] | null
            });
          }
        }
      }
    }

    console.log(`Sending report to ${recipients.length} recipient(s)`);

    let successCount = 0;
    let errorMessages: string[] = [];

    // Cache metrics by country filter to avoid re-fetching
    const metricsCache: Map<string, Metrics> = new Map();

    for (const recipient of recipients) {
      try {
        // Determine country filter for this recipient
        const isSuperAdmin = recipient.role === 'super_admin';
        const hasCountryRestriction = !isSuperAdmin && 
          recipient.assignedCountries && 
          recipient.assignedCountries.length > 0;
        
        const countryFilter = hasCountryRestriction ? recipient.assignedCountries : null;
        const cacheKey = countryFilter ? countryFilter.sort().join(',') : 'GLOBAL';
        const countryScope = getCountryNames(countryFilter);

        console.log(`Processing report for ${recipient.email}: scope=${countryScope}, filter=${cacheKey}`);

        // Get metrics from cache or fetch
        let metrics: Metrics;
        if (metricsCache.has(cacheKey)) {
          metrics = metricsCache.get(cacheKey)!;
          console.log(`Using cached metrics for ${cacheKey}`);
        } else {
          metrics = await fetchMetricsForCountries(
            supabase,
            currentStart,
            currentEnd,
            previousStart,
            previousEnd,
            report_type,
            countryFilter
          );
          metricsCache.set(cacheKey, metrics);
          console.log(`Fetched and cached metrics for ${cacheKey}`);
        }

        const html = generateEmailHTML(metrics, report_type, recipient.prefs, countryScope);
        
        // Build subject with country scope
        const subjectSuffix = countryScope !== 'Global' ? ` - ${countryScope}` : '';
        
        const { error } = await resend.emails.send({
          from: "JOIE DE VIVRE <noreply@joiedevivre-africa.com>",
          to: [recipient.email],
          subject: `🎁 ${getReportTitle(report_type)}${subjectSuffix} - JOIE DE VIVRE`,
          html
        });

        if (error) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          errorMessages.push(`${recipient.email}: ${error.message}`);
        } else {
          console.log(`Report sent to ${recipient.email} (scope: ${countryScope})`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`Error sending to ${recipient.email}:`, err);
        errorMessages.push(`${recipient.email}: ${err.message}`);
      }
    }

    // Log the report
    if (!test_mode) {
      const status = successCount === recipients.length ? 'sent' : 
                     successCount > 0 ? 'partial' : 'failed';
      
      // Build a summary of recipients by scope
      const scopeSummary: Record<string, number> = {};
      recipients.forEach(r => {
        const scope = getCountryNames(r.assignedCountries);
        scopeSummary[scope] = (scopeSummary[scope] || 0) + 1;
      });

      await supabase.from('admin_report_logs').insert({
        report_type,
        recipients_count: successCount,
        status,
        error_message: errorMessages.length > 0 ? errorMessages.join('; ') : null,
        metadata: {
          total_recipients: recipients.length,
          recipients_by_scope: scopeSummary,
          metrics_scopes: Array.from(metricsCache.keys())
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipients_count: successCount,
        total_recipients: recipients.length,
        errors: errorMessages
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Error in send-admin-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);
