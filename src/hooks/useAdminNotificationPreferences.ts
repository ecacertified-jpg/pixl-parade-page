import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AdminNotificationPreferences {
  id: string;
  admin_user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  client_deletion_alerts: boolean;
  new_client_alerts: boolean;
  new_business_alerts: boolean;
  new_order_alerts: boolean;
  refund_request_alerts: boolean;
  critical_moderation_alerts: boolean;
  performance_alerts: boolean;
  growth_alerts: boolean;
  daily_digest: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  monitored_countries: string[] | null;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<AdminNotificationPreferences, 'id' | 'admin_user_id' | 'created_at' | 'updated_at'> = {
  email_enabled: true,
  push_enabled: true,
  in_app_enabled: true,
  client_deletion_alerts: true,
  new_client_alerts: true,
  new_business_alerts: true,
  new_order_alerts: true,
  refund_request_alerts: true,
  critical_moderation_alerts: true,
  performance_alerts: true,
  growth_alerts: true,
  daily_digest: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  monitored_countries: null, // null = all countries
};

export function useAdminNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AdminNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_notification_preferences')
        .select('*')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as AdminNotificationPreferences);
      } else {
        // Create default preferences for this admin
        const { data: newPrefs, error: insertError } = await supabase
          .from('admin_notification_preferences')
          .insert({
            admin_user_id: user.id,
            ...defaultPreferences,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
          // If insert fails (maybe not an admin), just use null
          setPreferences(null);
        } else {
          setPreferences(newPrefs as AdminNotificationPreferences);
        }
      }
    } catch (error) {
      console.error('Error fetching admin notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = async (updates: Partial<AdminNotificationPreferences>) => {
    if (!preferences?.id) {
      toast.error('Impossible de sauvegarder les préférences');
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', preferences.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Préférences de notification mises à jour');
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erreur lors de la mise à jour des préférences');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
