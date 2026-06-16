export type PlanTier = 'free' | 'essentiel' | 'premium';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'awaiting_payment'
  | 'incomplete';

export interface SubscriptionPlan {
  id: string;
  tier: PlanTier;
  name: string;
  tagline: string | null;
  description: string | null;
  price_eur_monthly: number;
  price_eur_yearly: number;
  price_xof_monthly: number;
  price_xof_yearly: number;
  features: Record<string, unknown>;
  limits: Record<string, number>;
  sort_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  provider: 'stripe' | 'wave' | 'admin_override' | null;
  billing_cycle: 'monthly' | 'yearly';
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/** Toutes les clés de features quotables côté DB (table subscription_plans.limits). */
export type FeatureKey =
  | 'event_pages'
  | 'album_photos_per_page'
  | 'active_funds'
  | 'wishes_displayed'
  | 'guests_per_page'
  | 'storage_mb'
  | 'co_organizers'
  | 'ai_recommendations'
  | 'fund_commission_rate';

/** Capacités booléennes / qualitatives (table subscription_plans.features). */
export type FeatureFlag =
  | 'premium_themes'
  | 'hd_video'
  | 'album_export'
  | 'priority_support'
  | 'ad_free'
  | 'public_badge'
  | 'exclusive_themes'
  | 'profile_halo';

export const PLAN_ORDER: Record<PlanTier, number> = {
  free: 0,
  essentiel: 1,
  premium: 2,
};

export const isPlanAtLeast = (current: PlanTier, required: PlanTier) =>
  PLAN_ORDER[current] >= PLAN_ORDER[required];

// ============================================================
// Premium Trial — 1 événement Premium offert par utilisateur
// ============================================================

export type TrialTargetType = 'birthday_page' | 'event_page' | 'collective_fund';

/**
 * Phases du Premium offert :
 *  - active   : avant + jour J de l'événement → Premium complet sur CET item
 *  - memories : J+1 → J+7 → souvenirs Premium encore consultables/ajoutables
 *  - limited  : J+8 → J+30 → tout reste visible mais ajouts bloqués
 *  - archived : > J+30 → page figée, CTA upgrade
 */
export type TrialPhase = 'active' | 'memories' | 'limited' | 'archived' | 'none';

export interface PremiumTrialStatus {
  grant_id: string;
  target_type: TrialTargetType;
  target_id: string;
  event_date: string | null;
  premium_until: string;
  memories_until: string;
  archived_at: string;
  phase: TrialPhase;
  converted_to_premium: boolean;
}

/** États utilisateur exposés à l'UI. */
export type UserPlanState = 'free' | 'free_with_premium_event' | 'premium';