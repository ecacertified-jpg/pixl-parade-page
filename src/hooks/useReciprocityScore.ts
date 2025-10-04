import { useState, useEffect } from 'react';
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

export const useReciprocityScore = () => {
  const { user } = useAuth();
  const [score, setScore] = useState<ReciprocityScore | null>(null);
  const [loading, setLoading] = useState(true);

  const loadScore = async () => {
    if (!user) {
      setScore(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reciprocity_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading reciprocity score:', error);
        setScore(null);
      } else if (data) {
        setScore({
          ...data,
          badge_level: data.badge_level as 'newcomer' | 'helper' | 'generous' | 'champion'
        });
      } else {
        setScore(null);
      }
    } catch (error) {
      console.error('Error loading reciprocity score:', error);
      setScore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScore();

    // Écouter les changements sur le score
    const channel = supabase
      .channel('reciprocity-score-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reciprocity_scores',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          loadScore();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { score, loading, refreshScore: loadScore };
};
