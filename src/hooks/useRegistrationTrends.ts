import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, subMonths, subYears, format, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export type Granularity = 'day' | 'week' | 'month';

export interface TrendDataPoint {
  date: string;
  label: string;
  users: number;
  businesses: number;
  usersTotal: number;
  businessesTotal: number;
}

export interface RegistrationTrendsResult {
  data: TrendDataPoint[];
  loading: boolean;
  error: Error | null;
  totals: {
    users: number;
    businesses: number;
    usersGrowth: number;
    businessGrowth: number;
  };
  refetch: () => void;
}

interface UseRegistrationTrendsParams {
  startDate: Date;
  endDate: Date;
  granularity: Granularity;
}

export function useRegistrationTrends({ startDate, endDate, granularity }: UseRegistrationTrendsParams): RegistrationTrendsResult {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totals, setTotals] = useState({
    users: 0,
    businesses: 0,
    usersGrowth: 0,
    businessGrowth: 0,
  });

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate date intervals based on granularity
      const intervals = generateIntervals(startDate, endDate, granularity);
      
      // Calculate previous period for growth comparison
      const periodLength = endDate.getTime() - startDate.getTime();
      const prevStartDate = new Date(startDate.getTime() - periodLength);
      const prevEndDate = new Date(startDate.getTime() - 1);

      // Fetch all registrations in date range
      const [usersResponse, businessesResponse, prevUsersResponse, prevBusinessesResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('business_accounts')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString()),
        supabase
          .from('business_accounts')
          .select('created_at')
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString()),
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (businessesResponse.error) throw businessesResponse.error;

      const users = usersResponse.data || [];
      const businesses = businessesResponse.data || [];
      const prevUsers = prevUsersResponse.data || [];
      const prevBusinesses = prevBusinessesResponse.data || [];

      // Aggregate data by intervals
      const trendData: TrendDataPoint[] = [];
      let usersTotal = 0;
      let businessesTotal = 0;

      for (const interval of intervals) {
        const usersInInterval = users.filter(u => {
          const date = new Date(u.created_at);
          return date >= interval.start && date < interval.end;
        }).length;

        const businessesInInterval = businesses.filter(b => {
          const date = new Date(b.created_at);
          return date >= interval.start && date < interval.end;
        }).length;

        usersTotal += usersInInterval;
        businessesTotal += businessesInInterval;

        trendData.push({
          date: interval.start.toISOString(),
          label: formatIntervalLabel(interval.start, granularity),
          users: usersInInterval,
          businesses: businessesInInterval,
          usersTotal,
          businessesTotal,
        });
      }

      // Calculate growth percentages
      const currentPeriodUsers = users.length;
      const currentPeriodBusinesses = businesses.length;
      const previousPeriodUsers = prevUsers.length;
      const previousPeriodBusinesses = prevBusinesses.length;

      const usersGrowth = previousPeriodUsers > 0 
        ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
        : currentPeriodUsers > 0 ? 100 : 0;

      const businessGrowth = previousPeriodBusinesses > 0 
        ? ((currentPeriodBusinesses - previousPeriodBusinesses) / previousPeriodBusinesses) * 100 
        : currentPeriodBusinesses > 0 ? 100 : 0;

      setData(trendData);
      setTotals({
        users: currentPeriodUsers,
        businesses: currentPeriodBusinesses,
        usersGrowth: Math.round(usersGrowth),
        businessGrowth: Math.round(businessGrowth),
      });
    } catch (err) {
      console.error('Error fetching registration trends:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, granularity]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { data, loading, error, totals, refetch: fetchTrends };
}

function generateIntervals(startDate: Date, endDate: Date, granularity: Granularity) {
  const intervals: { start: Date; end: Date }[] = [];

  switch (granularity) {
    case 'day': {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      days.forEach((day, index) => {
        const nextDay = index < days.length - 1 ? days[index + 1] : new Date(day.getTime() + 86400000);
        intervals.push({ start: startOfDay(day), end: startOfDay(nextDay) });
      });
      break;
    }
    case 'week': {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      weeks.forEach((week, index) => {
        const nextWeek = index < weeks.length - 1 ? weeks[index + 1] : new Date(week.getTime() + 7 * 86400000);
        intervals.push({ start: startOfWeek(week, { weekStartsOn: 1 }), end: startOfWeek(nextWeek, { weekStartsOn: 1 }) });
      });
      break;
    }
    case 'month': {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      months.forEach((month, index) => {
        const nextMonth = index < months.length - 1 ? months[index + 1] : new Date(month.getFullYear(), month.getMonth() + 1, 1);
        intervals.push({ start: startOfMonth(month), end: startOfMonth(nextMonth) });
      });
      break;
    }
  }

  return intervals;
}

function formatIntervalLabel(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'day':
      return format(date, 'd MMM', { locale: fr });
    case 'week':
      return format(date, "'S'w", { locale: fr });
    case 'month':
      return format(date, 'MMM yyyy', { locale: fr });
    default:
      return format(date, 'd MMM', { locale: fr });
  }
}

// Helper function to get preset date ranges
export function getPresetDateRange(preset: '7d' | '30d' | '90d' | '1y'): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate: Date;

  switch (preset) {
    case '7d':
      startDate = subDays(endDate, 7);
      break;
    case '30d':
      startDate = subDays(endDate, 30);
      break;
    case '90d':
      startDate = subDays(endDate, 90);
      break;
    case '1y':
      startDate = subYears(endDate, 1);
      break;
    default:
      startDate = subDays(endDate, 30);
  }

  return { startDate, endDate };
}

// Helper function to get recommended granularity for a date range
export function getRecommendedGranularity(startDate: Date, endDate: Date): Granularity {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days <= 14) return 'day';
  if (days <= 90) return 'week';
  return 'month';
}
