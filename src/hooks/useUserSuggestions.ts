import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { getDaysUntilBirthday } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

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

interface ScoredSuggestion extends UserSuggestion {
  score: number;
}

const fetchUserSuggestions = async (
  userId: string,
  countryFilter: string | null,
  limit: number
): Promise<UserSuggestion[]> => {
  // Batch 1: parallel independent queries
  const [profileRes, followedRes] = await Promise.all([
    supabase.from('profiles').select('city').eq('user_id', userId).single(),
    supabase.from('user_follows').select('following_id').eq('follower_id', userId),
  ]);

  const myCity = profileRes.data?.city;
  const followedUserIds = followedRes.data?.map(f => f.following_id) || [];
  const excludeList = [userId, ...followedUserIds];
  const excludeFilter = `(${excludeList.join(',')})`;

  // Batch 2: queries that depend on excludeList/followedUserIds
  const [friendsOfFriendsRes, userPostsRes, myPostsRes, giftActivityRes, sameCityRes] =
    await Promise.all([
      followedUserIds.length > 0
        ? supabase.from('user_follows').select('following_id')
            .in('follower_id', followedUserIds)
            .not('following_id', 'in', excludeFilter)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('posts').select('user_id, occasion')
        .not('user_id', 'in', excludeFilter)
        .not('occasion', 'is', null),
      supabase.from('posts').select('occasion')
        .eq('user_id', userId)
        .not('occasion', 'is', null),
      supabase.from('post_reactions').select('user_id')
        .eq('reaction_type', 'gift')
        .not('user_id', 'in', excludeFilter),
      myCity
        ? supabase.from('profiles').select('user_id')
            .eq('city', myCity)
            .not('user_id', 'in', excludeFilter)
            .limit(20)
        : Promise.resolve({ data: [] as any[] }),
    ]);

  // Build maps
  const mutualFollowsMap = new Map<string, number>();
  (friendsOfFriendsRes.data || []).forEach((f: any) => {
    mutualFollowsMap.set(f.following_id, (mutualFollowsMap.get(f.following_id) || 0) + 1);
  });

  const myOccasions = [...new Set((myPostsRes.data || []).map((p: any) => p.occasion).filter(Boolean))];

  const userOccasionsMap = new Map<string, Set<string>>();
  (userPostsRes.data || []).forEach((post: any) => {
    if (!post.occasion) return;
    const occasions = userOccasionsMap.get(post.user_id) || new Set();
    occasions.add(post.occasion);
    userOccasionsMap.set(post.user_id, occasions);
  });

  const giftCountMap = new Map<string, number>();
  (giftActivityRes.data || []).forEach((a: any) => {
    giftCountMap.set(a.user_id, (giftCountMap.get(a.user_id) || 0) + 1);
  });

  const sameCityUserIds = (sameCityRes.data || []).map((u: any) => u.user_id);

  // Combine all candidate user IDs
  const allUserIds = [
    ...Array.from(mutualFollowsMap.keys()),
    ...Array.from(userOccasionsMap.keys()),
    ...Array.from(giftCountMap.keys()),
    ...sameCityUserIds,
  ];
  const uniqueUserIds = [...new Set(allUserIds)];

  if (uniqueUserIds.length === 0) return [];

  // Fetch profiles
  let profilesQuery = supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar_url, bio, country_code, city, birthday')
    .in('user_id', uniqueUserIds);

  if (countryFilter) {
    profilesQuery = profilesQuery.eq('country_code', countryFilter);
  }

  const { data: profiles } = await profilesQuery;

  // Score and rank
  const scored: ScoredSuggestion[] = (profiles || []).map(profile => {
    const mutualFollowsCount = mutualFollowsMap.get(profile.user_id) || 0;
    const userOccasions = Array.from(userOccasionsMap.get(profile.user_id) || []);
    const commonOccasions = userOccasions.filter(o => myOccasions.includes(o));
    const giftsGiven = giftCountMap.get(profile.user_id) || 0;
    const hasCompleteProfile = profile.avatar_url && profile.bio;
    const isSameCity = !!(myCity && profile.city && profile.city === myCity);
    const daysUntil = getDaysUntilBirthday(profile.birthday);
    const hasUpcomingBirthday = daysUntil > 0 && daysUntil <= 30;

    let score = (mutualFollowsCount * 3) + (commonOccasions.length * 2) + giftsGiven + (hasCompleteProfile ? 1 : 0);
    if (isSameCity) score += 2;
    if (hasUpcomingBirthday) score += daysUntil <= 14 ? 3 : 2;

    const reasons: string[] = [];
    if (mutualFollowsCount > 0) reasons.push(`Suivi par ${mutualFollowsCount} de vos ami${mutualFollowsCount > 1 ? 's' : ''}`);
    if (commonOccasions.length > 0) reasons.push('Intérêts similaires');
    if (isSameCity) reasons.push(`Habite à ${profile.city} comme vous`);
    if (hasUpcomingBirthday) reasons.push(`Anniversaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`);
    if (reasons.length === 0) {
      if (giftsGiven > 0) reasons.push('Membre actif de la communauté');
      else if (hasCompleteProfile) reasons.push('Profil complet');
      else reasons.push('Suggéré pour vous');
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
      score,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};

// Prefetch function for use in Index.tsx
export const prefetchUserSuggestions = (userId: string, countryFilter: string | null = null) =>
  fetchUserSuggestions(userId, countryFilter, 5);

export function useUserSuggestions(limit: number = 5) {
  const { user } = useAuth();
  const { effectiveCountryFilter } = useCountry();

  const { data: suggestions = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['user-suggestions', user?.id, effectiveCountryFilter, limit],
    queryFn: () => fetchUserSuggestions(user!.id, effectiveCountryFilter, limit),
    enabled: !!user?.id,
    staleTime: 60_000,
    gcTime: 600_000,
    placeholderData: (prev) => prev,
  });

  return {
    suggestions,
    loading,
    refreshSuggestions: refetch,
  };
}
