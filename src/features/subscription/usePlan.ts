import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  FeatureFlag,
  FeatureKey,
  PLAN_ORDER,
  PlanTier,
  PremiumTrialStatus,
  SubscriptionPlan,
  TrialPhase,
  UserPlanState,
  UserSubscription,
  isPlanAtLeast,
} from './types';

interface PlanContext {
  tier: PlanTier;
  /** Plan "réel" (abonnement payant uniquement, ignore le trial). */
  baseTier: PlanTier;
  /** État utilisateur émotionnel (UI). */
  state: UserPlanState;
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  allPlans: SubscriptionPlan[];
  /** Trial Premium offert (1 événement à vie). null si jamais déclenché. */
  trial: PremiumTrialStatus | null;
  trialPhase: TrialPhase;
  /** true si l'item donné est l'événement offert ET encore couvert. */
  isTrialCoveredItem: (targetType: PremiumTrialStatus['target_type'], targetId: string) => boolean;
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

  const { data: trial = null, isLoading: trialLoading } = useQuery({
    queryKey: ['premium-trial-status', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_premium_trial_status');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as PremiumTrialStatus | null;
    },
    staleTime: 60 * 1000,
  });

  const baseTier: PlanTier =
    subscription &&
    (subscription.status === 'active' || subscription.status === 'past_due')
      ? subscription.plan_tier
      : 'free';

  // Le trial ne fait PAS basculer le plan globalement : il déverrouille
  // uniquement le SEUL item ciblé. On expose donc tier = baseTier ; les gates
  // contextuelles utilisent `isTrialCoveredItem`.
  const tier = baseTier;

  const trialPhase: TrialPhase = trial?.phase ?? 'none';

  const state: UserPlanState =
    baseTier === 'premium' || baseTier === 'essentiel'
      ? 'premium'
      : trial && (trial.phase === 'active' || trial.phase === 'memories')
        ? 'free_with_premium_event'
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
    baseTier,
    state,
    subscription: subscription ?? null,
    plan,
    allPlans,
    trial,
    trialPhase,
    isTrialCoveredItem: (targetType, targetId) =>
      !!trial &&
      trial.target_type === targetType &&
      trial.target_id === targetId &&
      (trial.phase === 'active' || trial.phase === 'memories'),
    getLimit,
    getFeature,
    isAtLeast: (required) => isPlanAtLeast(tier, required),
    isLoading: plansLoading || (!!user && (subLoading || trialLoading)),
  };
};

export { PLAN_ORDER };