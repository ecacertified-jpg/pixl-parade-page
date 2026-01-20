import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ViralityAlertType = 'shares_milestone' | 'shares_spike' | 'conversions_milestone' | 
              'high_conversion_rate' | 'viral_trending';
export type ViralitySeverity = 'info' | 'warning' | 'success';

export interface ProductViralityAlert {
  id: string;
  product_id: string;
  business_id: string;
  alert_type: ViralityAlertType;
  severity: ViralitySeverity;
  current_shares: number;
  current_clicks: number;
  current_conversions: number;
  conversion_rate: number;
  conversion_value: number;
  previous_shares: number | null;
  share_growth_percentage: number | null;
  message: string;
  milestone_value: number | null;
  period_type: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string | null;
  alert_date?: string;
  metadata: Record<string, any> | null;
  // Joined data
  product_name?: string;
  product_image?: string;
}

interface UseProductViralityAlertsReturn {
  alerts: ProductViralityAlert[];
  loading: boolean;
  error: Error | null;
  unreadCount: number;
  refetch: () => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
}

export function useProductViralityAlerts(businessId?: string): UseProductViralityAlertsReturn {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProductViralityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('product_virality_alerts')
        .select(`
          *,
          products:product_id (
            name,
            image_url
          )
        `)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedAlerts: ProductViralityAlert[] = (data || []).map(alert => ({
        id: alert.id,
        product_id: alert.product_id,
        business_id: alert.business_id,
        alert_type: alert.alert_type as ViralityAlertType,
        severity: alert.severity as ViralitySeverity,
        current_shares: alert.current_shares,
        current_clicks: alert.current_clicks,
        current_conversions: alert.current_conversions,
        conversion_rate: alert.conversion_rate,
        conversion_value: alert.conversion_value,
        previous_shares: alert.previous_shares,
        share_growth_percentage: alert.share_growth_percentage,
        message: alert.message,
        milestone_value: alert.milestone_value,
        period_type: alert.period_type,
        is_read: alert.is_read,
        is_dismissed: alert.is_dismissed,
        created_at: alert.created_at,
        read_at: alert.read_at,
        alert_date: alert.alert_date,
        metadata: typeof alert.metadata === 'object' ? alert.metadata as Record<string, any> : null,
        product_name: alert.products?.name,
        product_image: alert.products?.image_url,
      }));

      setAlerts(formattedAlerts);
    } catch (err) {
      console.error('Error fetching virality alerts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !businessId) return;

    const channel = supabase
      .channel(`virality-alerts-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_virality_alerts',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, businessId, fetchAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('product_virality_alerts')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, is_read: true, read_at: new Date().toISOString() } : a)
      );
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!businessId) return;

    try {
      const { error: updateError } = await supabase
        .from('product_virality_alerts')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('business_id', businessId)
        .eq('is_read', false);

      if (updateError) throw updateError;

      setAlerts(prev => 
        prev.map(a => ({ ...a, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
    }
  }, [businessId]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('product_virality_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (updateError) throw updateError;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  }, []);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return {
    alerts,
    loading,
    error,
    unreadCount,
    refetch: fetchAlerts,
    markAsRead,
    markAllAsRead,
    dismissAlert
  };
}