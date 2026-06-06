import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WaveRequest {
  id: string;
  user_id: string;
  plan_tier: 'essentiel' | 'premium';
  billing_cycle: 'monthly' | 'yearly';
  amount_xof: number;
  wave_link: string | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  transaction_reference: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWaveRequestPayload {
  plan_tier: 'essentiel' | 'premium';
  billing_cycle: 'monthly' | 'yearly';
}

export function usePendingWaveRequest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wave-subscription-pending', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('wave_subscription_requests')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as WaveRequest | null;
    },
    refetchInterval: 30_000,
  });
}

export function useCreateWaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWaveRequestPayload) => {
      const { data, error } = await supabase.functions.invoke('create-wave-subscription', {
        body: payload,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as {
        success: true;
        request_id: string;
        wave_link: string;
        wave_recipient: string;
        amount_xof: number;
        plan_tier: string;
        plan_name: string;
        billing_cycle: string;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wave-subscription-pending'] });
      qc.invalidateQueries({ queryKey: ['user-subscription'] });
    },
  });
}

export function useCancelWaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (request_id: string) => {
      const { data, error } = await supabase.functions.invoke('cancel-wave-subscription', {
        body: { request_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wave-subscription-pending'] });
    },
  });
}