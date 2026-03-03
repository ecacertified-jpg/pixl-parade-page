import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReciprocityScore {
  user_id: string;
  total_contributions_count: number;
  total_amount_given: number;
  total_funds_initiated: number;
  generosity_score: number;
  badge_level: 'newcomer' | 'helper' | 'generous' | 'champion';
  last_calculated_at: string;
  birthday_contributions: number;
  academic_contributions: number;
  wedding_contributions: number;
  promotion_contributions: number;
}

const fetchReciprocityScore = async (userId: string): Promise<ReciprocityScore | null> => {
  const { data, error } = await supabase
    .from('reciprocity_scores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading reciprocity score:', error);
    return null;
  }
  if (!data) return null;
  return {
    ...data,
    badge_level: data.badge_level as ReciprocityScore['badge_level'],
  };
};

export const useReciprocityScore = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: score = null, isLoading: loading } = useQuery({
    queryKey: ['reciprocity-score', user?.id],
    queryFn: () => fetchReciprocityScore(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Realtime invalidation
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('reciprocity-score-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reciprocity_scores',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reciprocity-score', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    score,
    loading,
    refreshScore: () => queryClient.invalidateQueries({ queryKey: ['reciprocity-score', user?.id] }),
  };
};
