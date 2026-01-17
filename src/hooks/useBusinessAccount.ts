import { useState, useEffect } from 'react';
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

export const useBusinessAccount = () => {
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setBusinessAccount(null);
      setLoading(false);
      return;
    }

    checkBusinessAccount();
  }, [user]);

  const checkBusinessAccount = async () => {
    try {
      // Use order + limit to avoid "multiple rows" error with maybeSingle
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, is_active, description, logo_url, email, phone, address, website_url, latitude, longitude')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking business account:', error);
        setBusinessAccount(null);
      } else {
        setBusinessAccount(data);
      }
    } catch (error) {
      console.error('Error checking business account:', error);
      setBusinessAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const hasBusinessAccount = businessAccount !== null;
  const isActiveBusinessAccount = businessAccount?.is_active === true;

  return {
    businessAccount,
    hasBusinessAccount,
    isActiveBusinessAccount,
    loading,
    refetch: checkBusinessAccount,
  };
};