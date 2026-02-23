import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ContactAlertPreferences {
  id: string;
  user_id: string;
  alerts_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  alert_on_contact_add: boolean;
  alert_30_days: boolean;
  alert_21_days: boolean;
  alert_14_days: boolean;
  alert_7_days: boolean;
  alert_5_days: boolean;
  alert_3_days: boolean;
  alert_2_days: boolean;
  alert_1_day: boolean;
  notify_of_adder_birthday: boolean;
  custom_message: string | null;
  created_at: string;
  updated_at: string;
}

const defaultPreferences: Omit<ContactAlertPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  alerts_enabled: true,
  sms_enabled: true,
  whatsapp_enabled: true,
  email_enabled: false,
  alert_on_contact_add: true,
  alert_30_days: true,
  alert_21_days: true,
  alert_14_days: true,
  alert_7_days: true,
  alert_5_days: true,
  alert_3_days: true,
  alert_2_days: true,
  alert_1_day: true,
  notify_of_adder_birthday: true,
  custom_message: null,
};

export function useContactAlertPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ContactAlertPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contact_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as ContactAlertPreferences);
      } else {
        // Create default preferences
        const { data: newData, error: insertError } = await supabase
          .from('contact_alert_preferences')
          .insert({
            user_id: user.id,
            ...defaultPreferences,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as ContactAlertPreferences);
      }
    } catch (error) {
      console.error('Error fetching contact alert preferences:', error);
      toast.error('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(async (
    updates: Partial<Omit<ContactAlertPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user?.id || !preferences?.id) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('contact_alert_preferences')
        .update(updates)
        .eq('id', preferences.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as ContactAlertPreferences);
      toast.success('Préférences mises à jour');
    } catch (error) {
      console.error('Error updating contact alert preferences:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }, [user?.id, preferences?.id]);

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
