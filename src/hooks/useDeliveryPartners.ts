import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryPartner, CoverageZone } from '@/types/delivery';
import { toast } from 'sonner';

export function useDeliveryPartners() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false });

      if (queryError) throw queryError;

      // Transform data to match our TypeScript types
      const transformedPartners: DeliveryPartner[] = (data || []).map((partner: any) => ({
        id: partner.id,
        user_id: partner.user_id,
        company_name: partner.company_name,
        contact_name: partner.contact_name,
        phone: partner.phone,
        email: partner.email,
        vehicle_type: partner.vehicle_type,
        license_plate: partner.license_plate,
        coverage_zones: (partner.coverage_zones as CoverageZone[]) || [],
        is_active: partner.is_active,
        is_verified: partner.is_verified,
        rating: partner.rating || 0,
        total_deliveries: partner.total_deliveries || 0,
        latitude: partner.latitude,
        longitude: partner.longitude,
        created_at: partner.created_at,
        updated_at: partner.updated_at
      }));

      setPartners(transformedPartners);
    } catch (err) {
      console.error('Error loading delivery partners:', err);
      setError(err instanceof Error ? err : new Error('Erreur de chargement des livreurs'));
      toast.error('Impossible de charger les livreurs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter partners by coverage zone
  const getAvailablePartners = useCallback((zoneName?: string): DeliveryPartner[] => {
    if (!zoneName) return partners;

    return partners.filter(partner => 
      partner.coverage_zones.some(zone => 
        zone.name.toLowerCase().includes(zoneName.toLowerCase())
      )
    );
  }, [partners]);

  // Get a single partner by ID
  const getPartnerById = useCallback((partnerId: string): DeliveryPartner | undefined => {
    return partners.find(p => p.id === partnerId);
  }, [partners]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  return {
    partners,
    loading,
    error,
    loadPartners,
    getAvailablePartners,
    getPartnerById
  };
}
