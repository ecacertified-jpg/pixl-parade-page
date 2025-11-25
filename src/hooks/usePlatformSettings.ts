import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_category: 'general' | 'finance' | 'notifications' | 'security';
  description?: string;
  last_modified_by?: string;
  updated_at?: string;
}

const validateSetting = (key: string, value: any) => {
  switch (key) {
    case 'commission_rate':
      if (value.value < 0 || value.value > 100) {
        throw new Error('Le taux de commission doit être entre 0 et 100%');
      }
      break;
    case 'free_delivery_threshold':
      if (value.value < 0) {
        throw new Error('Le seuil doit être positif');
      }
      break;
    case 'session_timeout':
      if (value.value < 5 || value.value > 1440) {
        throw new Error('La durée de session doit être entre 5 et 1440 minutes');
      }
      break;
  }
};

export const usePlatformSettings = (category?: string) => {
  const queryClient = useQueryClient();

  // Fetch all settings or by category
  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings', category],
    queryFn: async () => {
      let query = supabase
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (category) {
        query = query.eq('setting_category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PlatformSetting[];
    },
  });

  // Update a setting
  const updateSetting = useMutation({
    mutationFn: async ({ 
      setting_key, 
      setting_value 
    }: { 
      setting_key: string; 
      setting_value: any 
    }) => {
      // Validate before sending
      validateSetting(setting_key, setting_value);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('platform_settings')
        .update({
          setting_value,
          last_modified_by: adminUser?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', setting_key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Paramètre mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  // Helper to get a specific setting value
  const getSetting = (key: string) => {
    return settings?.find(s => s.setting_key === key)?.setting_value;
  };

  // Helper to get a primitive value from a setting (string or number)
  const getSettingValue = (key: string): string => {
    const setting = getSetting(key);
    
    // If the setting is an object with a 'value' property, extract it
    if (setting && typeof setting === 'object' && 'value' in setting) {
      return String(setting.value);
    }
    
    // Otherwise return the setting as a string
    return setting ? String(setting) : '';
  };

  return {
    settings,
    isLoading,
    updateSetting: updateSetting.mutate,
    isUpdating: updateSetting.isPending,
    getSetting,
    getSettingValue,
  };
};
