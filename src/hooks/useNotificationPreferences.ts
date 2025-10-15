import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  
  // Canaux
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  
  // Par catégorie
  birthday_notifications: boolean;
  event_notifications: boolean;
  contribution_notifications: boolean;
  gift_notifications: boolean;
  fund_deadline_notifications: boolean;
  ai_suggestions: boolean;
  
  // Fréquence
  digest_mode: boolean;
  digest_frequency: 'daily' | 'weekly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  
  // Autres
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

const defaultPreferences: Partial<NotificationPreferences> = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  birthday_notifications: true,
  event_notifications: true,
  contribution_notifications: true,
  gift_notifications: true,
  fund_deadline_notifications: true,
  ai_suggestions: true,
  digest_mode: false,
  digest_frequency: 'daily',
  sound_enabled: true,
  vibration_enabled: true,
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          ...data,
          digest_frequency: (data.digest_frequency as 'daily' | 'weekly') || 'daily'
        });
      } else {
        // Create default preferences using upsert to avoid unique constraint errors
        const newPrefs = {
          ...defaultPreferences,
          user_id: user.id,
        } as NotificationPreferences;
        
        const { data: created, error: createError } = await supabase
          .from('notification_preferences')
          .upsert(newPrefs, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating preferences:', createError);
          throw createError;
        }
        
        setPreferences({
          ...created,
          digest_frequency: (created.digest_frequency as 'daily' | 'weekly') || 'daily'
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', preferences.user_id)
        .select()
        .single();

      if (error) throw error;

      setPreferences({
        ...data,
        digest_frequency: (data.digest_frequency as 'daily' | 'weekly') || 'daily'
      });
      toast.success('Préférences enregistrées');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
  };
};
