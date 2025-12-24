import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GrowthThreshold {
  id: string;
  metric_type: 'users' | 'businesses' | 'revenue' | 'orders';
  threshold_type: 'absolute' | 'percentage' | 'daily_count';
  threshold_value: number;
  comparison_period: 'day' | 'week' | 'month';
  is_active: boolean;
  notify_methods: string[];
  created_at: string;
  updated_at: string;
}

export function useGrowthThresholds() {
  const [thresholds, setThresholds] = useState<GrowthThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('growth_alert_thresholds')
        .select('*')
        .order('metric_type', { ascending: true })
        .order('threshold_type', { ascending: true });

      if (error) throw error;

      setThresholds((data || []) as GrowthThreshold[]);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateThreshold = async (id: string, updates: Partial<GrowthThreshold>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('growth_alert_thresholds')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setThresholds(prev => prev.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ));
      toast.success('Seuil mis à jour');
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const createThreshold = async (threshold: Omit<GrowthThreshold, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('growth_alert_thresholds')
        .insert(threshold)
        .select()
        .single();

      if (error) throw error;

      setThresholds(prev => [...prev, data as GrowthThreshold]);
      toast.success('Nouveau seuil créé');
      return data as GrowthThreshold;
    } catch (error) {
      console.error('Error creating threshold:', error);
      toast.error('Erreur lors de la création');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteThreshold = async (id: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('growth_alert_thresholds')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setThresholds(prev => prev.filter(t => t.id !== id));
      toast.success('Seuil supprimé');
    } catch (error) {
      console.error('Error deleting threshold:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const toggleThreshold = async (id: string, isActive: boolean) => {
    await updateThreshold(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  return {
    thresholds,
    loading,
    saving,
    updateThreshold,
    createThreshold,
    deleteThreshold,
    toggleThreshold,
    refetch: fetchThresholds,
  };
}
