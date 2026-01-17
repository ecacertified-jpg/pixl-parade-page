import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoDurationLimits {
  defaultSeconds: number;
  experienceSeconds: number;
  productSeconds: number;
  enabled: boolean;
}

const DEFAULT_LIMITS: VideoDurationLimits = {
  defaultSeconds: 180,   // 3 min
  experienceSeconds: 300, // 5 min
  productSeconds: 120,    // 2 min
  enabled: true,
};

export function useVideoDurationLimits() {
  const queryClient = useQueryClient();

  const { data: limits, isLoading } = useQuery({
    queryKey: ['video-duration-limits'],
    queryFn: async (): Promise<VideoDurationLimits> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'video_duration_limits')
        .single();

      if (error || !data) {
        console.warn('Video duration limits not found, using defaults');
        return DEFAULT_LIMITS;
      }

      const value = data.setting_value as {
        default_seconds?: number;
        experience_seconds?: number;
        product_seconds?: number;
        enabled?: boolean;
      };

      return {
        defaultSeconds: value.default_seconds ?? DEFAULT_LIMITS.defaultSeconds,
        experienceSeconds: value.experience_seconds ?? DEFAULT_LIMITS.experienceSeconds,
        productSeconds: value.product_seconds ?? DEFAULT_LIMITS.productSeconds,
        enabled: value.enabled ?? DEFAULT_LIMITS.enabled,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateLimits = useMutation({
    mutationFn: async (newLimits: VideoDurationLimits) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('platform_settings')
        .update({
          setting_value: {
            default_seconds: newLimits.defaultSeconds,
            experience_seconds: newLimits.experienceSeconds,
            product_seconds: newLimits.productSeconds,
            enabled: newLimits.enabled,
          },
          last_modified_by: adminUser?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'video_duration_limits');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-duration-limits'] });
      toast.success('Limites de durée des vidéos mises à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    limits: limits ?? DEFAULT_LIMITS,
    isLoading,
    updateLimits: updateLimits.mutate,
    isUpdating: updateLimits.isPending,
  };
}

/**
 * Calculate the max duration in seconds based on product type
 */
export function getMaxDurationForProduct(
  limits: VideoDurationLimits,
  isExperience: boolean
): number {
  if (!limits.enabled) {
    return limits.defaultSeconds;
  }
  return isExperience ? limits.experienceSeconds : limits.productSeconds;
}

/**
 * Format seconds to a human-readable duration string
 */
export function formatMaxDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return `${seconds} sec`;
  return `${minutes} min`;
}
