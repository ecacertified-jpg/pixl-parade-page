import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GrowthAlert {
  id: string;
  threshold_id: string | null;
  alert_type: 'milestone' | 'growth_spike' | 'daily_record' | 'decline';
  metric_type: 'users' | 'businesses' | 'revenue' | 'orders' | 'contributions';
  current_value: number;
  previous_value: number | null;
  growth_percentage: number | null;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  original_severity: string | null;
  escalation_count: number;
  last_escalated_at: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  triggered_at: string;
  metadata: Record<string, any> | null;
}

export function useGrowthAlerts() {
  const [alerts, setAlerts] = useState<GrowthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_growth_alerts')
        .select('*')
        .eq('is_dismissed', false)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedAlerts = (data || []).map(a => ({
        ...a,
        severity: a.severity || 'info',
        escalation_count: a.escalation_count || 0,
      })) as GrowthAlert[];
      
      setAlerts(typedAlerts);
      setUnreadCount(typedAlerts.filter(a => !a.is_read).length);
    } catch (error) {
      console.error('Error fetching growth alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('admin_growth_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('admin_growth_alerts')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('admin_growth_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setUnreadCount(prev => {
        const alert = alerts.find(a => a.id === alertId);
        return alert && !alert.is_read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('growth-alerts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_growth_alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAlert = {
              ...payload.new,
              severity: payload.new.severity || 'info',
              escalation_count: payload.new.escalation_count || 0,
            } as GrowthAlert;
            setAlerts(prev => [newAlert, ...prev]);
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlert = {
              ...payload.new,
              severity: payload.new.severity || 'info',
              escalation_count: payload.new.escalation_count || 0,
            } as GrowthAlert;
            setAlerts(prev => prev.map(a => 
              a.id === updatedAlert.id ? updatedAlert : a
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    alerts,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    refetch: fetchAlerts,
  };
}
