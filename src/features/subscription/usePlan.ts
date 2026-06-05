import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  FeatureFlag,
  FeatureKey,
  PLAN_ORDER,
  PlanTier,
  SubscriptionPlan,
  UserSubscription,
  isPlanAtLeast,
} from './types';

interface PlanContext {
  tier: PlanTier;
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  allPlans: SubscriptionPlan[];
  /** Limite numérique (-1 = illimité, 0 = bloqué). */
  getLimit: (feature: FeatureKey) => number;
  /** Feature qualitative (booléen / string). */
  getFeature: <T = unknown>(flag: FeatureFlag) => T | undefined;
  /** Le plan courant atteint-il (au moins) le palier demandé ? */
  isAtLeast: (required: PlanTier) => boolean;
}

const FREE_FALLBACK: SubscriptionPlan = {
  id: 'free',
  tier: 'free',
  name: 'Gratuit',
  tagline: null,
  description: null,
  price_eur_monthly: 0,
  price_eur_yearly: 0,
  price_xof_monthly: 0,
  price_xof_yearly: 0,
  features: {},
  limits: {},
  sort_order: 1,
};

export const usePlan = (): PlanContext & { isLoading: boolean } => {
  const { user } = useAuth();

  const { data: allPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubscriptionPlan[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as UserSubscription | null;
    },
    staleTime: 60 * 1000,
  });

  const tier: PlanTier =
    subscription &&
    (subscription.status === 'active' || subscription.status === 'past_due')
      ? subscription.plan_tier
      : 'free';

  const plan =
    allPlans.find((p) => p.tier === tier) ??
    (tier === 'free' ? FREE_FALLBACK : null);

  const getLimit = (feature: FeatureKey): number => {
    const raw = plan?.limits?.[feature];
    if (raw === undefined || raw === null) return 0;
    return Number(raw);
  };

  const getFeature = <T,>(flag: FeatureFlag) => {
    return plan?.features?.[flag] as T | undefined;
  };

  return {
    tier,
    subscription: subscription ?? null,
    plan,
    allPlans,
    getLimit,
    getFeature,
    isAtLeast: (required) => isPlanAtLeast(tier, required),
    isLoading: plansLoading || (!!user && subLoading),
  };
};

export { PLAN_ORDER };