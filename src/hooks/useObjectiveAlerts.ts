import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ObjectiveAlert {
  id: string;
  country_code: string;
  year: number;
  month: number;
  metric_type: string;
  target_value: number;
  actual_value: number;
  achievement_rate: number;
  alert_type: string;
  severity: 'warning' | 'critical';
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  triggered_at: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface UseObjectiveAlertsReturn {
  alerts: ObjectiveAlert[];
  loading: boolean;
  unreadCount: number;
  criticalCount: number;
  warningCount: number;
  alertsByCountry: Record<string, ObjectiveAlert[]>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  dismissAll: () => Promise<void>;
  refetch: () => Promise<void>;
  getAlertsByCountry: (countryCode: string) => ObjectiveAlert[];
  getAlertsByMetric: (metricType: string) => ObjectiveAlert[];
}

export function useObjectiveAlerts(): UseObjectiveAlertsReturn {
  const [alerts, setAlerts] = useState<ObjectiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('country_objective_alerts')
        .select('*')
        .eq('is_dismissed', false)
        .order('triggered_at', { ascending: false });

      if (error) throw error;

      setAlerts((data || []) as ObjectiveAlert[]);
    } catch (error) {
      console.error('Error fetching objective alerts:', error);
      toast.error('Erreur lors du chargement des alertes objectifs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('objective-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'country_objective_alerts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as ObjectiveAlert;
            setAlerts(prev => [newAlert, ...prev]);
            
            // Show toast for new alerts
            if (newAlert.severity === 'critical') {
              toast.error(newAlert.message, {
                duration: 10000,
                action: {
                  label: 'Voir',
                  onClick: () => window.location.href = '/admin/objectives',
                },
              });
            } else {
              toast.warning(newAlert.message, {
                duration: 5000,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlert = payload.new as ObjectiveAlert;
            setAlerts(prev =>
              prev.map(a => (a.id === updatedAlert.id ? updatedAlert : a))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setAlerts(prev => prev.filter(a => a.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('country_objective_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('country_objective_alerts')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast.success('Toutes les alertes marquées comme lues');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [alerts]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('country_objective_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerte masquée');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, []);

  const dismissAll = useCallback(async () => {
    try {
      const alertIds = alerts.map(a => a.id);
      if (alertIds.length === 0) return;

      const { error } = await supabase
        .from('country_objective_alerts')
        .update({ is_dismissed: true })
        .in('id', alertIds);

      if (error) throw error;

      setAlerts([]);
      toast.success('Toutes les alertes masquées');
    } catch (error) {
      console.error('Error dismissing all:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [alerts]);

  const getAlertsByCountry = useCallback(
    (countryCode: string) => alerts.filter(a => a.country_code === countryCode),
    [alerts]
  );

  const getAlertsByMetric = useCallback(
    (metricType: string) => alerts.filter(a => a.metric_type === metricType),
    [alerts]
  );

  // Computed values
  const unreadCount = useMemo(
    () => alerts.filter(a => !a.is_read).length,
    [alerts]
  );

  const criticalCount = useMemo(
    () => alerts.filter(a => a.severity === 'critical' && !a.is_read).length,
    [alerts]
  );

  const warningCount = useMemo(
    () => alerts.filter(a => a.severity === 'warning' && !a.is_read).length,
    [alerts]
  );

  const alertsByCountry = useMemo(() => {
    const grouped: Record<string, ObjectiveAlert[]> = {};
    for (const alert of alerts) {
      if (!grouped[alert.country_code]) {
        grouped[alert.country_code] = [];
      }
      grouped[alert.country_code].push(alert);
    }
    return grouped;
  }, [alerts]);

  return {
    alerts,
    loading,
    unreadCount,
    criticalCount,
    warningCount,
    alertsByCountry,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    dismissAll,
    refetch: fetchAlerts,
    getAlertsByCountry,
    getAlertsByMetric,
  };
}