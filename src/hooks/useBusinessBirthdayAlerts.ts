import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BirthdayAlert {
  id: string;
  business_id: string;
  target_user_id: string;
  product_id: string | null;
  target_user_name: string | null;
  target_user_avatar: string | null;
  days_until_birthday: number;
  birthday_date: string | null;
  status: 'pending' | 'viewed' | 'fund_created' | 'dismissed' | 'expired';
  priority: 'normal' | 'high' | 'urgent' | 'critical';
  fund_id: string | null;
  notified_at: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export function useBusinessBirthdayAlerts(businessId?: string) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<BirthdayAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('business_birthday_alerts')
        .select(`
          *,
          product:products(id, name, price, image_url)
        `)
        .in('status', ['pending', 'viewed'])
        .order('days_until_birthday', { ascending: true })
        .order('priority', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Mettre à jour les jours restants
      const today = new Date();
      const updatedAlerts = (data || []).map(alert => {
        if (alert.birthday_date) {
          const birthday = new Date(alert.birthday_date);
          const diffTime = birthday.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...alert, days_until_birthday: Math.max(0, diffDays) };
        }
        return alert;
      }).filter(alert => alert.days_until_birthday > 0);

      setAlerts(updatedAlerts as BirthdayAlert[]);
    } catch (err) {
      console.error('Error fetching birthday alerts:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, businessId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsViewed = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('business_birthday_alerts')
        .update({ 
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, status: 'viewed' as const, viewed_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Error marking alert as viewed:', err);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('business_birthday_alerts')
        .update({ status: 'dismissed' })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alerte ignorée');
    } catch (err) {
      console.error('Error dismissing alert:', err);
      toast.error('Erreur lors de l\'ignorement de l\'alerte');
    }
  }, []);

  const markFundCreated = useCallback(async (alertId: string, fundId: string) => {
    try {
      const { error } = await supabase
        .from('business_birthday_alerts')
        .update({ 
          status: 'fund_created',
          fund_id: fundId
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Cagnotte créée avec succès !');
    } catch (err) {
      console.error('Error marking fund created:', err);
    }
  }, []);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!businessId) return;

    const channel = supabase
      .channel('birthday-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_birthday_alerts',
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
  }, [businessId, fetchAlerts]);

  // Obtenir les alertes par produit
  const getAlertsForProduct = useCallback((productId: string) => {
    return alerts.filter(a => a.product_id === productId);
  }, [alerts]);

  // Obtenir le nombre d'alertes par priorité
  const alertCounts = {
    total: alerts.length,
    critical: alerts.filter(a => a.priority === 'critical').length,
    urgent: alerts.filter(a => a.priority === 'urgent').length,
    high: alerts.filter(a => a.priority === 'high').length,
    normal: alerts.filter(a => a.priority === 'normal').length
  };

  return {
    alerts,
    loading,
    error,
    alertCounts,
    fetchAlerts,
    markAsViewed,
    dismissAlert,
    markFundCreated,
    getAlertsForProduct
  };
}
