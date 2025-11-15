import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralCodeStats {
  total_views: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  conversion_rate: number;
  top_sources: Array<{ source: string; count: number }> | null;
  geographic_distribution: Array<{ country: string; count: number }> | null;
  timeline: Array<{ date: string; signups: number }> | null;
}

export const useReferralCodeStats = (codeId?: string) => {
  const [stats, setStats] = useState<ReferralCodeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!codeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_referral_code_stats', {
        code_id: codeId,
      });

      if (error) throw error;

      setStats(data as any as ReferralCodeStats);
    } catch (error) {
      console.error('Error fetching referral code stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [codeId]);

  return { stats, loading, refetch: fetchStats };
};
