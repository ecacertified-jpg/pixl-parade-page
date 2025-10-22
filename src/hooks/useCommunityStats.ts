import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityStats {
  giftsThisWeek: number;
  birthdaysToday: number;
  activeFunds: number;
  activeUsers: number;
}

export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats>({
    giftsThisWeek: 0,
    birthdaysToday: 0,
    activeFunds: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // Count gifts this week
      const { count: giftsCount } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .gte('gift_date', weekStart.toISOString());

      // Count birthdays today (contacts with birthday today)
      const today = new Date();
      const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const { count: birthdaysCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .like('birthday', `%-${todayStr}`);

      // Count active funds
      const { count: fundsCount } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Count active users this week (users who contributed or created something)
      const { data: activeUsersData } = await supabase
        .from('fund_contributions')
        .select('contributor_id')
        .gte('created_at', weekStart.toISOString());

      const uniqueUsers = new Set(activeUsersData?.map(c => c.contributor_id) || []);

      setStats({
        giftsThisWeek: giftsCount || 0,
        birthdaysToday: birthdaysCount || 0,
        activeFunds: fundsCount || 0,
        activeUsers: uniqueUsers.size
      });
    } catch (error) {
      console.error('Error loading community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(loadStats, 300000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refreshStats: loadStats };
};