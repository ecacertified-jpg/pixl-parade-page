import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StrugglingCountry {
  id: string;
  countryCode: string;
  countryName: string;
  flag: string;
  isStruggling: boolean;
  severity: 'warning' | 'critical';
  strugglingSince: string | null;
  lastStatusChange: string | null;
  strugglingMetrics: string[];
  metricsDetails: Record<string, number>;
}

const COUNTRY_NAMES: Record<string, string> = {
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BJ: "Bénin",
  ML: "Mali",
  BF: "Burkina Faso",
  TG: "Togo",
};

const COUNTRY_FLAGS: Record<string, string> = {
  CI: "🇨🇮",
  SN: "🇸🇳",
  BJ: "🇧🇯",
  ML: "🇲🇱",
  BF: "🇧🇫",
  TG: "🇹🇬",
};

export function useStrugglingCountries() {
  const { user } = useAuth();
  const [countries, setCountries] = useState<StrugglingCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStrugglingCountries = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('country_struggling_status')
        .select('*')
        .eq('is_struggling', true)
        .order('severity', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: StrugglingCountry[] = (data || []).map(row => ({
        id: row.id,
        countryCode: row.country_code,
        countryName: COUNTRY_NAMES[row.country_code] || row.country_code,
        flag: COUNTRY_FLAGS[row.country_code] || '🌍',
        isStruggling: row.is_struggling,
        severity: row.severity as 'warning' | 'critical',
        strugglingSince: row.struggling_since,
        lastStatusChange: row.last_status_change,
        strugglingMetrics: row.struggling_metrics || [],
        metricsDetails: (row.metadata as any)?.details || {},
      }));

      setCountries(mapped);
    } catch (err) {
      console.error('Error fetching struggling countries:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStrugglingCountries();
  }, [fetchStrugglingCountries]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('struggling-countries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'country_struggling_status' },
        () => {
          fetchStrugglingCountries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchStrugglingCountries]);

  const criticalCount = countries.filter(c => c.severity === 'critical').length;
  const warningCount = countries.filter(c => c.severity === 'warning').length;

  return {
    countries,
    criticalCount,
    warningCount,
    totalCount: countries.length,
    loading,
    error,
    refresh: fetchStrugglingCountries,
  };
}
