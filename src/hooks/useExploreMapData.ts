import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { findCityAcrossCountries } from '@/utils/countryCities';
import { haversineDistance } from '@/utils/geoUtils';

export interface BusinessMapPoint {
  id: string;
  name: string;
  type: string | null;
  logo: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  isExactLocation: boolean;
  productCount: number;
  rating: number | null;
  ratingCount: number;
  countryCode: string | null;
}

export interface ExploreMapFilters {
  countryCode?: string;
  businessType?: string;
  nearMe?: { lat: number; lng: number; radiusKm: number };
}

export function useExploreMapData(filters?: ExploreMapFilters) {
  const [businesses, setBusinesses] = useState<BusinessMapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active businesses
      const { data: businessData, error: businessError } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, logo_url, address, latitude, longitude, country_code')
        .eq('is_active', true)
        .eq('status', 'approved');

      if (businessError) throw businessError;

      if (!businessData || businessData.length === 0) {
        setBusinesses([]);
        setLoading(false);
        return;
      }

      // Get product counts for all businesses
      const businessIds = businessData.map(b => b.id);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, business_account_id')
        .eq('is_active', true)
        .in('business_account_id', businessIds);

      const productCountMap: Record<string, number> = {};
      const productIdToBusinessMap: Record<string, string> = {};
      
      if (productsData) {
        productsData.forEach(p => {
          if (p.business_account_id) {
            productCountMap[p.business_account_id] = (productCountMap[p.business_account_id] || 0) + 1;
            productIdToBusinessMap[p.id] = p.business_account_id;
          }
        });
      }

      // Get ratings for all products
      const productIds = productsData?.map(p => p.id) || [];
      const ratingMap: Record<string, { sum: number; count: number }> = {};

      if (productIds.length > 0) {
        const { data: ratingsData } = await supabase
          .from('product_ratings')
          .select('product_id, rating')
          .in('product_id', productIds);

        if (ratingsData) {
          ratingsData.forEach(r => {
            const businessId = productIdToBusinessMap[r.product_id];
            if (businessId) {
              if (!ratingMap[businessId]) {
                ratingMap[businessId] = { sum: 0, count: 0 };
              }
              ratingMap[businessId].sum += r.rating;
              ratingMap[businessId].count += 1;
            }
          });
        }
      }

      // Process businesses with coordinates
      const points: BusinessMapPoint[] = [];

      businessData.forEach(business => {
        let lat = business.latitude;
        let lng = business.longitude;
        let isExact = !!(lat && lng);

        // Fallback to city coordinates if no precise location
        if (!lat || !lng) {
          const addressToSearch = business.address || '';
          const cityResult = findCityAcrossCountries(addressToSearch);
          
          if (cityResult) {
            lat = cityResult.city.lat;
            lng = cityResult.city.lng;
            isExact = false;
          }
        }

        // Skip if we couldn't determine coordinates
        if (!lat || !lng) return;

        const ratingInfo = ratingMap[business.id];
        const avgRating = ratingInfo && ratingInfo.count > 0 
          ? ratingInfo.sum / ratingInfo.count 
          : null;

        points.push({
          id: business.id,
          name: business.business_name,
          type: business.business_type,
          logo: business.logo_url,
          address: business.address,
          latitude: lat,
          longitude: lng,
          isExactLocation: isExact,
          productCount: productCountMap[business.id] || 0,
          rating: avgRating ? parseFloat(avgRating.toFixed(1)) : null,
          ratingCount: ratingInfo?.count || 0,
          countryCode: business.country_code,
        });
      });

      setBusinesses(points);
    } catch (err) {
      console.error('Error loading businesses for map:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  // Apply filters
  const filteredBusinesses = useMemo(() => {
    let result = businesses;

    if (filters?.countryCode) {
      result = result.filter(b => b.countryCode === filters.countryCode);
    }

    if (filters?.businessType) {
      result = result.filter(b => b.type === filters.businessType);
    }

    if (filters?.nearMe) {
      const { lat, lng, radiusKm } = filters.nearMe;
      result = result.filter(b => {
        const distance = haversineDistance(lat, lng, b.latitude, b.longitude);
        return distance <= radiusKm;
      });
    }

    return result;
  }, [businesses, filters?.countryCode, filters?.businessType, filters?.nearMe]);

  // Convert to GeoJSON for Supercluster
  const geoJsonPoints = useMemo(() => {
    return filteredBusinesses.map(business => ({
      type: 'Feature' as const,
      properties: {
        ...business,
        cluster: false,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [business.longitude, business.latitude] as [number, number],
      },
    }));
  }, [filteredBusinesses]);

  // Get unique business types for filter
  const businessTypes = useMemo(() => {
    const types = new Set(businesses.map(b => b.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [businesses]);

  return { 
    businesses: filteredBusinesses, 
    geoJsonPoints,
    businessTypes,
    loading, 
    error, 
    refetch: loadBusinesses 
  };
}
