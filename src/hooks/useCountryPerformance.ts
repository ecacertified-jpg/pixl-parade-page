import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, startOfMonth, format, parseISO, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { COUNTRIES } from '@/config/countries';

export interface CountryPerformanceData {
  countryCode: string;
  countryName: string;
  flag: string;
  
  // Utilisateurs
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  userGrowthRate: number;
  
  // Business
  totalBusinesses: number;
  activeBusinesses: number;
  verifiedBusinesses: number;
  conversionRate: number;
  newBusinessesLast30Days: number;
  businessGrowthRate: number;
  
  // Transactions
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueLast30Days: number;
  revenueGrowthRate: number;
  
  // Cagnottes
  totalFunds: number;
  activeFunds: number;
  totalContributions: number;
}

export interface CountryTrend {
  month: string;
  label: string;
  users: number;
  businesses: number;
  revenue: number;
  orders: number;
}

export interface GlobalTotals {
  totalUsers: number;
  totalBusinesses: number;
  totalRevenue: number;
  totalOrders: number;
  userGrowthRate: number;
  businessGrowthRate: number;
  revenueGrowthRate: number;
  orderGrowthRate: number;
}

interface UseCountryPerformanceReturn {
  countries: CountryPerformanceData[];
  trends: Record<string, CountryTrend[]>;
  totals: GlobalTotals;
  loading: boolean;
  refresh: () => void;
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

export function useCountryPerformance(): UseCountryPerformanceReturn {
  const [countries, setCountries] = useState<CountryPerformanceData[]>([]);
  const [trends, setTrends] = useState<Record<string, CountryTrend[]>>({});
  const [totals, setTotals] = useState<GlobalTotals>({
    totalUsers: 0,
    totalBusinesses: 0,
    totalRevenue: 0,
    totalOrders: 0,
    userGrowthRate: 0,
    businessGrowthRate: 0,
    revenueGrowthRate: 0,
    orderGrowthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const last30Days = subDays(now, 30);
      const last7Days = subDays(now, 7);
      const last60Days = subDays(now, 60);

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, country_code, created_at');

      // Fetch all businesses
      const { data: businesses } = await supabase
        .from('business_accounts')
        .select('id, user_id, country_code, status, is_active, is_verified, created_at')
        .is('deleted_at', null);

      // Fetch all orders with business info
      const { data: orders } = await supabase
        .from('business_orders')
        .select('id, total_amount, created_at, business_account_id, business_accounts!inner(country_code)');

      // Fetch all funds
      const { data: funds } = await supabase
        .from('collective_funds')
        .select('id, country_code, status, current_amount, created_at');

      // Group by country
      const countryMap = new Map<string, CountryPerformanceData>();
      const countryTrends = new Map<string, CountryTrend[]>();

      // Initialize countries from config
      Object.keys(COUNTRIES).forEach(code => {
        countryMap.set(code, {
          countryCode: code,
          countryName: COUNTRY_NAMES[code] || code,
          flag: COUNTRY_FLAGS[code] || '🏳️',
          totalUsers: 0,
          newUsersLast7Days: 0,
          newUsersLast30Days: 0,
          userGrowthRate: 0,
          totalBusinesses: 0,
          activeBusinesses: 0,
          verifiedBusinesses: 0,
          conversionRate: 0,
          newBusinessesLast30Days: 0,
          businessGrowthRate: 0,
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          revenueLast30Days: 0,
          revenueGrowthRate: 0,
          totalFunds: 0,
          activeFunds: 0,
          totalContributions: 0,
        });
      });

      // Process profiles
      profiles?.forEach(profile => {
        const code = profile.country_code || 'CI';
        const data = countryMap.get(code);
        if (data) {
          data.totalUsers++;
          const createdAt = parseISO(profile.created_at);
          if (createdAt >= last7Days) data.newUsersLast7Days++;
          if (createdAt >= last30Days) data.newUsersLast30Days++;
        }
      });

      // Count users in previous period for growth rate
      const usersPrev30 = profiles?.filter(p => {
        const created = parseISO(p.created_at);
        return created >= last60Days && created < last30Days;
      }).length || 0;

      const usersLast30 = profiles?.filter(p => {
        const created = parseISO(p.created_at);
        return created >= last30Days;
      }).length || 0;

      // Process businesses
      businesses?.forEach(biz => {
        const code = biz.country_code || 'CI';
        const data = countryMap.get(code);
        if (data) {
          data.totalBusinesses++;
          if (biz.is_active) data.activeBusinesses++;
          if (biz.is_verified) data.verifiedBusinesses++;
          const createdAt = parseISO(biz.created_at);
          if (createdAt >= last30Days) data.newBusinessesLast30Days++;
        }
      });

      // Process orders
      orders?.forEach(order => {
        const bizData = order.business_accounts as any;
        const code = bizData?.country_code || 'CI';
        const data = countryMap.get(code);
        if (data) {
          data.totalOrders++;
          data.totalRevenue += order.total_amount || 0;
          const createdAt = parseISO(order.created_at);
          if (createdAt >= last30Days) {
            data.revenueLast30Days += order.total_amount || 0;
          }
        }
      });

      // Process funds
      funds?.forEach(fund => {
        const code = fund.country_code || 'CI';
        const data = countryMap.get(code);
        if (data) {
          data.totalFunds++;
          if (fund.status === 'active') data.activeFunds++;
          data.totalContributions += fund.current_amount || 0;
        }
      });

      // Calculate derived metrics
      countryMap.forEach(data => {
        if (data.totalUsers > 0) {
          data.conversionRate = (data.totalBusinesses / data.totalUsers) * 100;
        }
        if (data.totalOrders > 0) {
          data.avgOrderValue = data.totalRevenue / data.totalOrders;
        }
      });

      // Generate monthly trends for each country (last 12 months)
      const monthlyData: Record<string, Record<string, { users: number; businesses: number; revenue: number; orders: number }>> = {};
      
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));
        const monthKey = format(monthStart, 'yyyy-MM');
        const monthLabel = format(monthStart, 'MMM yy', { locale: fr });
        
        Object.keys(COUNTRIES).forEach(code => {
          if (!monthlyData[code]) monthlyData[code] = {};
          monthlyData[code][monthKey] = {
            users: 0,
            businesses: 0,
            revenue: 0,
            orders: 0,
          };
        });

        profiles?.forEach(p => {
          const created = parseISO(p.created_at);
          if (created >= monthStart && created < monthEnd) {
            const code = p.country_code || 'CI';
            if (monthlyData[code]?.[monthKey]) {
              monthlyData[code][monthKey].users++;
            }
          }
        });

        businesses?.forEach(b => {
          const created = parseISO(b.created_at);
          if (created >= monthStart && created < monthEnd) {
            const code = b.country_code || 'CI';
            if (monthlyData[code]?.[monthKey]) {
              monthlyData[code][monthKey].businesses++;
            }
          }
        });

        orders?.forEach(o => {
          const created = parseISO(o.created_at);
          if (created >= monthStart && created < monthEnd) {
            const bizData = o.business_accounts as any;
            const code = bizData?.country_code || 'CI';
            if (monthlyData[code]?.[monthKey]) {
              monthlyData[code][monthKey].revenue += o.total_amount || 0;
              monthlyData[code][monthKey].orders++;
            }
          }
        });
      }

      // Convert to trends format
      Object.keys(COUNTRIES).forEach(code => {
        const trends: CountryTrend[] = [];
        Object.entries(monthlyData[code] || {}).forEach(([monthKey, data]) => {
          const monthStart = parseISO(monthKey + '-01');
          trends.push({
            month: monthKey,
            label: format(monthStart, 'MMM yy', { locale: fr }),
            ...data,
          });
        });
        countryTrends.set(code, trends);
      });

      // Calculate global totals
      let globalTotalUsers = 0;
      let globalTotalBusinesses = 0;
      let globalTotalRevenue = 0;
      let globalTotalOrders = 0;

      countryMap.forEach(data => {
        globalTotalUsers += data.totalUsers;
        globalTotalBusinesses += data.totalBusinesses;
        globalTotalRevenue += data.totalRevenue;
        globalTotalOrders += data.totalOrders;
      });

      // Calculate growth rates
      const businessesPrev30 = businesses?.filter(b => {
        const created = parseISO(b.created_at);
        return created >= last60Days && created < last30Days;
      }).length || 0;

      const businessesLast30 = businesses?.filter(b => {
        const created = parseISO(b.created_at);
        return created >= last30Days;
      }).length || 0;

      const revenuePrev30 = orders?.reduce((sum, o) => {
        const created = parseISO(o.created_at);
        if (created >= last60Days && created < last30Days) {
          return sum + (o.total_amount || 0);
        }
        return sum;
      }, 0) || 0;

      const revenueLast30 = orders?.reduce((sum, o) => {
        const created = parseISO(o.created_at);
        if (created >= last30Days) {
          return sum + (o.total_amount || 0);
        }
        return sum;
      }, 0) || 0;

      const ordersPrev30 = orders?.filter(o => {
        const created = parseISO(o.created_at);
        return created >= last60Days && created < last30Days;
      }).length || 0;

      const ordersLast30 = orders?.filter(o => {
        const created = parseISO(o.created_at);
        return created >= last30Days;
      }).length || 0;

      setCountries(Array.from(countryMap.values()).filter(c => c.totalUsers > 0 || c.totalBusinesses > 0));
      setTrends(Object.fromEntries(countryTrends));
      setTotals({
        totalUsers: globalTotalUsers,
        totalBusinesses: globalTotalBusinesses,
        totalRevenue: globalTotalRevenue,
        totalOrders: globalTotalOrders,
        userGrowthRate: usersPrev30 > 0 ? ((usersLast30 - usersPrev30) / usersPrev30) * 100 : 0,
        businessGrowthRate: businessesPrev30 > 0 ? ((businessesLast30 - businessesPrev30) / businessesPrev30) * 100 : 0,
        revenueGrowthRate: revenuePrev30 > 0 ? ((revenueLast30 - revenuePrev30) / revenuePrev30) * 100 : 0,
        orderGrowthRate: ordersPrev30 > 0 ? ((ordersLast30 - ordersPrev30) / ordersPrev30) * 100 : 0,
      });
    } catch (error) {
      console.error('Error fetching country performance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { countries, trends, totals, loading, refresh: fetchData };
}
