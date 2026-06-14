import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/features/subscription/usePlan';

/**
 * Counts the user's currently active event_pages and compares it to the plan
 * limit `event_pages`. -1 means unlimited. Used to gate "Préparer" event creation.
 */
export const useActiveEventsQuota = () => {
  const { user } = useAuth();
  const { getLimit, isLoading: planLoading } = usePlan();
  const limit = getLimit('event_pages');

  const { data: used = 0, isLoading } = useQuery({
    queryKey: ['active-events-count', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_pages')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', user!.id)
        .eq('is_active', true);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const unlimited = limit === -1;
  const canCreate = unlimited || (limit > 0 && used < limit);

  return {
    used,
    limit,
    unlimited,
    canCreate,
    isLoading: planLoading || (!!user && isLoading),
  };
};