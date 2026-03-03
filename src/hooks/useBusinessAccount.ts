import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BusinessAccount {
  id: string;
  business_name: string;
  business_type?: string;
  is_active: boolean;
  description?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  website_url?: string;
  latitude?: number | null;
  longitude?: number | null;
}

const fetchBusinessAccount = async (userId: string): Promise<BusinessAccount | null> => {
  const { data, error } = await supabase
    .from('business_accounts')
    .select('id, business_name, business_type, is_active, description, logo_url, email, phone, address, website_url, latitude, longitude')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking business account:', error);
    return null;
  }
  return data;
};

export const useBusinessAccount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: businessAccount = null, isLoading: loading } = useQuery({
    queryKey: ['business-account', user?.id],
    queryFn: () => fetchBusinessAccount(user!.id),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  const hasBusinessAccount = businessAccount !== null;
  const isActiveBusinessAccount = businessAccount?.is_active === true;

  return {
    businessAccount,
    hasBusinessAccount,
    isActiveBusinessAccount,
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['business-account', user?.id] }),
  };
};
