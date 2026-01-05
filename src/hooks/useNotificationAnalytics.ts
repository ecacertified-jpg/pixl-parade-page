import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CategoryStats {
  category: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface DailyStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  openRate: number;
}

interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  totalConversionValue: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  byCategory: CategoryStats[];
  dailyStats: DailyStats[];
}

export type Period = 'today' | '7days' | '30days' | '90days';

export function useNotificationAnalytics(period: Period = '30days') {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getDateRange = useCallback(() => {
    const now = new Date();
    const end = now.toISOString();
    let start: Date;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start: start.toISOString(), end };
  }, [period]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();

      // Fetch all analytics data for the period
      const { data: analyticsData, error: fetchError } = await supabase
        .from('notification_analytics')
        .select('*')
        .gte('sent_at', start)
        .lte('sent_at', end)
        .order('sent_at', { ascending: false });

      if (fetchError) throw fetchError;

      const data = analyticsData || [];

      // Calculate totals
      const totalSent = data.length;
      const totalDelivered = data.filter(d => d.delivered_at).length;
      const totalOpened = data.filter(d => d.opened_at).length;
      const totalClicked = data.filter(d => d.clicked_at).length;
      const totalConverted = data.filter(d => d.converted_at).length;
      const totalConversionValue = data
        .filter(d => d.conversion_value)
        .reduce((sum, d) => sum + (d.conversion_value || 0), 0);

      // Calculate rates
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      const conversionRate = totalClicked > 0 ? (totalConverted / totalClicked) * 100 : 0;

      // Group by category
      const categoryMap = new Map<string, { sent: number; delivered: number; opened: number; clicked: number; converted: number }>();
      
      data.forEach(item => {
        const category = item.category || 'other';
        const current = categoryMap.get(category) || { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 };
        current.sent++;
        if (item.delivered_at) current.delivered++;
        if (item.opened_at) current.opened++;
        if (item.clicked_at) current.clicked++;
        if (item.converted_at) current.converted++;
        categoryMap.set(category, current);
      });

      const byCategory: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        ...stats,
        openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
        clickRate: stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0,
        conversionRate: stats.clicked > 0 ? (stats.converted / stats.clicked) * 100 : 0,
      })).sort((a, b) => b.sent - a.sent);

      // Group by day
      const dailyMap = new Map<string, { sent: number; delivered: number; opened: number; clicked: number }>();
      
      data.forEach(item => {
        const date = new Date(item.sent_at).toISOString().split('T')[0];
        const current = dailyMap.get(date) || { sent: 0, delivered: 0, opened: 0, clicked: 0 };
        current.sent++;
        if (item.delivered_at) current.delivered++;
        if (item.opened_at) current.opened++;
        if (item.clicked_at) current.clicked++;
        dailyMap.set(date, current);
      });

      const dailyStats: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({
          date,
          ...stats,
          openRate: stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setStats({
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalConverted,
        totalConversionValue,
        deliveryRate,
        openRate,
        clickRate,
        conversionRate,
        byCategory,
        dailyStats,
      });

    } catch (err) {
      console.error('Error fetching notification analytics:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
