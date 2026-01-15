import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCountry } from '@/contexts/CountryContext';

export interface CommunityStats {
  giftsThisWeek: number;
  birthdaysToday: number;
  activeFunds: number;
  activeUsers: number;
}

export const useCommunityStats = () => {
  const { effectiveCountryFilter } = useCountry();
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

      // Count gifts this week (filtered by country via collective_funds)
      const { count: giftsCount } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .gte('gift_date', weekStart.toISOString());

      // Count birthdays today (contacts with birthday today) - filtered by user's country if set
      const today = new Date();
      const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      let birthdaysCount = 0;
      if (effectiveCountryFilter) {
        // Get profiles from current country, then their contacts
        const { data: countryProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('country_code', effectiveCountryFilter);
        
        const countryUserIds = countryProfiles?.map(p => p.user_id) || [];
        
        if (countryUserIds.length > 0) {
          const { count } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .in('user_id', countryUserIds)
            .like('birthday', `%-${todayStr}`);
          birthdaysCount = count || 0;
        }
      } else {
        // All countries - count all birthdays
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .like('birthday', `%-${todayStr}`);
        birthdaysCount = count || 0;
      }

      // Count active funds - filtered by country if set
      let fundsQuery = supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (effectiveCountryFilter) {
        fundsQuery = fundsQuery.eq('country_code', effectiveCountryFilter);
      }
      
      const { count: fundsCount } = await fundsQuery;

      // Count active users this week (users who contributed)
      const { data: activeUsersData } = await supabase
        .from('fund_contributions')
        .select('contributor_id')
        .gte('created_at', weekStart.toISOString());

      // Filter by users in current country if set
      let activeUsersInCountry = 0;
      if (activeUsersData && activeUsersData.length > 0) {
        const contributorIds = [...new Set(activeUsersData.map(c => c.contributor_id))];
        
        if (effectiveCountryFilter) {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('user_id', contributorIds)
            .eq('country_code', effectiveCountryFilter);
          activeUsersInCountry = count || 0;
        } else {
          activeUsersInCountry = contributorIds.length;
        }
      }

      setStats({
        giftsThisWeek: giftsCount || 0,
        birthdaysToday: birthdaysCount,
        activeFunds: fundsCount || 0,
        activeUsers: activeUsersInCountry
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
  }, [effectiveCountryFilter]);

  return { stats, loading, refreshStats: loadStats };
};