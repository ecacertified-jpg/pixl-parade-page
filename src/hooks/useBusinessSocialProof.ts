import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCountry } from '@/contexts/CountryContext';

interface SocialProof {
  vendorsInCountry: number;
  productsInCountry: number;
  loading: boolean;
}

/**
 * Lightweight social-proof signals to incentivize vendor onboarding.
 * Pulls counts of active vendors / products in the current country.
 */
export const useBusinessSocialProof = (): SocialProof => {
  const { countryCode } = useCountry();
  const [vendorsInCountry, setVendorsInCountry] = useState(0);
  const [productsInCountry, setProductsInCountry] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [vendors, products] = await Promise.all([
          supabase
            .from('business_accounts')
            .select('id', { count: 'exact', head: true })
            .eq('country_code', countryCode)
            .eq('is_active', true)
            .eq('status', 'active'),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('country_code', countryCode)
            .eq('is_active', true),
        ]);
        if (cancelled) return;
        setVendorsInCountry(vendors.count || 0);
        setProductsInCountry(products.count || 0);
      } catch (e) {
        console.error('useBusinessSocialProof error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [countryCode]);

  return { vendorsInCountry, productsInCountry, loading };
};