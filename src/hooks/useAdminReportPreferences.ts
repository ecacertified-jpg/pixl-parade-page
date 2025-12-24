import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ReportType = 'daily' | 'weekly' | 'monthly';

export interface AdminReportPreferences {
  id: string;
  admin_user_id: string;
  report_types: ReportType[];
  email_override: string | null;
  include_kpis: boolean;
  include_charts_summary: boolean;
  include_alerts: boolean;
  include_top_performers: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminReportLog {
  id: string;
  report_type: ReportType;
  recipients_count: number;
  sent_at: string;
  status: 'sent' | 'partial' | 'failed';
  error_message: string | null;
  metadata: Record<string, any> | null;
}

export function useAdminReportPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AdminReportPreferences | null>(null);
  const [logs, setLogs] = useState<AdminReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchLogs();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_report_preferences')
        .select('*')
        .eq('admin_user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setPreferences(data as AdminReportPreferences | null);
    } catch (error) {
      console.error('Error fetching report preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_report_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs((data || []) as AdminReportLog[]);
    } catch (error) {
      console.error('Error fetching report logs:', error);
    }
  };

  const savePreferences = async (newPrefs: Partial<AdminReportPreferences>) => {
    if (!user) return;
    setSaving(true);

    try {
      const prefsData = {
        admin_user_id: user.id,
        report_types: newPrefs.report_types || [],
        email_override: newPrefs.email_override || null,
        include_kpis: newPrefs.include_kpis ?? true,
        include_charts_summary: newPrefs.include_charts_summary ?? true,
        include_alerts: newPrefs.include_alerts ?? true,
        include_top_performers: newPrefs.include_top_performers ?? true,
        is_active: newPrefs.is_active ?? true,
        updated_at: new Date().toISOString()
      };

      if (preferences?.id) {
        // Update existing
        const { error } = await supabase
          .from('admin_report_preferences')
          .update(prefsData)
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('admin_report_preferences')
          .insert(prefsData);

        if (error) throw error;
      }

      await fetchPreferences();
      toast.success('Préférences de rapport enregistrées');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const sendTestReport = async (reportType: ReportType, email: string) => {
    setSendingTest(true);
    try {
      const response = await supabase.functions.invoke('send-admin-report', {
        body: {
          report_type: reportType,
          test_mode: true,
          test_email: email
        }
      });

      if (response.error) throw response.error;

      toast.success(`Rapport de test envoyé à ${email}`);
      return true;
    } catch (error: any) {
      console.error('Error sending test report:', error);
      toast.error('Erreur lors de l\'envoi du rapport de test');
      return false;
    } finally {
      setSendingTest(false);
    }
  };

  return {
    preferences,
    logs,
    loading,
    saving,
    sendingTest,
    savePreferences,
    sendTestReport,
    refetch: fetchPreferences,
    refetchLogs: fetchLogs
  };
}
