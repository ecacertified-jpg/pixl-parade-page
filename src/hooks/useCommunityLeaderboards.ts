import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCountry } from '@/contexts/CountryContext';

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  badgeLevel: string;
  rankPosition: number | null;
  giftsGivenCount: number;
  fundsCreatedCount: number;
  postsCount: number;
}

export const useCommunityLeaderboards = (limit: number = 10) => {
  const { countryCode } = useCountry();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboards = async () => {
    try {
      const { data, error } = await supabase
        .from('community_scores')
        .select(`
          user_id,
          total_points,
          badge_level,
          rank_position,
          gifts_given_count,
          funds_created_count,
          posts_count
        `)
        .eq('country_code', countryCode)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch user names
      const userIds = data?.map(entry => entry.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const entries: LeaderboardEntry[] = (data || []).map(entry => {
        const profile = profiles?.find(p => p.user_id === entry.user_id);
        const userName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur'
          : 'Utilisateur';

        return {
          userId: entry.user_id,
          userName,
          totalPoints: entry.total_points,
          badgeLevel: entry.badge_level,
          rankPosition: entry.rank_position,
          giftsGivenCount: entry.gifts_given_count,
          fundsCreatedCount: entry.funds_created_count,
          postsCount: entry.posts_count
        };
      });

      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboards();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('community-scores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_scores'
        },
        () => loadLeaderboards()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, countryCode]);

  return { leaderboard, loading, refreshLeaderboards: loadLeaderboards };
};