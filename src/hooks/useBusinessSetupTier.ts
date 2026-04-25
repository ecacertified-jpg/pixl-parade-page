import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SetupTier = 'none' | 'bronze' | 'silver' | 'gold';

export interface TierInfo {
  tier: SetupTier;
  label: string;
  emoji: string;
  description: string;
  reward: string;
  colorClass: string; // tailwind classes (semantic tokens only)
  gradientClass: string;
}

export const TIER_DEFINITIONS: Record<SetupTier, TierInfo> = {
  none: {
    tier: 'none',
    label: 'Non démarré',
    emoji: '✨',
    description: 'Configurez votre boutique pour débloquer votre premier badge.',
    reward: 'Apparaître dans l’annuaire local',
    colorClass: 'text-muted-foreground',
    gradientClass: 'from-muted to-muted/60',
  },
  bronze: {
    tier: 'bronze',
    label: 'Boutique Bronze',
    emoji: '🥉',
    description: 'Profil complet + 1 produit en ligne.',
    reward: 'Badge Bronze affiché sur votre fiche publique',
    colorClass: 'text-orange-600',
    gradientClass: 'from-orange-400 to-amber-600',
  },
  silver: {
    tier: 'silver',
    label: 'Boutique Argent',
    emoji: '🥈',
    description: 'Livraison + paiement configurés et 3 produits.',
    reward: 'Mise en avant dans le catalogue de votre ville',
    colorClass: 'text-slate-500',
    gradientClass: 'from-slate-300 to-slate-500',
  },
  gold: {
    tier: 'gold',
    label: 'Boutique Or',
    emoji: '🥇',
    description: 'Boutique exemplaire avec 5 produits et plus.',
    reward: 'Boost de visibilité prioritaire sur la marketplace',
    colorClass: 'text-amber-500',
    gradientClass: 'from-amber-300 via-yellow-400 to-amber-600',
  },
};

const TIER_ORDER: SetupTier[] = ['none', 'bronze', 'silver', 'gold'];

export const useBusinessSetupTier = (businessId?: string | null) => {
  const [tier, setTier] = useState<SetupTier>('none');
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setTier('none');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('setup_tier')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      const t = ((data as any)?.setup_tier ?? 'none') as SetupTier;
      setTier(TIER_ORDER.includes(t) ? t : 'none');
    } catch (e) {
      console.error('useBusinessSetupTier error:', e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { refetch(); }, [refetch]);

  const currentInfo = TIER_DEFINITIONS[tier];
  const currentIndex = TIER_ORDER.indexOf(tier);
  const nextTier: SetupTier | null =
    currentIndex >= 0 && currentIndex < TIER_ORDER.length - 1
      ? TIER_ORDER[currentIndex + 1]
      : null;
  const nextInfo = nextTier ? TIER_DEFINITIONS[nextTier] : null;
  const tierProgress = ((currentIndex) / (TIER_ORDER.length - 1)) * 100;

  return {
    tier,
    currentInfo,
    nextTier,
    nextInfo,
    tierProgress,
    loading,
    refetch,
  };
};