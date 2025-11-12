import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSuggestion {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  mutual_follows_count: number;
  common_occasions: string[];
  total_gifts_given: number;
  reason: string;
}

export function useUserSuggestions(limit: number = 5) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchSuggestions();
  }, [user?.id]);

  const fetchSuggestions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get users already followed
      const { data: followedUsers } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followedUserIds = followedUsers?.map(f => f.following_id) || [];

      // Get users that my followed users are following (friends of friends)
      const { data: friendsOfFriends } = await supabase
        .from('user_follows')
        .select('following_id')
        .in('follower_id', followedUserIds)
        .not('following_id', 'in', `(${[user.id, ...followedUserIds].join(',')})`);

      // Count mutual follows
      const mutualFollowsMap = new Map<string, number>();
      friendsOfFriends?.forEach(follow => {
        const count = mutualFollowsMap.get(follow.following_id) || 0;
        mutualFollowsMap.set(follow.following_id, count + 1);
      });

      // Get users' occasions from posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select('user_id, occasion')
        .not('user_id', 'in', `(${[user.id, ...followedUserIds].join(',')})`)
        .not('occasion', 'is', null);

      // Get current user's occasions
      const { data: myPosts } = await supabase
        .from('posts')
        .select('occasion')
        .eq('user_id', user.id)
        .not('occasion', 'is', null);

      const myOccasions = [...new Set(myPosts?.map(p => p.occasion).filter(Boolean))];

      // Map users to their occasions
      const userOccasionsMap = new Map<string, Set<string>>();
      userPosts?.forEach(post => {
        if (!post.occasion) return;
        const occasions = userOccasionsMap.get(post.user_id) || new Set();
        occasions.add(post.occasion);
        userOccasionsMap.set(post.user_id, occasions);
      });

      // Get users' gift activity
      const { data: giftActivity } = await supabase
        .from('post_reactions')
        .select('user_id')
        .eq('reaction_type', 'gift')
        .not('user_id', 'in', `(${[user.id, ...followedUserIds].join(',')})`);

      const giftCountMap = new Map<string, number>();
      giftActivity?.forEach(activity => {
        const count = giftCountMap.get(activity.user_id) || 0;
        giftCountMap.set(activity.user_id, count + 1);
      });

      // Combine all user IDs
      const allUserIds = [
        ...Array.from(mutualFollowsMap.keys()),
        ...Array.from(userOccasionsMap.keys()),
        ...Array.from(giftCountMap.keys())
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      if (uniqueUserIds.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url, bio')
        .in('user_id', uniqueUserIds);

      // Build suggestions with scoring
      const suggestionsWithScores = profiles?.map(profile => {
        const mutualFollowsCount = mutualFollowsMap.get(profile.user_id) || 0;
        const userOccasions = Array.from(userOccasionsMap.get(profile.user_id) || []);
        const commonOccasions = userOccasions.filter(o => myOccasions.includes(o));
        const giftsGiven = giftCountMap.get(profile.user_id) || 0;
        const hasCompleteProfile = profile.avatar_url && profile.bio;

        // Calculate score for sorting
        const score = (mutualFollowsCount * 3) + (commonOccasions.length * 2) + (giftsGiven * 1) + (hasCompleteProfile ? 1 : 0);

        // Determine reason
        let reason = '';
        if (mutualFollowsCount > 0 && commonOccasions.length > 0) {
          reason = `Suivi par vos amis • Intérêts similaires`;
        } else if (mutualFollowsCount > 0) {
          reason = `Suivi par ${mutualFollowsCount} de vos ami${mutualFollowsCount > 1 ? 's' : ''}`;
        } else if (commonOccasions.length > 0) {
          reason = `Intérêts similaires : ${commonOccasions.join(', ')}`;
        } else if (giftsGiven > 0) {
          reason = `Membre actif de la communauté`;
        } else if (hasCompleteProfile) {
          reason = 'Profil complet';
        } else {
          reason = 'Suggéré pour vous';
        }

        return {
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          mutual_follows_count: mutualFollowsCount,
          common_occasions: commonOccasions,
          total_gifts_given: giftsGiven,
          reason,
          score
        };
      }) || [];

      // Sort by score and take top N
      const topSuggestions = suggestionsWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      setSuggestions(topSuggestions);
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    refreshSuggestions: fetchSuggestions
  };
}
