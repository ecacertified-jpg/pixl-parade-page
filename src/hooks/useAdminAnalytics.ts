import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Period = 'today' | '7days' | '30days' | '90days' | 'year';

interface AnalyticsData {
  usersEvolution: { date: string; count: number }[];
  fundsCreated: { date: string; count: number }[];
  amountsCollected: { date: string; amount: number }[];
  topCategories: { category: string; count: number }[];
  totalUsers: number;
  totalFunds: number;
  totalAmount: number;
  activeBusinesses: number;
}

export function useAdminAnalytics(period: Period) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAnalytics();
  }, [period]);
  
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  };
  
  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      const { startDate, endDate } = getDateRange();
      
      // Fetch users evolution
      const { data: usersData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      // Fetch funds created
      const { data: fundsData } = await supabase
        .from('collective_funds')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      // Fetch contributions
      const { data: contributionsData } = await supabase
        .from('fund_contributions')
        .select('created_at, amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      // Fetch top categories from products
      const { data: categoriesData } = await supabase
        .from('products')
        .select('category_id, categories(name)')
        .not('category_id', 'is', null);
      
      // Fetch totals
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: totalFunds } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true });
      
      const { data: totalAmountData } = await supabase
        .from('fund_contributions')
        .select('amount');
      
      const { count: activeBusinesses } = await supabase
        .from('business_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Process data
      const usersEvolution = processTimeSeriesData(usersData || [], 'created_at');
      const fundsCreated = processTimeSeriesData(fundsData || [], 'created_at');
      const amountsCollected = processAmountData(contributionsData || []);
      const topCategories = processCategories(categoriesData || []);
      const totalAmount = totalAmountData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      
      setData({
        usersEvolution,
        fundsCreated,
        amountsCollected,
        topCategories,
        totalUsers: totalUsers || 0,
        totalFunds: totalFunds || 0,
        totalAmount,
        activeBusinesses: activeBusinesses || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const processTimeSeriesData = (data: any[], dateField: string) => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toLocaleDateString('fr-FR');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([date, count]) => ({ date, count: count as number }));
  };
  
  const processAmountData = (data: any[]) => {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString('fr-FR');
      acc[date] = (acc[date] || 0) + Number(item.amount);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount: amount as number }));
  };
  
  const processCategories = (data: any[]) => {
    const grouped = data.reduce((acc, item) => {
      const category = item.categories?.name || 'Non catégorisé';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([category, count]) => ({ category, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);
  };
  
  return { data, loading, refresh: fetchAnalytics };
}
