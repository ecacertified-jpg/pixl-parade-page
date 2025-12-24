import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessPerformanceAlert {
  id: string;
  business_id: string;
  business_name?: string;
  alert_type: 'revenue_drop' | 'orders_drop' | 'inactivity' | 'rating_drop' | 'conversion_drop';
  metric_type: string;
  severity: 'info' | 'warning' | 'critical';
  original_severity: string | null;
  escalation_count: number;
  last_escalated_at: string | null;
  current_value: number;
  previous_value: number | null;
  change_percentage: number | null;
  period_start: string | null;
  period_end: string | null;
  message: string;
  is_read: boolean;
  is_dismissed: boolean;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface UseBusinessPerformanceAlertsOptions {
  severity?: 'warning' | 'critical' | 'all';
  alertType?: string;
  showDismissed?: boolean;
  showResolved?: boolean;
}

export function useBusinessPerformanceAlerts(options: UseBusinessPerformanceAlertsOptions = {}) {
  const [alerts, setAlerts] = useState<BusinessPerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('business_performance_alerts')
        .select(`
          *,
          business_accounts!inner(business_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.severity && options.severity !== 'all') {
        query = query.eq('severity', options.severity);
      }
      if (options.alertType) {
        query = query.eq('alert_type', options.alertType);
      }
      if (!options.showDismissed) {
        query = query.eq('is_dismissed', false);
      }
      if (!options.showResolved) {
        query = query.eq('is_resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      const alertsWithBusinessName = (data || []).map((alert: any) => ({
        ...alert,
        business_name: alert.business_accounts?.business_name,
        severity: alert.severity || 'warning',
        escalation_count: alert.escalation_count || 0,
      }));

      setAlerts(alertsWithBusinessName);
      setUnreadCount(alertsWithBusinessName.filter((a: BusinessPerformanceAlert) => !a.is_read).length);
      setCriticalCount(alertsWithBusinessName.filter((a: BusinessPerformanceAlert) => a.severity === 'critical' && !a.is_read).length);
    } catch (error) {
      console.error('Error fetching business performance alerts:', error);
      toast.error('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  }, [options.severity, options.alertType, options.showDismissed, options.showResolved]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('business-alerts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_performance_alerts' },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('business_performance_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, is_read: true } : a)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('business_performance_alerts')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
      toast.success('Toutes les alertes marquées comme lues');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('business_performance_alerts')
        .update({ is_dismissed: true, is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerte ignorée');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resolveAlert = async (alertId: string, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('business_performance_alerts')
        .update({ 
          is_resolved: true, 
          is_read: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: notes || null,
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerte résolue');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Erreur lors de la résolution');
    }
  };

  return {
    alerts,
    loading,
    unreadCount,
    criticalCount,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    resolveAlert,
  };
}
