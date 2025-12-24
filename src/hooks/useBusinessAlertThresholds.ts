import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessAlertThreshold {
  id: string;
  metric_type: 'revenue' | 'orders' | 'inactivity' | 'rating' | 'conversion_rate';
  threshold_type: 'percentage_drop' | 'absolute_drop' | 'inactivity_days';
  warning_threshold: number;
  critical_threshold: number;
  comparison_period: 'day' | 'week' | 'month' | 'quarter';
  is_active: boolean;
  notify_business: boolean;
  notify_admin: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusinessAlertThresholds() {
  const [thresholds, setThresholds] = useState<BusinessAlertThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchThresholds = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('business_alert_thresholds')
        .select('*')
        .order('metric_type');

      if (error) throw error;

      setThresholds((data || []) as BusinessAlertThreshold[]);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast.error('Erreur lors du chargement des seuils');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const updateThreshold = async (
    id: string, 
    updates: Partial<Omit<BusinessAlertThreshold, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setUpdating(true);

      const { error } = await supabase
        .from('business_alert_thresholds')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setThresholds(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      toast.success('Seuil mis à jour');
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await updateThreshold(id, { is_active: isActive });
  };

  const toggleNotifyBusiness = async (id: string, notify: boolean) => {
    await updateThreshold(id, { notify_business: notify });
  };

  const toggleNotifyAdmin = async (id: string, notify: boolean) => {
    await updateThreshold(id, { notify_admin: notify });
  };

  return {
    thresholds,
    loading,
    updating,
    fetchThresholds,
    updateThreshold,
    toggleActive,
    toggleNotifyBusiness,
    toggleNotifyAdmin,
  };
}
