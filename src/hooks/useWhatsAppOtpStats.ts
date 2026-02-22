import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OtpDailyData {
  date: string;
  sent: number;
  verified: number;
}

export interface OtpCountryData {
  country_code: string;
  total: number;
  verified: number;
}

export interface OtpRecentEntry {
  id: string;
  phone: string;
  created_at: string;
  verified_at: string | null;
  expires_at: string;
  attempts: number;
  status: 'verified' | 'expired' | 'pending';
  verification_seconds: number | null;
}

export interface WhatsAppOtpStats {
  total_sent: number;
  total_verified: number;
  total_expired: number;
  success_rate: number;
  avg_verification_seconds: number;
  avg_attempts: number;
  daily: OtpDailyData[];
  by_country: OtpCountryData[];
  recent: OtpRecentEntry[];
}

export function useWhatsAppOtpStats(daysBack: number = 30) {
  return useQuery({
    queryKey: ['whatsapp-otp-stats', daysBack],
    queryFn: async (): Promise<WhatsAppOtpStats> => {
      const { data, error } = await supabase.rpc('get_whatsapp_otp_stats', {
        days_back: daysBack,
      });

      if (error) throw error;
      return data as unknown as WhatsAppOtpStats;
    },
    staleTime: 60_000,
  });
}
