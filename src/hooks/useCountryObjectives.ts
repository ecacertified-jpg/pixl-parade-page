import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CountryObjective {
  id: string;
  year: number;
  month: number;
  metric_type: string;
  target_value: number;
  country_code: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetObjectiveParams {
  countryCode: string | null;
  month: number;
  metricType: string;
  targetValue: number;
  notes?: string;
}

export function useCountryObjectives(year: number, countryCode?: string | null) {
  const [objectives, setObjectives] = useState<CountryObjective[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchObjectives = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', year)
        .order('month', { ascending: true });

      // Filter by country if specified
      if (countryCode !== undefined) {
        if (countryCode === null) {
          query = query.is('country_code', null);
        } else {
          query = query.eq('country_code', countryCode);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setObjectives((data || []) as CountryObjective[]);
    } catch (error) {
      console.error('Error fetching country objectives:', error);
    } finally {
      setLoading(false);
    }
  }, [year, countryCode]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const setObjective = async ({
    countryCode: targetCountryCode,
    month,
    metricType,
    targetValue,
    notes
  }: SetObjectiveParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('monthly_objectives')
        .upsert({
          year,
          month,
          metric_type: metricType,
          target_value: targetValue,
          country_code: targetCountryCode,
          notes: notes || null,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'year,month,metric_type,country_code'
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

  const getObjectiveValue = (
    targetCountryCode: string | null,
    month: number,
    metricType: string
  ): number | null => {
    const objective = objectives.find(
      obj => 
        obj.month === month && 
        obj.metric_type === metricType &&
        obj.country_code === targetCountryCode
    );
    return objective?.target_value ?? null;
  };

  const getAchievementRate = (
    targetCountryCode: string | null,
    month: number,
    metricType: string,
    actualValue: number
  ): number => {
    const target = getObjectiveValue(targetCountryCode, month, metricType);
    if (!target || target === 0) return 0;
    return (actualValue / target) * 100;
  };

  const copyFromCountry = async (fromCountry: string, toCountry: string) => {
    try {
      const { data: sourceObjectives, error: fetchError } = await supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', year)
        .eq('country_code', fromCountry);

      if (fetchError) throw fetchError;
      if (!sourceObjectives || sourceObjectives.length === 0) {
        toast.error('Aucun objectif à copier pour ce pays');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const newObjectives = sourceObjectives.map(obj => ({
        year,
        month: obj.month,
        metric_type: obj.metric_type,
        target_value: obj.target_value,
        country_code: toCountry,
        notes: obj.notes,
        created_by: user?.id
      }));

      const { error: insertError } = await supabase
        .from('monthly_objectives')
        .upsert(newObjectives, {
          onConflict: 'year,month,metric_type,country_code'
        });

      if (insertError) throw insertError;
      
      toast.success(`${newObjectives.length} objectifs copiés`);
      await fetchObjectives();
    } catch (error) {
      console.error('Error copying objectives:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const copyFromYear = async (fromYear: number, targetCountryCode: string | null) => {
    try {
      let query = supabase
        .from('monthly_objectives')
        .select('*')
        .eq('year', fromYear);

      if (targetCountryCode === null) {
        query = query.is('country_code', null);
      } else {
        query = query.eq('country_code', targetCountryCode);
      }

      const { data: sourceObjectives, error: fetchError } = await query;

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
        country_code: targetCountryCode,
        notes: obj.notes,
        created_by: user?.id
      }));

      const { error: insertError } = await supabase
        .from('monthly_objectives')
        .upsert(newObjectives, {
          onConflict: 'year,month,metric_type,country_code'
        });

      if (insertError) throw insertError;
      
      toast.success(`${newObjectives.length} objectifs copiés`);
      await fetchObjectives();
    } catch (error) {
      console.error('Error copying objectives from year:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const bulkSetObjectives = async (objectivesToSet: SetObjectiveParams[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const records = objectivesToSet.map(obj => ({
        year,
        month: obj.month,
        metric_type: obj.metricType,
        target_value: obj.targetValue,
        country_code: obj.countryCode,
        notes: obj.notes || null,
        created_by: user?.id,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('monthly_objectives')
        .upsert(records, {
          onConflict: 'year,month,metric_type,country_code'
        });

      if (error) throw error;
      
      toast.success(`${records.length} objectifs enregistrés`);
      await fetchObjectives();
    } catch (error) {
      console.error('Error bulk setting objectives:', error);
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return {
    objectives,
    loading,
    setObjective,
    deleteObjective,
    getObjectiveValue,
    getAchievementRate,
    copyFromCountry,
    copyFromYear,
    bulkSetObjectives,
    refresh: fetchObjectives
  };
}
