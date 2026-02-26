import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryKpis {
  total: number;
  total_sent: number;
  total_failed: number;
  whatsapp_sent: number;
  whatsapp_failed: number;
  sms_sent: number;
  sms_failed: number;
  whatsapp_success_rate: number;
  sms_success_rate: number;
}

export interface DailyDelivery {
  date: string;
  whatsapp_sent: number;
  whatsapp_failed: number;
  sms_sent: number;
  sms_failed: number;
}

export interface AlertTypeBreakdown {
  alert_type: string;
  wa_sent: number;
  wa_failed: number;
  sms_sent: number;
  sms_failed: number;
  total: number;
  success_rate: number;
}

export interface CountryBreakdown {
  country_prefix: string;
  total: number;
  sent: number;
  failed: number;
  whatsapp_count: number;
  sms_count: number;
  success_rate: number;
}

export interface TopError {
  error_message: string;
  channel: string;
  occurrences: number;
  last_occurrence: string;
}

export interface MessagingDeliveryStats {
  kpis: DeliveryKpis;
  daily: DailyDelivery[];
  by_alert_type: AlertTypeBreakdown[];
  by_country: CountryBreakdown[];
  top_errors: TopError[];
}

function periodToDays(period: string): number {
  switch (period) {
    case 'today': return 1;
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    default: return 30;
  }
}

export function useMessagingDeliveryStats(period: string = '30days') {
  const daysBack = periodToDays(period);

  return useQuery({
    queryKey: ['messaging-delivery-stats', daysBack],
    queryFn: async (): Promise<MessagingDeliveryStats> => {
      const { data, error } = await supabase.rpc('get_messaging_delivery_stats', {
        days_back: daysBack,
      });
      if (error) throw error;
      return data as unknown as MessagingDeliveryStats;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
