import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProfileReminderSettings {
  id: string;
  is_enabled: boolean;
  reminder_1_days: number;
  reminder_2_days: number;
  reminder_3_days: number;
  reminder_final_days: number;
  min_completion_threshold: number;
  max_reminders: number;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_subject_1: string;
  email_subject_2: string;
  email_subject_3: string;
  email_subject_final: string;
}

export interface ReminderStats {
  totalSent: number;
  completedAfter: number;
  conversionRate: number;
  byChannel: {
    email: number;
    push: number;
    in_app: number;
  };
  thisMonth: number;
}

export const useProfileReminderSettings = () => {
  const [settings, setSettings] = useState<ProfileReminderSettings | null>(null);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profile_reminder_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Get all reminders
      const { data: reminders, error } = await supabase
        .from('profile_completion_reminders')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalSent = reminders?.length || 0;
      const completedAfter = reminders?.filter(r => r.completed_after).length || 0;
      const thisMonth = reminders?.filter(r => new Date(r.sent_at) >= startOfMonth).length || 0;

      const byChannel = {
        email: reminders?.filter(r => r.channel === 'email').length || 0,
        push: reminders?.filter(r => r.channel === 'push').length || 0,
        in_app: reminders?.filter(r => r.channel === 'in_app').length || 0,
      };

      setStats({
        totalSent,
        completedAfter,
        conversionRate: totalSent > 0 ? Math.round((completedAfter / totalSent) * 100) : 0,
        byChannel,
        thisMonth
      });
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchSettings, fetchStats]);

  const updateSettings = async (updates: Partial<ProfileReminderSettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profile_reminder_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Paramètres mis à jour');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const sendTestReminder = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('profile-completion-reminder', {
        body: { test: true }
      });

      if (error) throw error;
      toast.success('Relance test envoyée');
      return data;
    } catch (error) {
      console.error('Error sending test reminder:', error);
      toast.error('Erreur lors de l\'envoi du test');
      throw error;
    }
  };

  return {
    settings,
    stats,
    loading,
    saving,
    updateSettings,
    sendTestReminder,
    refresh: () => Promise.all([fetchSettings(), fetchStats()])
  };
};
