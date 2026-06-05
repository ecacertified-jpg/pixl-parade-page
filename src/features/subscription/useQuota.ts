import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureKey } from './types';
import { usePlan } from './usePlan';

interface QuotaInfo {
  used: number;
  limit: number;
  /** true si limite = -1 */
  unlimited: boolean;
  /** % consommé (0-100), 0 si illimité */
  percent: number;
  /** true si l'utilisateur peut encore créer */
  canCreate: boolean;
  isLoading: boolean;
}

/**
 * Lit la consommation du mois courant pour une feature et la compare à la
 * limite du plan. Source de vérité métier : RLS + helpers SQL côté serveur.
 */
export const useQuota = (feature: FeatureKey): QuotaInfo => {
  const { user } = useAuth();
  const { getLimit, isLoading: planLoading } = usePlan();
  const limit = getLimit(feature);

  const { data: used = 0, isLoading } = useQuery({
    queryKey: ['feature-usage', user?.id, feature],
    enabled: !!user?.id,
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const period = monthStart.toISOString().slice(0, 10);
      const { data, error } = await (supabase as any)
        .from('feature_usage_counters')
        .select('used_value')
        .eq('user_id', user!.id)
        .eq('feature_key', feature)
        .eq('period_month', period)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.used_value ?? 0);
    },
    staleTime: 30 * 1000,
  });

  const unlimited = limit === -1;
  const percent = unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const canCreate = unlimited ? true : limit > 0 && used < limit;

  return {
    used,
    limit,
    unlimited,
    percent,
    canCreate,
    isLoading: planLoading || (!!user && isLoading),
  };
};