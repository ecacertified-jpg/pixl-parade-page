import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { getDaysUntilBirthday } from '@/lib/utils';

export interface UserSuggestion {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country_code: string | null;
  city: string | null;
  days_until_birthday: number | null;
  mutual_follows_count: number;
  common_occasions: string[];
  total_gifts_given: number;
  reason: string;
}

export function useUserSuggestions(limit: number = 5) {
  const { user } = useAuth();
  const { effectiveCountryFilter } = useCountry();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchSuggestions();
  }, [user?.id, effectiveCountryFilter]);

  const fetchSuggestions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get current user's profile (city)
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('city')
        .eq('user_id', user.id)
        .single();

      // Get users already followed
      const { data: followedUsers } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followedUserIds = followedUsers?.map(f => f.following_id) || [];
      const excludeList = [user.id, ...followedUserIds];
      const excludeFilter = `(${excludeList.join(',')})`;

      // Get users that my followed users are following (friends of friends)
      const { data: friendsOfFriends } = await supabase
        .from('user_follows')
        .select('following_id')
        .in('follower_id', followedUserIds)
        .not('following_id', 'in', excludeFilter);

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
        .not('user_id', 'in', excludeFilter)
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
        .not('user_id', 'in', excludeFilter);

      const giftCountMap = new Map<string, number>();
      giftActivity?.forEach(activity => {
        const count = giftCountMap.get(activity.user_id) || 0;
        giftCountMap.set(activity.user_id, count + 1);
      });

      // Same city users
      const sameCityUserIds: string[] = [];
      if (myProfile?.city) {
        const { data: sameCityUsers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('city', myProfile.city)
          .not('user_id', 'in', excludeFilter)
          .limit(20);
        sameCityUsers?.forEach(u => sameCityUserIds.push(u.user_id));
      }

      // Combine all user IDs
      const allUserIds = [
        ...Array.from(mutualFollowsMap.keys()),
        ...Array.from(userOccasionsMap.keys()),
        ...Array.from(giftCountMap.keys()),
        ...sameCityUserIds
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      if (uniqueUserIds.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url, bio, country_code, city, birthday')
        .in('user_id', uniqueUserIds);
      
      if (effectiveCountryFilter) {
        profilesQuery = profilesQuery.eq('country_code', effectiveCountryFilter);
      }
      
      const { data: profiles } = await profilesQuery;

      // Build suggestions with scoring
      const suggestionsWithScores = profiles?.map(profile => {
        const mutualFollowsCount = mutualFollowsMap.get(profile.user_id) || 0;
        const userOccasions = Array.from(userOccasionsMap.get(profile.user_id) || []);
        const commonOccasions = userOccasions.filter(o => myOccasions.includes(o));
        const giftsGiven = giftCountMap.get(profile.user_id) || 0;
        const hasCompleteProfile = profile.avatar_url && profile.bio;
        const isSameCity = !!(myProfile?.city && profile.city && profile.city === myProfile.city);
        const daysUntil = getDaysUntilBirthday(profile.birthday);
        const hasUpcomingBirthday = daysUntil > 0 && daysUntil <= 30;

        // Calculate score
        let score = (mutualFollowsCount * 3) + (commonOccasions.length * 2) + (giftsGiven * 1) + (hasCompleteProfile ? 1 : 0);
        if (isSameCity) score += 2;
        if (hasUpcomingBirthday) score += daysUntil <= 14 ? 3 : 2;

        // Determine reason
        const reasons: string[] = [];
        if (mutualFollowsCount > 0) {
          reasons.push(`Suivi par ${mutualFollowsCount} de vos ami${mutualFollowsCount > 1 ? 's' : ''}`);
        }
        if (commonOccasions.length > 0) {
          reasons.push(`Intérêts similaires`);
        }
        if (isSameCity) {
          reasons.push(`Habite à ${profile.city} comme vous`);
        }
        if (hasUpcomingBirthday) {
          reasons.push(`Anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`);
        }
        if (reasons.length === 0) {
          if (giftsGiven > 0) {
            reasons.push('Membre actif de la communauté');
          } else if (hasCompleteProfile) {
            reasons.push('Profil complet');
          } else {
            reasons.push('Suggéré pour vous');
          }
        }

        return {
          user_id: profile.user_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          country_code: profile.country_code,
          city: profile.city,
          days_until_birthday: hasUpcomingBirthday ? daysUntil : null,
          mutual_follows_count: mutualFollowsCount,
          common_occasions: commonOccasions,
          total_gifts_given: giftsGiven,
          reason: reasons.join(' • '),
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
