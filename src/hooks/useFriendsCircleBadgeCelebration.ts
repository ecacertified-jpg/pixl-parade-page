import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FRIEND_CIRCLE_BADGES, FriendCircleBadge } from '@/components/FriendsCircleBadgeCelebration';

const CELEBRATED_BADGES_KEY = 'celebrated_friend_circle_badges';

// Static list - computed once outside component
const FRIEND_CIRCLE_BADGE_KEYS = FRIEND_CIRCLE_BADGES.map(b => b.key);

let channelCounter = 0;

export function useFriendsCircleBadgeCelebration() {
  const { user } = useAuth();
  const [celebrationBadge, setCelebrationBadge] = useState<FriendCircleBadge | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  // Stable functions using refs - no useCallback needed
  const getCelebratedBadges = useCallback((): string[] => {
    const uid = userIdRef.current;
    if (!uid) return [];
    try {
      const stored = localStorage.getItem(`${CELEBRATED_BADGES_KEY}_${uid}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable - reads uid from ref

  const markBadgeCelebrated = useCallback((badgeKey: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    const celebrated = getCelebratedBadges();
    if (!celebrated.includes(badgeKey)) {
      celebrated.push(badgeKey);
      localStorage.setItem(`${CELEBRATED_BADGES_KEY}_${uid}`, JSON.stringify(celebrated));
    }
  }, [getCelebratedBadges]);

  const checkForNewBadge = useCallback((badgeKey: string) => {
    const celebrated = getCelebratedBadges();
    if (FRIEND_CIRCLE_BADGE_KEYS.includes(badgeKey) && !celebrated.includes(badgeKey)) {
      const badge = FRIEND_CIRCLE_BADGES.find(b => b.key === badgeKey);
      if (badge) {
        setCelebrationBadge(badge);
        setIsOpen(true);
        markBadgeCelebrated(badgeKey);
      }
    }
  }, [getCelebratedBadges, markBadgeCelebrated]);

  const closeCelebration = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setCelebrationBadge(null), 300);
  }, []);

  // Main effect - depends only on user?.id
  useEffect(() => {
    if (!user?.id) return;

    const checkExistingBadges = async () => {
      const { data: badges } = await supabase
        .from('user_badges')
        .select('badge_key')
        .eq('user_id', user.id);
      
      if (badges) {
        const celebrated = getCelebratedBadges();
        for (const badge of badges) {
          if (
            FRIEND_CIRCLE_BADGE_KEYS.includes(badge.badge_key) && 
            !celebrated.includes(badge.badge_key)
          ) {
            checkForNewBadge(badge.badge_key);
            break;
          }
        }
      }
    };

    checkExistingBadges();

    const channelName = `friend-circle-badges-${user.id}-${++channelCounter}`;
    const channel = supabase
      .channel(channelName)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    celebrationBadge,
    isOpen,
    closeCelebration
  };
}
