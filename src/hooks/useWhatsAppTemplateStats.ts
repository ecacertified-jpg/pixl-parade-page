import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WaTemplateKpis {
  total: number;
  sent: number;
  failed: number;
  success_rate: number;
  templates_count: number;
}

export interface WaTemplateRow {
  template_name: string;
  total: number;
  sent: number;
  failed: number;
  success_rate: number;
}

export interface WaCountryRow {
  country_prefix: string;
  total: number;
  sent: number;
  failed: number;
  success_rate: number;
}

export interface WaDailyRow {
  day: string;
  total: number;
  sent: number;
  failed: number;
}

export interface WaErrorRow {
  error_message: string;
  template_name: string;
  occurrences: number;
  last_occurrence: string;
}

export interface WaTemplateStats {
  kpis: WaTemplateKpis;
  by_template: WaTemplateRow[];
  by_country: WaCountryRow[];
  daily: WaDailyRow[];
  top_errors: WaErrorRow[];
}

const COUNTRY_NAMES: Record<string, string> = {
  '+225': 'Côte d\'Ivoire',
  '+221': 'Sénégal',
  '+229': 'Bénin',
  '+228': 'Togo',
  '+223': 'Mali',
  '+226': 'Burkina Faso',
  '+227': 'Niger',
};

export function getCountryName(prefix: string | null): string {
  if (!prefix) return 'Inconnu';
  return COUNTRY_NAMES[prefix] || prefix;
}

const periodToDays: Record<string, number> = {
  today: 1,
  '7days': 7,
  '30days': 30,
  '90days': 90,
};

export function useWhatsAppTemplateStats(period: string = '30days') {
  const daysBack = periodToDays[period] || 30;

  return useQuery<WaTemplateStats>({
    queryKey: ['whatsapp-template-stats', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_whatsapp_template_stats', {
        days_back: daysBack,
      });
      if (error) throw error;
      return data as unknown as WaTemplateStats;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
