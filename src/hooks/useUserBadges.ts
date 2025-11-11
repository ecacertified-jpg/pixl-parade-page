import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserBadge {
  id: string;
  badgeKey: string;
  earnedAt: string;
  progressValue: number;
  isShowcased: boolean;
  category: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  requirementType: string;
  requirementThreshold: number | null;
  colorPrimary: string;
  colorSecondary: string;
}

export const useUserBadges = (category?: string) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('user_badges_with_definitions')
          .select('*')
          .eq('user_id', user.id)
          .order('earned_at', { ascending: false });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (data) {
          setBadges(data.map(badge => ({
            id: badge.id,
            badgeKey: badge.badge_key,
            earnedAt: badge.earned_at,
            progressValue: badge.progress_value || 0,
            isShowcased: badge.is_showcased || false,
            category: badge.category,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            level: badge.level,
            requirementType: badge.requirement_type,
            requirementThreshold: badge.requirement_threshold,
            colorPrimary: badge.color_primary,
            colorSecondary: badge.color_secondary
          })));
        }
      } catch (err: any) {
        console.error('Error fetching badges:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();

    // Listen for new badges
    const channel = supabase
      .channel('user-badges-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, category]);

  const toggleShowcase = async (badgeId: string, showcase: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_badges')
        .update({ is_showcased: showcase })
        .eq('id', badgeId)
        .eq('user_id', user.id);

      if (error) throw error;

      setBadges(prev =>
        prev.map(badge =>
          badge.id === badgeId ? { ...badge, isShowcased: showcase } : badge
        )
      );
    } catch (err: any) {
      console.error('Error updating badge showcase:', err);
      throw err;
    }
  };

  return { badges, loading, error, toggleShowcase };
};
