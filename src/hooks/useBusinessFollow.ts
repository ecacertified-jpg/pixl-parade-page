import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseBusinessFollowReturn {
  isFollowing: boolean;
  followersCount: number;
  loading: boolean;
  toggleFollow: () => Promise<void>;
}

export function useBusinessFollow(businessId: string): UseBusinessFollowReturn {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger l'état initial
  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Compter les followers (accessible à tous)
        const { count, error: countError } = await supabase
          .from('business_follows')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', businessId);

        if (!countError) {
          setFollowersCount(count || 0);
        }

        // Vérifier si l'utilisateur actuel suit la boutique
        if (user) {
          const { data, error } = await supabase
            .from('business_follows')
            .select('id')
            .eq('business_id', businessId)
            .eq('follower_id', user.id)
            .maybeSingle();

          if (!error) {
            setIsFollowing(!!data);
          }
        }
      } catch (err) {
        console.error('Error fetching follow status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId, user]);

  const toggleFollow = useCallback(async () => {
    if (!user) {
      toast.error('Connectez-vous pour suivre cette boutique');
      return;
    }

    if (!businessId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('business_follows')
          .delete()
          .eq('business_id', businessId)
          .eq('follower_id', user.id);

        if (error) throw error;

        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast.success('Vous ne suivez plus cette boutique');
      } else {
        // Follow
        const { error } = await supabase
          .from('business_follows')
          .insert({
            business_id: businessId,
            follower_id: user.id
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success('Vous suivez maintenant cette boutique !', {
          description: 'Vous serez notifié des nouveaux produits'
        });
      }
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [businessId, user, isFollowing]);

  return {
    isFollowing,
    followersCount,
    loading,
    toggleFollow
  };
}
