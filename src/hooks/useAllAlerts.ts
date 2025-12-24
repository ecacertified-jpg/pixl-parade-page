import { useState, useEffect, useCallback } from 'react';
import { useGrowthAlerts } from './useGrowthAlerts';
import { useBusinessPerformanceAlerts } from './useBusinessPerformanceAlerts';

export interface UnifiedAlert {
  id: string;
  type: 'growth' | 'business';
  alert_type: string;
  metric_type: string;
  message: string;
  current_value: number;
  previous_value: number | null;
  growth_percentage: number | null;
  severity: 'info' | 'warning' | 'critical';
  original_severity: string | null;
  escalation_count: number;
  last_escalated_at: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  triggered_at: string;
  metadata?: Record<string, any>;
  business_name?: string;
}

export function useAllAlerts() {
  const [unifiedAlerts, setUnifiedAlerts] = useState<UnifiedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const { 
    alerts: growthAlerts, 
    loading: growthLoading,
    markAsRead: markGrowthAsRead,
    dismissAlert: dismissGrowthAlert,
  } = useGrowthAlerts();

  const {
    alerts: businessAlerts,
    loading: businessLoading,
    markAsRead: markBusinessAsRead,
    dismissAlert: dismissBusinessAlert,
  } = useBusinessPerformanceAlerts();

  useEffect(() => {
    const unified: UnifiedAlert[] = [];

    // Transform growth alerts
    for (const alert of growthAlerts) {
      unified.push({
        id: alert.id,
        type: 'growth',
        alert_type: alert.alert_type,
        metric_type: alert.metric_type,
        message: alert.message,
        current_value: alert.current_value,
        previous_value: alert.previous_value,
        growth_percentage: alert.growth_percentage,
        severity: alert.severity || 'info',
        original_severity: alert.original_severity,
        escalation_count: alert.escalation_count || 0,
        last_escalated_at: alert.last_escalated_at,
        is_read: alert.is_read || false,
        is_dismissed: alert.is_dismissed || false,
        triggered_at: alert.triggered_at,
        metadata: alert.metadata as Record<string, any>,
      });
    }

    // Transform business alerts
    for (const alert of businessAlerts) {
      unified.push({
        id: alert.id,
        type: 'business',
        alert_type: alert.alert_type,
        metric_type: alert.metric_type,
        message: alert.message,
        current_value: alert.current_value,
        previous_value: alert.previous_value,
        growth_percentage: alert.change_percentage,
        severity: alert.severity || 'warning',
        original_severity: alert.original_severity,
        escalation_count: alert.escalation_count || 0,
        last_escalated_at: alert.last_escalated_at,
        is_read: alert.is_read || false,
        is_dismissed: alert.is_dismissed || false,
        triggered_at: alert.created_at,
        metadata: alert.metadata as Record<string, any>,
        business_name: alert.business_name,
      });
    }

    // Sort by date desc
    unified.sort((a, b) => 
      new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
    );

    setUnifiedAlerts(unified);
    setLoading(growthLoading || businessLoading);
  }, [growthAlerts, businessAlerts, growthLoading, businessLoading]);

  const markAsRead = useCallback(async (alertId: string, type: 'growth' | 'business') => {
    if (type === 'growth') {
      await markGrowthAsRead(alertId);
    } else {
      await markBusinessAsRead(alertId);
    }
  }, [markGrowthAsRead, markBusinessAsRead]);

  const dismissAlert = useCallback(async (alertId: string, type: 'growth' | 'business') => {
    if (type === 'growth') {
      await dismissGrowthAlert(alertId);
    } else {
      await dismissBusinessAlert(alertId);
    }
  }, [dismissGrowthAlert, dismissBusinessAlert]);

  const unreadCount = unifiedAlerts.filter(a => !a.is_read).length;
  const criticalCount = unifiedAlerts.filter(a => 
    !a.is_read && a.severity === 'critical'
  ).length;
  const escalatedCount = unifiedAlerts.filter(a => 
    !a.is_read && a.escalation_count > 0
  ).length;

  return {
    alerts: unifiedAlerts,
    loading,
    unreadCount,
    criticalCount,
    escalatedCount,
    markAsRead,
    dismissAlert,
  };
}
