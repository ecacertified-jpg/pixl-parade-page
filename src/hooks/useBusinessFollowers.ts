import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { startOfDay, startOfWeek, subDays, format } from 'date-fns';

interface FollowerStats {
  totalFollowers: number;
  newThisWeek: number;
  newToday: number;
  weeklyGrowthPercent: number;
  growthData: Array<{ date: string; count: number }>;
}

interface Follower {
  id: string;
  followerId: string;
  followerName: string;
  followerAvatar: string | null;
  followedAt: string;
}

interface UseBusinessFollowersReturn {
  stats: FollowerStats;
  recentFollowers: Follower[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBusinessFollowers(businessId: string | null | undefined): UseBusinessFollowersReturn {
  const [stats, setStats] = useState<FollowerStats>({
    totalFollowers: 0,
    newThisWeek: 0,
    newToday: 0,
    weeklyGrowthPercent: 0,
    growthData: []
  });
  const [recentFollowers, setRecentFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const twoWeeksAgo = subDays(now, 14);

      // Fetch all followers with profile info
      const { data: followsData, error: followsError } = await supabase
        .from('business_follows')
        .select(`
          id,
          follower_id,
          created_at,
          profiles:follower_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;

      const follows = followsData || [];
      const totalFollowers = follows.length;

      // Calculate new this week
      const newThisWeek = follows.filter(f => 
        new Date(f.created_at) >= weekStart
      ).length;

      // Calculate new today
      const newToday = follows.filter(f => 
        new Date(f.created_at) >= todayStart
      ).length;

      // Calculate weekly growth (compare this week vs last week)
      const lastWeekStart = subDays(weekStart, 7);
      const newLastWeek = follows.filter(f => {
        const date = new Date(f.created_at);
        return date >= lastWeekStart && date < weekStart;
      }).length;
      
      const weeklyGrowthPercent = newLastWeek > 0 
        ? Math.round(((newThisWeek - newLastWeek) / newLastWeek) * 100)
        : newThisWeek > 0 ? 100 : 0;

      // Build growth data for last 7 days
      const growthData: Array<{ date: string; count: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day);
        const dayEnd = startOfDay(subDays(day, -1));
        
        const count = follows.filter(f => {
          const date = new Date(f.created_at);
          return date >= dayStart && date < dayEnd;
        }).length;

        growthData.push({
          date: format(day, 'EEE'),
          count
        });
      }

      setStats({
        totalFollowers,
        newThisWeek,
        newToday,
        weeklyGrowthPercent,
        growthData
      });

      // Map recent followers (top 5)
      const recent: Follower[] = follows.slice(0, 5).map(f => {
        const profile = f.profiles as { first_name?: string; last_name?: string; avatar_url?: string } | null;
        return {
          id: f.id,
          followerId: f.follower_id,
          followerName: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur'
            : 'Utilisateur',
          followerAvatar: profile?.avatar_url || null,
          followedAt: f.created_at
        };
      });

      setRecentFollowers(recent);
    } catch (err) {
      console.error('Error fetching business followers:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch followers'));
      toast.error('Erreur lors du chargement des abonnés');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time subscription
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel(`business-followers-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_follows',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchData]);

  return {
    stats,
    recentFollowers,
    loading,
    error,
    refetch: fetchData
  };
}
