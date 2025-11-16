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

      console.log('✅ Loaded businesses for user:', user?.id, '- Count:', data?.length || 0);
      setBusinesses(data || []);

      // PHASE 2: Nettoyage agressif du localStorage
      const savedBusinessId = localStorage.getItem(SELECTED_BUSINESS_KEY);
      const businessBelongsToUser = data?.some(b => b.id === savedBusinessId);

      // Si l'ID sauvegardé n'appartient pas à l'utilisateur, nettoyer TOUT le localStorage lié
      if (savedBusinessId && !businessBelongsToUser) {
        console.warn('🧹 CRITICAL: Business ID does not belong to current user:', savedBusinessId);
        console.warn('🧹 Cleaning ALL business-related localStorage keys...');
        
        // Supprimer toutes les clés liées à business ou joie_de_vivre
        Object.keys(localStorage).forEach(key => {
          if (key.includes('business') || key.includes('joie_de_vivre')) {
            console.log('🧹 Removing localStorage key:', key);
            localStorage.removeItem(key);
          }
        });
        
        console.log('✅ localStorage cleaned successfully');
      }

      // Sélectionner le business approprié
      if (savedBusinessId && businessBelongsToUser) {
        console.log('✅ Restoring saved business:', savedBusinessId);
        setSelectedBusinessId(savedBusinessId);
      } else if (data && data.length > 0) {
        // Sélectionner automatiquement le premier business actif ou le premier de la liste
        const activeBusiness = data.find(b => b.is_active) || data[0];
        console.log('✅ Auto-selecting business:', activeBusiness.id, '-', activeBusiness.business_name);
        setSelectedBusinessId(activeBusiness.id);
        localStorage.setItem(SELECTED_BUSINESS_KEY, activeBusiness.id);
      } else {
        console.log('ℹ️ No businesses found for user');
        setSelectedBusinessId(null);
        localStorage.removeItem(SELECTED_BUSINESS_KEY);
      }
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
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
