import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, subYears } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface MonthlyMetrics {
  month: number;
  year: number;
  label: string;
  users: number;
  usersVariationM1: number | null;
  usersVariationY1: number | null;
  usersObjective: number | null;
  usersVsObjective: number | null;
  businesses: number;
  businessesVariationM1: number | null;
  businessesVariationY1: number | null;
  businessesObjective: number | null;
  businessesVsObjective: number | null;
  revenue: number;
  revenueVariationM1: number | null;
  revenueVariationY1: number | null;
  revenueObjective: number | null;
  revenueVsObjective: number | null;
  orders: number;
  ordersVariationM1: number | null;
  ordersVariationY1: number | null;
  ordersObjective: number | null;
  ordersVsObjective: number | null;
  funds: number;
  fundsVariationM1: number | null;
  fundsVariationY1: number | null;
  fundsObjective: number | null;
  fundsVsObjective: number | null;
}

export interface YearlyTotals {
  users: number;
  usersVariation: number | null;
  usersObjective: number;
  usersVsObjective: number | null;
  businesses: number;
  businessesVariation: number | null;
  businessesObjective: number;
  businessesVsObjective: number | null;
  revenue: number;
  revenueVariation: number | null;
  revenueObjective: number;
  revenueVsObjective: number | null;
  orders: number;
  ordersVariation: number | null;
  ordersObjective: number;
  ordersVsObjective: number | null;
  funds: number;
  fundsVariation: number | null;
  fundsObjective: number;
  fundsVsObjective: number | null;
}

const calculateVariation = (current: number, previous: number): number | null => {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
};

const calculateVsObjective = (actual: number, objective: number | null): number | null => {
  if (!objective || objective === 0) return null;
  return Math.round((actual / objective) * 100);
};

export function useMonthlyComparison(year: number) {
  const [metrics, setMetrics] = useState<MonthlyMetrics[]>([]);
  const [totals, setTotals] = useState<YearlyTotals | null>(null);
  const [previousYearTotals, setPreviousYearTotals] = useState<YearlyTotals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch objectives for the year
      const { data: objectives } = await supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', year);

      const getObjective = (month: number, metric: string): number | null => {
        const obj = objectives?.find(o => o.month === month && o.metric_type === metric);
        return obj?.target_value ?? null;
      };

      // Fetch data for current year and previous year
      const monthlyData: MonthlyMetrics[] = [];
      const currentYear = year;
      const previousYear = year - 1;

      for (let month = 1; month <= 12; month++) {
        const currentDate = new Date(currentYear, month - 1, 1);
        const previousMonthDate = subMonths(currentDate, 1);
        const previousYearDate = subYears(currentDate, 1);

        const currentStart = startOfMonth(currentDate).toISOString();
        const currentEnd = endOfMonth(currentDate).toISOString();
        const prevMonthStart = startOfMonth(previousMonthDate).toISOString();
        const prevMonthEnd = endOfMonth(previousMonthDate).toISOString();
        const prevYearStart = startOfMonth(previousYearDate).toISOString();
        const prevYearEnd = endOfMonth(previousYearDate).toISOString();

        // Fetch users count for each period
        const [
          { count: usersCount },
          { count: usersPrevMonth },
          { count: usersPrevYear },
          { count: businessesCount },
          { count: businessesPrevMonth },
          { count: businessesPrevYear },
          { data: ordersData },
          { data: ordersPrevMonthData },
          { data: ordersPrevYearData },
          { count: fundsCount },
          { count: fundsPrevMonth },
          { count: fundsPrevYear }
        ] = await Promise.all([
          // Current month users
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', currentStart).lte('created_at', currentEnd),
          // Previous month users
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
          // Previous year same month users
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', prevYearStart).lte('created_at', prevYearEnd),
          // Current month businesses
          supabase.from('business_accounts').select('*', { count: 'exact', head: true })
            .gte('created_at', currentStart).lte('created_at', currentEnd),
          // Previous month businesses
          supabase.from('business_accounts').select('*', { count: 'exact', head: true })
            .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
          // Previous year same month businesses
          supabase.from('business_accounts').select('*', { count: 'exact', head: true })
            .gte('created_at', prevYearStart).lte('created_at', prevYearEnd),
          // Current month orders with revenue
          supabase.from('business_orders').select('total_amount')
            .gte('created_at', currentStart).lte('created_at', currentEnd),
          // Previous month orders
          supabase.from('business_orders').select('total_amount')
            .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
          // Previous year same month orders
          supabase.from('business_orders').select('total_amount')
            .gte('created_at', prevYearStart).lte('created_at', prevYearEnd),
          // Current month funds
          supabase.from('collective_funds').select('*', { count: 'exact', head: true })
            .gte('created_at', currentStart).lte('created_at', currentEnd),
          // Previous month funds
          supabase.from('collective_funds').select('*', { count: 'exact', head: true })
            .gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
          // Previous year same month funds
          supabase.from('collective_funds').select('*', { count: 'exact', head: true })
            .gte('created_at', prevYearStart).lte('created_at', prevYearEnd)
        ]);

        const users = usersCount || 0;
        const businesses = businessesCount || 0;
        const orders = ordersData?.length || 0;
        const revenue = ordersData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const funds = fundsCount || 0;

        const prevMonthUsers = usersPrevMonth || 0;
        const prevMonthBusinesses = businessesPrevMonth || 0;
        const prevMonthOrders = ordersPrevMonthData?.length || 0;
        const prevMonthRevenue = ordersPrevMonthData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const prevMonthFunds = fundsPrevMonth || 0;

        const prevYearUsers = usersPrevYear || 0;
        const prevYearBusinesses = businessesPrevYear || 0;
        const prevYearOrders = ordersPrevYearData?.length || 0;
        const prevYearRevenue = ordersPrevYearData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const prevYearFunds = fundsPrevYear || 0;

        const usersObjective = getObjective(month, 'users');
        const businessesObjective = getObjective(month, 'businesses');
        const revenueObjective = getObjective(month, 'revenue');
        const ordersObjective = getObjective(month, 'orders');
        const fundsObjective = getObjective(month, 'funds');

        monthlyData.push({
          month,
          year: currentYear,
          label: format(currentDate, 'MMMM', { locale: fr }),
          users,
          usersVariationM1: calculateVariation(users, prevMonthUsers),
          usersVariationY1: calculateVariation(users, prevYearUsers),
          usersObjective,
          usersVsObjective: calculateVsObjective(users, usersObjective),
          businesses,
          businessesVariationM1: calculateVariation(businesses, prevMonthBusinesses),
          businessesVariationY1: calculateVariation(businesses, prevYearBusinesses),
          businessesObjective,
          businessesVsObjective: calculateVsObjective(businesses, businessesObjective),
          revenue,
          revenueVariationM1: calculateVariation(revenue, prevMonthRevenue),
          revenueVariationY1: calculateVariation(revenue, prevYearRevenue),
          revenueObjective,
          revenueVsObjective: calculateVsObjective(revenue, revenueObjective),
          orders,
          ordersVariationM1: calculateVariation(orders, prevMonthOrders),
          ordersVariationY1: calculateVariation(orders, prevYearOrders),
          ordersObjective,
          ordersVsObjective: calculateVsObjective(orders, ordersObjective),
          funds,
          fundsVariationM1: calculateVariation(funds, prevMonthFunds),
          fundsVariationY1: calculateVariation(funds, prevYearFunds),
          fundsObjective,
          fundsVsObjective: calculateVsObjective(funds, fundsObjective)
        });
      }

      setMetrics(monthlyData);

      // Calculate yearly totals
      const yearTotals: YearlyTotals = {
        users: monthlyData.reduce((sum, m) => sum + m.users, 0),
        usersVariation: null,
        usersObjective: monthlyData.reduce((sum, m) => sum + (m.usersObjective || 0), 0),
        usersVsObjective: null,
        businesses: monthlyData.reduce((sum, m) => sum + m.businesses, 0),
        businessesVariation: null,
        businessesObjective: monthlyData.reduce((sum, m) => sum + (m.businessesObjective || 0), 0),
        businessesVsObjective: null,
        revenue: monthlyData.reduce((sum, m) => sum + m.revenue, 0),
        revenueVariation: null,
        revenueObjective: monthlyData.reduce((sum, m) => sum + (m.revenueObjective || 0), 0),
        revenueVsObjective: null,
        orders: monthlyData.reduce((sum, m) => sum + m.orders, 0),
        ordersVariation: null,
        ordersObjective: monthlyData.reduce((sum, m) => sum + (m.ordersObjective || 0), 0),
        ordersVsObjective: null,
        funds: monthlyData.reduce((sum, m) => sum + m.funds, 0),
        fundsVariation: null,
        fundsObjective: monthlyData.reduce((sum, m) => sum + (m.fundsObjective || 0), 0),
        fundsVsObjective: null
      };

      yearTotals.usersVsObjective = calculateVsObjective(yearTotals.users, yearTotals.usersObjective);
      yearTotals.businessesVsObjective = calculateVsObjective(yearTotals.businesses, yearTotals.businessesObjective);
      yearTotals.revenueVsObjective = calculateVsObjective(yearTotals.revenue, yearTotals.revenueObjective);
      yearTotals.ordersVsObjective = calculateVsObjective(yearTotals.orders, yearTotals.ordersObjective);
      yearTotals.fundsVsObjective = calculateVsObjective(yearTotals.funds, yearTotals.fundsObjective);

      setTotals(yearTotals);

    } catch (error) {
      console.error('Error fetching monthly comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [year]);

  return {
    metrics,
    totals,
    previousYearTotals,
    loading,
    refresh: fetchMetrics
  };
}
