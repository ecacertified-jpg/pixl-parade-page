import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FRIEND_CIRCLE_BADGES, FriendCircleBadge } from '@/components/FriendsCircleBadgeCelebration';

const CELEBRATED_BADGES_KEY = 'celebrated_friend_circle_badges';

export function useFriendsCircleBadgeCelebration() {
  const { user } = useAuth();
  const [celebrationBadge, setCelebrationBadge] = useState<FriendCircleBadge | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get list of badge keys we care about
  const friendCircleBadgeKeys = FRIEND_CIRCLE_BADGES.map(b => b.key);

  // Get celebrated badges from localStorage
  const getCelebratedBadges = useCallback((): string[] => {
    if (!user) return [];
    try {
      const stored = localStorage.getItem(`${CELEBRATED_BADGES_KEY}_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [user]);

  // Mark badge as celebrated
  const markBadgeCelebrated = useCallback((badgeKey: string) => {
    if (!user) return;
    const celebrated = getCelebratedBadges();
    if (!celebrated.includes(badgeKey)) {
      celebrated.push(badgeKey);
      localStorage.setItem(
        `${CELEBRATED_BADGES_KEY}_${user.id}`, 
        JSON.stringify(celebrated)
      );
    }
  }, [user, getCelebratedBadges]);

  // Check for uncelebrated badges and trigger celebration
  const checkForNewBadge = useCallback((badgeKey: string) => {
    const celebrated = getCelebratedBadges();
    
    if (friendCircleBadgeKeys.includes(badgeKey) && !celebrated.includes(badgeKey)) {
      const badge = FRIEND_CIRCLE_BADGES.find(b => b.key === badgeKey);
      if (badge) {
        setCelebrationBadge(badge);
        setIsOpen(true);
        markBadgeCelebrated(badgeKey);
      }
    }
  }, [friendCircleBadgeKeys, getCelebratedBadges, markBadgeCelebrated]);

  // Close celebration
  const closeCelebration = useCallback(() => {
    setIsOpen(false);
    // Small delay before clearing badge to allow exit animation
    setTimeout(() => setCelebrationBadge(null), 300);
  }, []);

  // Listen for realtime badge insertions
  useEffect(() => {
    if (!user) return;

    // Check for existing uncelebrated badges on mount
    const checkExistingBadges = async () => {
      const { data: badges } = await supabase
        .from('user_badges')
        .select('badge_key')
        .eq('user_id', user.id);
      
      if (badges) {
        const celebrated = getCelebratedBadges();
        for (const badge of badges) {
          if (
            friendCircleBadgeKeys.includes(badge.badge_key) && 
            !celebrated.includes(badge.badge_key)
          ) {
            // Found an uncelebrated badge, trigger celebration
            checkForNewBadge(badge.badge_key);
            break; // Only celebrate one at a time
          }
        }
      }
    };

    checkExistingBadges();

    // Subscribe to realtime insertions
    const channel = supabase
      .channel('friend-circle-badges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newBadgeKey = payload.new?.badge_key;
          if (newBadgeKey) {
            checkForNewBadge(newBadgeKey);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendCircleBadgeKeys, getCelebratedBadges, checkForNewBadge]);

  return {
    celebrationBadge,
    isOpen,
    closeCelebration
  };
}
