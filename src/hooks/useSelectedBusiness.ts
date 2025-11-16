import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Business {
  id: string;
  business_name: string;
  business_type?: string;
  is_active: boolean;
  logo_url?: string;
}

const SELECTED_BUSINESS_KEY = 'joie_de_vivre_selected_business_id';

export const useSelectedBusiness = () => {
  const { user } = useAuth();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les business de l'utilisateur
  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setSelectedBusinessId(null);
      setLoading(false);
      return;
    }

    loadBusinesses();
  }, [user]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, is_active, logo_url')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading businesses:', error);
        return;
      }

      setBusinesses(data || []);

      // Restaurer le business sélectionné depuis localStorage ou sélectionner le premier
      const savedBusinessId = localStorage.getItem(SELECTED_BUSINESS_KEY);
      const businessExists = data?.some(b => b.id === savedBusinessId);

      if (savedBusinessId && businessExists) {
        setSelectedBusinessId(savedBusinessId);
      } else if (data && data.length > 0) {
        // Sélectionner automatiquement le premier business actif ou le premier de la liste
        const activeBusiness = data.find(b => b.is_active) || data[0];
        setSelectedBusinessId(activeBusiness.id);
        localStorage.setItem(SELECTED_BUSINESS_KEY, activeBusiness.id);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId);
    localStorage.setItem(SELECTED_BUSINESS_KEY, businessId);
  };

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return {
    selectedBusinessId,
    selectedBusiness,
    businesses,
    loading,
    selectBusiness,
    refetch: loadBusinesses,
  };
};
