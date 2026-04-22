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
  completedCount: number;
  totalCount: number;
}

const TARGET_WISHLIST = 3;
const TARGET_FRIENDS = 3;
const TARGET_SHARES = 3;

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

  const [favRes, circlesRes, pageRes, fundRes, shareRes] = await Promise.all([
    supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase.from('friend_circles').select('id').eq('user_id', userId),
    supabase
      .from('birthday_pages')
      .select('id, slug, published_at, published_via_onboarding, fund_id')
      .eq('user_id', userId)
      .eq('celebration_year', currentYear)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('collective_funds')
      .select('id')
      .eq('creator_id', userId)
      .eq('occasion', 'birthday')
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('onboarding_shares')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  let circleMemberCount = 0;
  const circleIds = (circlesRes.data || []).map((c: any) => c.id);
  if (circleIds.length > 0) {
    const { count } = await supabase
      .from('friend_circle_members')
      .select('*', { count: 'exact', head: true })
      .in('circle_id', circleIds);
    circleMemberCount = count || 0;
  }

  const wishlistCount = favRes.count || 0;
  const shareCount = shareRes.count || 0;
  const page = pageRes.data;
  const fund = fundRes.data;

  const wishlist: StepStatus = {
    done: wishlistCount >= TARGET_WISHLIST,
    value: wishlistCount,
    target: TARGET_WISHLIST,
  };
  const friends: StepStatus = {
    done: circleMemberCount >= TARGET_FRIENDS,
    value: circleMemberCount,
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

  const steps = { wishlist, friends, type, fund: fundStep, publish, share };
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
