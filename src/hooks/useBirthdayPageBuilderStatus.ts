import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type PageType = 'self' | 'friend' | 'other_event';

export interface StepStatus {
  done: boolean;
  value?: number;
  target?: number;
}

export interface BirthdayPageBuilderStatus {
  steps: {
    wishlist: StepStatus;
    friends: StepStatus;
    type: StepStatus;
    fund: StepStatus;
    publish: StepStatus;
    share: StepStatus;
  };
  pageType: PageType | null;
  birthdayPageSlug: string | null;
  birthdayPageId: string | null;
  hasFund: boolean;
  fundId: string | null;
  fundTargetAmount: number | null;
  fundContributionsCount: number;
  completedCount: number;
  totalCount: number;
}

const TARGET_WISHLIST = 3;
const TARGET_FRIENDS = 1;
const TARGET_SHARES = 3;

const friendsLsKey = (userId: string) => `bp_friends_${userId}`;

export const getStoredFriendSelection = (userId: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(friendsLsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const setStoredFriendSelection = (userId: string, ids: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(friendsLsKey(userId), JSON.stringify(ids));
};

const fetchStatus = async (userId: string): Promise<BirthdayPageBuilderStatus> => {
  const currentYear = new Date().getFullYear();
  const lsKey = `bp_type_${userId}`;
  const storedType = (typeof window !== 'undefined'
    ? (localStorage.getItem(lsKey) as PageType | null)
    : null);
  const pageType: PageType | null =
    storedType === 'self' || storedType === 'friend' || storedType === 'other_event'
      ? storedType
      : null;

  const [favRes, pageRes, shareRes] = await Promise.all([
    supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('birthday_pages')
      .select('id, slug, published_at, published_via_onboarding, fund_id')
      .eq('user_id', userId)
      .eq('celebration_year', currentYear)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('onboarding_shares')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  const wishlistCount = favRes.count || 0;
  const shareCount = shareRes.count || 0;
  const page = pageRes.data;

  // Strict fund detection: only the fund explicitly linked to this year's page
  let fund: { id: string; target_amount: number | null } | null = null;
  let fundContributionsCount = 0;
  if (page?.fund_id) {
    const { data: linkedFund } = await supabase
      .from('collective_funds')
      .select('id, target_amount, status')
      .eq('id', page.fund_id)
      .eq('status', 'active')
      .maybeSingle();
    if (linkedFund) {
      fund = { id: linkedFund.id, target_amount: linkedFund.target_amount };
      const { count } = await supabase
        .from('fund_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('fund_id', linkedFund.id);
      fundContributionsCount = count || 0;
    }
  }

  // Friend association: count actual associated friends if page exists,
  // otherwise fall back to localStorage selection.
  let associatedFriendsCount = 0;
  if (page?.id) {
    const { count } = await supabase
      .from('birthday_page_friends')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', page.id);
    associatedFriendsCount = count || 0;
  }
  if (associatedFriendsCount === 0) {
    associatedFriendsCount = getStoredFriendSelection(userId).length;
  }

  const wishlist: StepStatus = {
    done: wishlistCount >= TARGET_WISHLIST,
    value: wishlistCount,
    target: TARGET_WISHLIST,
  };
  const friends: StepStatus = {
    done: associatedFriendsCount >= TARGET_FRIENDS,
    value: associatedFriendsCount,
    target: TARGET_FRIENDS,
  };
  const type: StepStatus = { done: pageType !== null };
  const fundDone = !!fund;
  const fundStep: StepStatus = { done: fundDone };
  const publish: StepStatus = {
    done: !!page && !!page.published_at && page.published_via_onboarding === true,
  };
  const share: StepStatus = {
    done: shareCount >= TARGET_SHARES,
    value: shareCount,
    target: TARGET_SHARES,
  };

  // Order: wishlist → type → friends → fund → publish → share
  const steps = { wishlist, type, friends, fund: fundStep, publish, share };
  const completedCount = Object.values(steps).filter((s) => s.done).length;

  return {
    steps,
    pageType,
    birthdayPageSlug: page?.slug ?? null,
    birthdayPageId: page?.id ?? null,
    hasFund: fundDone,
    fundId: fund?.id ?? null,
    completedCount,
    totalCount: 6,
  };
};

export function useBirthdayPageBuilderStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bp-builder', user?.id],
    queryFn: () => fetchStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const setPageType = useCallback(
    (type: PageType) => {
      if (!user?.id) return;
      localStorage.setItem(`bp_type_${user.id}`, type);
      queryClient.invalidateQueries({ queryKey: ['bp-builder', user.id] });
    },
    [user?.id, queryClient],
  );

  const invalidate = useCallback(() => {
    if (!user?.id) return;
    queryClient.invalidateQueries({ queryKey: ['bp-builder', user.id] });
  }, [user?.id, queryClient]);

  return {
    status: data,
    isLoading,
    refetch,
    setPageType,
    invalidate,
  };
}
