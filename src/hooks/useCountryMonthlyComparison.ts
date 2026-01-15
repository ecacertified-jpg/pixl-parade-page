import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COUNTRIES } from '@/config/countries';
import { startOfMonth, endOfMonth, format, parseISO, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CountryMonthlyMetrics {
  countryCode: string;
  countryName: string;
  flag: string;
  month: number;
  monthLabel: string;
  year: number;
  
  // Valeurs réelles
  users: number;
  businesses: number;
  revenue: number;
  orders: number;
  
  // Variations vs mois précédent
  usersVariationM1: number | null;
  businessesVariationM1: number | null;
  revenueVariationM1: number | null;
  ordersVariationM1: number | null;
  
  // Objectifs et taux d'atteinte
  usersObjective: number | null;
  usersAchievement: number | null;
  businessesObjective: number | null;
  businessesAchievement: number | null;
  revenueObjective: number | null;
  revenueAchievement: number | null;
  ordersObjective: number | null;
  ordersAchievement: number | null;
  
  // Classements (1 = meilleur)
  usersRank: number;
  businessesRank: number;
  revenueRank: number;
  ordersRank: number;
  overallRank: number;
  
  // Score de performance global (0-100)
  performanceScore: number;
  
  // Indicateur de difficulté
  isStruggling: boolean;
  strugglingMetrics: string[];
  strugglingSeverity: 'warning' | 'critical' | null;
}

export interface MonthlyCountryComparison {
  month: number;
  year: number;
  monthLabel: string;
  countries: CountryMonthlyMetrics[];
  topPerformer: string;
  worstPerformer: string;
  strugglingCountries: string[];
}

export interface YearlyRankingData {
  countryCode: string;
  countryName: string;
  flag: string;
  monthlyRanks: { month: number; rank: number; metric: string }[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  CI: '🇨🇮',
  SN: '🇸🇳',
  BJ: '🇧🇯',
  ML: '🇲🇱',
  BF: '🇧🇫',
  TG: '🇹🇬',
  GN: '🇬🇳',
  NE: '🇳🇪',
  CM: '🇨🇲',
  GA: '🇬🇦',
};

const COUNTRY_NAMES: Record<string, string> = {
  CI: 'Côte d\'Ivoire',
  SN: 'Sénégal',
  BJ: 'Bénin',
  ML: 'Mali',
  BF: 'Burkina Faso',
  TG: 'Togo',
  GN: 'Guinée',
  NE: 'Niger',
  CM: 'Cameroun',
  GA: 'Gabon',
};

const METRIC_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus',
  orders: 'Commandes',
};

interface UseCountryMonthlyComparisonOptions {
  year: number;
  month?: number;
}

interface UseCountryMonthlyComparisonReturn {
  comparisons: MonthlyCountryComparison[];
  currentMonth: MonthlyCountryComparison | null;
  yearlyRankings: YearlyRankingData[];
  heatmapData: { countryCode: string; months: { month: number; achievement: number | null; status: 'success' | 'warning' | 'danger' | 'unknown' }[] }[];
  loading: boolean;
  refresh: () => void;
}

export function useCountryMonthlyComparison({ 
  year,
  month
}: UseCountryMonthlyComparisonOptions): UseCountryMonthlyComparisonReturn {
  const [comparisons, setComparisons] = useState<MonthlyCountryComparison[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch objectives for the year
      const { data: objectivesData } = await supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', year)
        .not('country_code', 'is', null);

      // Fetch all profiles for the year
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, country_code, created_at');

      // Fetch all businesses
      const { data: businesses } = await supabase
        .from('business_accounts')
        .select('id, user_id, country_code, created_at')
        .is('deleted_at', null);

      // Fetch all orders with business info
      const { data: orders } = await supabase
        .from('business_orders')
        .select('id, total_amount, created_at, business_account_id, business_accounts!inner(country_code)');

      // Process data for each month
      const monthlyComparisons: MonthlyCountryComparison[] = [];
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Process months 1-12 or up to current month if current year
      const maxMonth = year === currentYear ? currentMonth : 12;
      
      for (let m = 1; m <= maxMonth; m++) {
        const monthStart = new Date(year, m - 1, 1);
        const monthEnd = endOfMonth(monthStart);
        const prevMonthStart = startOfMonth(subMonths(monthStart, 1));
        const prevMonthEnd = endOfMonth(prevMonthStart);
        
        const monthLabel = format(monthStart, 'MMMM yyyy', { locale: fr });
        
        const countryMetrics: CountryMonthlyMetrics[] = [];
        
        // Initialize countries from config
        const countryCodes = Object.keys(COUNTRIES);
        
        for (const code of countryCodes) {
          // Current month data
          const monthUsers = profiles?.filter(p => {
            const created = parseISO(p.created_at);
            return (p.country_code || 'CI') === code && 
                   created >= monthStart && created <= monthEnd;
          }).length || 0;
          
          const monthBusinesses = businesses?.filter(b => {
            const created = parseISO(b.created_at);
            return (b.country_code || 'CI') === code && 
                   created >= monthStart && created <= monthEnd;
          }).length || 0;
          
          const monthOrders = orders?.filter(o => {
            const created = parseISO(o.created_at);
            const bizData = o.business_accounts as any;
            return (bizData?.country_code || 'CI') === code && 
                   created >= monthStart && created <= monthEnd;
          }) || [];
          
          const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
          const monthOrderCount = monthOrders.length;
          
          // Previous month data for variation
          const prevUsers = profiles?.filter(p => {
            const created = parseISO(p.created_at);
            return (p.country_code || 'CI') === code && 
                   created >= prevMonthStart && created <= prevMonthEnd;
          }).length || 0;
          
          const prevBusinesses = businesses?.filter(b => {
            const created = parseISO(b.created_at);
            return (b.country_code || 'CI') === code && 
                   created >= prevMonthStart && created <= prevMonthEnd;
          }).length || 0;
          
          const prevOrders = orders?.filter(o => {
            const created = parseISO(o.created_at);
            const bizData = o.business_accounts as any;
            return (bizData?.country_code || 'CI') === code && 
                   created >= prevMonthStart && created <= prevMonthEnd;
          }) || [];
          
          const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
          const prevOrderCount = prevOrders.length;
          
          // Calculate variations
          const calcVariation = (current: number, prev: number): number | null => {
            if (prev === 0) return current > 0 ? 100 : null;
            return ((current - prev) / prev) * 100;
          };
          
          // Get objectives
          const getObjective = (metric: string): number | null => {
            const obj = objectivesData?.find(
              o => o.country_code === code && o.month === m && o.metric_type === metric
            );
            return obj?.target_value ?? null;
          };
          
          const calcAchievement = (value: number, objective: number | null): number | null => {
            if (!objective || objective === 0) return null;
            return (value / objective) * 100;
          };
          
          const usersObjective = getObjective('users');
          const businessesObjective = getObjective('businesses');
          const revenueObjective = getObjective('revenue');
          const ordersObjective = getObjective('orders');
          
          const usersAchievement = calcAchievement(monthUsers, usersObjective);
          const businessesAchievement = calcAchievement(monthBusinesses, businessesObjective);
          const revenueAchievement = calcAchievement(monthRevenue, revenueObjective);
          const ordersAchievement = calcAchievement(monthOrderCount, ordersObjective);
          
          // Determine struggling status
          const strugglingMetrics: string[] = [];
          let strugglingSeverity: 'warning' | 'critical' | null = null;
          
          const checkStruggling = (achievement: number | null, variation: number | null, metricName: string) => {
            if (achievement !== null && achievement < 50) {
              strugglingMetrics.push(metricName);
              strugglingSeverity = 'critical';
            } else if (achievement !== null && achievement < 70) {
              strugglingMetrics.push(metricName);
              if (!strugglingSeverity) strugglingSeverity = 'warning';
            } else if (variation !== null && variation < -10) {
              strugglingMetrics.push(`${metricName} (croissance)`);
              if (!strugglingSeverity) strugglingSeverity = 'warning';
            }
          };
          
          const usersVariation = calcVariation(monthUsers, prevUsers);
          const businessesVariation = calcVariation(monthBusinesses, prevBusinesses);
          const revenueVariation = calcVariation(monthRevenue, prevRevenue);
          const ordersVariation = calcVariation(monthOrderCount, prevOrderCount);
          
          checkStruggling(usersAchievement, usersVariation, 'Utilisateurs');
          checkStruggling(businessesAchievement, businessesVariation, 'Entreprises');
          checkStruggling(revenueAchievement, revenueVariation, 'Revenus');
          checkStruggling(ordersAchievement, ordersVariation, 'Commandes');
          
          // Calculate performance score (0-100)
          const scores: number[] = [];
          if (usersAchievement !== null) scores.push(Math.min(usersAchievement, 150));
          if (businessesAchievement !== null) scores.push(Math.min(businessesAchievement, 150));
          if (revenueAchievement !== null) scores.push(Math.min(revenueAchievement, 150));
          if (ordersAchievement !== null) scores.push(Math.min(ordersAchievement, 150));
          
          const performanceScore = scores.length > 0 
            ? Math.min(100, (scores.reduce((a, b) => a + b, 0) / scores.length) * (100 / 150))
            : 50;
          
          countryMetrics.push({
            countryCode: code,
            countryName: COUNTRY_NAMES[code] || code,
            flag: COUNTRY_FLAGS[code] || '🏳️',
            month: m,
            monthLabel,
            year,
            users: monthUsers,
            businesses: monthBusinesses,
            revenue: monthRevenue,
            orders: monthOrderCount,
            usersVariationM1: usersVariation,
            businessesVariationM1: businessesVariation,
            revenueVariationM1: revenueVariation,
            ordersVariationM1: ordersVariation,
            usersObjective,
            usersAchievement,
            businessesObjective,
            businessesAchievement,
            revenueObjective,
            revenueAchievement,
            ordersObjective,
            ordersAchievement,
            usersRank: 0,
            businessesRank: 0,
            revenueRank: 0,
            ordersRank: 0,
            overallRank: 0,
            performanceScore,
            isStruggling: strugglingMetrics.length >= 2,
            strugglingMetrics,
            strugglingSeverity,
          });
        }
        
        // Calculate rankings
        const sortByMetric = (metric: 'users' | 'businesses' | 'revenue' | 'orders') => {
          const sorted = [...countryMetrics].sort((a, b) => b[metric] - a[metric]);
          sorted.forEach((c, i) => {
            const country = countryMetrics.find(x => x.countryCode === c.countryCode);
            if (country) {
              if (metric === 'users') country.usersRank = i + 1;
              if (metric === 'businesses') country.businessesRank = i + 1;
              if (metric === 'revenue') country.revenueRank = i + 1;
              if (metric === 'orders') country.ordersRank = i + 1;
            }
          });
        };
        
        sortByMetric('users');
        sortByMetric('businesses');
        sortByMetric('revenue');
        sortByMetric('orders');
        
        // Calculate overall rank based on performance score
        const sortedByScore = [...countryMetrics].sort((a, b) => b.performanceScore - a.performanceScore);
        sortedByScore.forEach((c, i) => {
          const country = countryMetrics.find(x => x.countryCode === c.countryCode);
          if (country) country.overallRank = i + 1;
        });
        
        // Determine top and worst performers
        const topPerformer = sortedByScore[0]?.countryCode || '';
        const worstPerformer = sortedByScore[sortedByScore.length - 1]?.countryCode || '';
        const strugglingCountries = countryMetrics
          .filter(c => c.isStruggling)
          .map(c => c.countryCode);
        
        monthlyComparisons.push({
          month: m,
          year,
          monthLabel,
          countries: countryMetrics,
          topPerformer,
          worstPerformer,
          strugglingCountries,
        });
      }
      
      setComparisons(monthlyComparisons);
    } catch (error) {
      console.error('Error fetching country monthly comparison:', error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentMonth = useMemo(() => {
    if (month) {
      return comparisons.find(c => c.month === month) || null;
    }
    const now = new Date();
    const currentM = now.getFullYear() === year ? now.getMonth() + 1 : 12;
    return comparisons.find(c => c.month === currentM) || comparisons[comparisons.length - 1] || null;
  }, [comparisons, month, year]);

  const yearlyRankings = useMemo(() => {
    const countryCodes = Object.keys(COUNTRIES);
    return countryCodes.map(code => ({
      countryCode: code,
      countryName: COUNTRY_NAMES[code] || code,
      flag: COUNTRY_FLAGS[code] || '🏳️',
      monthlyRanks: comparisons.map(comp => {
        const country = comp.countries.find(c => c.countryCode === code);
        return {
          month: comp.month,
          rank: country?.overallRank || countryCodes.length,
          metric: 'overall',
        };
      }),
    }));
  }, [comparisons]);

  const heatmapData = useMemo(() => {
    const countryCodes = Object.keys(COUNTRIES);
    return countryCodes.map(code => ({
      countryCode: code,
      months: Array.from({ length: 12 }, (_, i) => {
        const monthData = comparisons.find(c => c.month === i + 1);
        const country = monthData?.countries.find(c => c.countryCode === code);
        
        // Calculate average achievement across all metrics
        const achievements = [
          country?.usersAchievement,
          country?.businessesAchievement,
          country?.revenueAchievement,
          country?.ordersAchievement,
        ].filter((a): a is number => a !== null);
        
        const avgAchievement = achievements.length > 0
          ? achievements.reduce((a, b) => a + b, 0) / achievements.length
          : null;
        
        let status: 'success' | 'warning' | 'danger' | 'unknown' = 'unknown';
        if (avgAchievement !== null) {
          if (avgAchievement >= 100) status = 'success';
          else if (avgAchievement >= 70) status = 'warning';
          else status = 'danger';
        }
        
        return {
          month: i + 1,
          achievement: avgAchievement,
          status,
        };
      }),
    }));
  }, [comparisons]);

  return {
    comparisons,
    currentMonth,
    yearlyRankings,
    heatmapData,
    loading,
    refresh: fetchData,
  };
}

export { COUNTRY_FLAGS, COUNTRY_NAMES, METRIC_LABELS };
