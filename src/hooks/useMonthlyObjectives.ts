import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonthlyObjective {
  id: string;
  year: number;
  month: number;
  metric_type: string;
  target_value: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useMonthlyObjectives(year: number) {
  const [objectives, setObjectives] = useState<MonthlyObjective[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error fetching objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
  }, [year]);

  const setObjective = async (
    month: number,
    metricType: string,
    targetValue: number,
    notes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('monthly_objectives')
        .upsert({
          year,
          month,
          metric_type: metricType,
          target_value: targetValue,
          notes: notes || null,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'year,month,metric_type'
        });

      if (error) throw error;
      
      toast.success('Objectif enregistré');
      await fetchObjectives();
    } catch (error) {
      console.error('Error setting objective:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const deleteObjective = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monthly_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Objectif supprimé');
      await fetchObjectives();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const copyFromYear = async (fromYear: number) => {
    try {
      const { data: sourceObjectives, error: fetchError } = await supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', fromYear);

      if (fetchError) throw fetchError;
      if (!sourceObjectives || sourceObjectives.length === 0) {
        toast.error('Aucun objectif à copier pour cette année');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const newObjectives = sourceObjectives.map(obj => ({
        year,
        month: obj.month,
        metric_type: obj.metric_type,
        target_value: obj.target_value,
        notes: obj.notes,
        created_by: user?.id
      }));

      const { error: insertError } = await supabase
        .from('monthly_objectives')
        .upsert(newObjectives, {
          onConflict: 'year,month,metric_type'
        });

      if (insertError) throw insertError;
      
      toast.success(`${newObjectives.length} objectifs copiés`);
      await fetchObjectives();
    } catch (error) {
      console.error('Error copying objectives:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const getObjectiveValue = (month: number, metricType: string): number | null => {
    const objective = objectives.find(
      obj => obj.month === month && obj.metric_type === metricType
    );
    return objective?.target_value ?? null;
  };

  return {
    objectives,
    loading,
    setObjective,
    deleteObjective,
    copyFromYear,
    getObjectiveValue,
    refresh: fetchObjectives
  };
}
