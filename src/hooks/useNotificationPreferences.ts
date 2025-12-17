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
  post_notifications: boolean;
  comment_notifications: boolean;
  reaction_notifications: boolean;
  ai_suggestions: boolean;
  
  // Timing des rappels d'anniversaire
  birthday_reminder_days: number[];
  
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
  post_notifications: true,
  comment_notifications: true,
  reaction_notifications: true,
  ai_suggestions: true,
  birthday_reminder_days: [14, 7, 3, 1],
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
          post_notifications: (data as any).post_notifications ?? true,
          comment_notifications: (data as any).comment_notifications ?? true,
          reaction_notifications: (data as any).reaction_notifications ?? true,
          birthday_reminder_days: (data as any).birthday_reminder_days ?? [14, 7, 3, 1],
          digest_frequency: (data.digest_frequency as 'daily' | 'weekly') || 'daily'
        });
      } else {
        // Create default preferences
        const newPrefs = {
          ...defaultPreferences,
          user_id: user.id,
        } as NotificationPreferences;
        
        const { data: created, error: createError } = await supabase
          .from('notification_preferences')
          .insert(newPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences({
          ...created,
          post_notifications: (created as any).post_notifications ?? true,
          comment_notifications: (created as any).comment_notifications ?? true,
          reaction_notifications: (created as any).reaction_notifications ?? true,
          birthday_reminder_days: (created as any).birthday_reminder_days ?? [14, 7, 3, 1],
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
        post_notifications: (data as any).post_notifications ?? true,
        comment_notifications: (data as any).comment_notifications ?? true,
        reaction_notifications: (data as any).reaction_notifications ?? true,
        birthday_reminder_days: (data as any).birthday_reminder_days ?? [14, 7, 3, 1],
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
