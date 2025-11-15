import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InvitationReward {
  id: string;
  reward_type: 'points' | 'badge' | 'discount';
  reward_value: any;
  earned_at: string;
  claimed: boolean;
  claimed_at: string | null;
}

export function useInvitationRewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<InvitationReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const fetchRewards = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('invitation_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('claimed', false)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      setRewards((data || []) as InvitationReward[]);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      toast.error('Erreur lors du chargement des récompenses');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    if (!user?.id) return { success: false };

    try {
      setClaiming(true);

      const { error } = await supabase
        .from('invitation_rewards')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', rewardId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Find the reward to show appropriate message
      const reward = rewards.find(r => r.id === rewardId);
      if (reward) {
        if (reward.reward_type === 'points') {
          toast.success(`🎉 ${reward.reward_value.points} points ajoutés à votre compte !`);
        } else if (reward.reward_type === 'badge') {
          toast.success(`🏆 Badge "${reward.reward_value.badge_name}" débloqué !`);
        }
      }

      await fetchRewards();
      return { success: true };
    } catch (err) {
      console.error('Error claiming reward:', err);
      toast.error('Erreur lors de la réclamation de la récompense');
      return { success: false };
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [user?.id]);

  return {
    rewards,
    loading,
    claiming,
    claimReward,
    refetch: fetchRewards,
  };
}
