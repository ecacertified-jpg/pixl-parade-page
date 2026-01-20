import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CityBusiness {
  id: string;
  business_name: string;
  logo_url: string | null;
  business_type: string | null;
  productCount: number;
}

/**
 * Hook to fetch active businesses for a specific city
 * Uses country_code and address matching for filtering
 */
export function useCityBusinesses(cityName: string, countryCode: string, limit = 6) {
  const [businesses, setBusinesses] = useState<CityBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      
      try {
        // First get businesses matching the city
        const { data: businessData, error: businessError } = await supabase
          .from('business_accounts')
          .select('id, business_name, logo_url, business_type, address')
          .eq('is_active', true)
          .eq('status', 'approved')
          .eq('country_code', countryCode)
          .ilike('address', `%${cityName}%`)
          .limit(limit);

        if (businessError) {
          console.error('Error fetching city businesses:', businessError);
          setBusinesses([]);
          setLoading(false);
          return;
        }

        if (!businessData || businessData.length === 0) {
          // Fallback: try matching by country only if no city match
          const { data: countryData } = await supabase
            .from('business_accounts')
            .select('id, business_name, logo_url, business_type, address')
            .eq('is_active', true)
            .eq('status', 'approved')
            .eq('country_code', countryCode)
            .limit(limit);

          if (countryData && countryData.length > 0) {
            // Get product counts for each business
            const businessesWithCounts = await Promise.all(
              countryData.map(async (business) => {
                const { count } = await supabase
                  .from('products')
                  .select('*', { count: 'exact', head: true })
                  .eq('business_id', business.id)
                  .eq('is_active', true);

                return {
                  id: business.id,
                  business_name: business.business_name,
                  logo_url: business.logo_url,
                  business_type: business.business_type,
                  productCount: count || 0,
                };
              })
            );

            setBusinesses(businessesWithCounts);
          } else {
            setBusinesses([]);
          }
        } else {
          // Get product counts for matched businesses
          const businessesWithCounts = await Promise.all(
            businessData.map(async (business) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('business_id', business.id)
                .eq('is_active', true);

              return {
                id: business.id,
                business_name: business.business_name,
                logo_url: business.logo_url,
                business_type: business.business_type,
                productCount: count || 0,
              };
            })
          );

          setBusinesses(businessesWithCounts);
        }
      } catch (error) {
        console.error('Error in useCityBusinesses:', error);
        setBusinesses([]);
      }
      
      setLoading(false);
    };

    if (cityName && countryCode) {
      fetchBusinesses();
    }
  }, [cityName, countryCode, limit]);

  return { businesses, loading };
}
