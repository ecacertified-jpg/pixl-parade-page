import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Business {
  id: string;
  business_name: string;
  business_type?: string;
  is_active: boolean;
  logo_url?: string;
}

interface SelectedBusinessContextType {
  selectedBusinessId: string | null;
  selectedBusiness: Business | undefined;
  businesses: Business[];
  loading: boolean;
  selectBusiness: (businessId: string) => void;
  refetch: () => Promise<void>;
}

const SelectedBusinessContext = createContext<SelectedBusinessContextType | undefined>(undefined);

const SELECTED_BUSINESS_KEY = 'joie_de_vivre_selected_business_id';

export const SelectedBusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBusinesses = async () => {
    if (!user) {
      setBusinesses([]);
      setSelectedBusinessId(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, is_active, logo_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading businesses:', error);
        return;
      }

      console.log('✅ [Context] Loaded businesses:', data?.length || 0);
      setBusinesses(data || []);

      // Nettoyage agressif du localStorage
      const savedBusinessId = localStorage.getItem(SELECTED_BUSINESS_KEY);
      const businessBelongsToUser = data?.some(b => b.id === savedBusinessId);

      if (savedBusinessId && !businessBelongsToUser) {
        console.warn('🧹 CRITICAL: Business ID does not belong to current user:', savedBusinessId);
        console.warn('🧹 Cleaning ALL business-related localStorage keys...');
        
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
        console.log('✅ [Context] Restoring saved business:', savedBusinessId);
        setSelectedBusinessId(savedBusinessId);
      } else if (data && data.length > 0) {
        const activeBusiness = data.find(b => b.is_active) || data[0];
        console.log('✅ [Context] Auto-selecting business:', activeBusiness.id, '-', activeBusiness.business_name);
        setSelectedBusinessId(activeBusiness.id);
        localStorage.setItem(SELECTED_BUSINESS_KEY, activeBusiness.id);
      } else {
        console.log('ℹ️ [Context] No businesses found for user');
        setSelectedBusinessId(null);
        localStorage.removeItem(SELECTED_BUSINESS_KEY);
      }
    } catch (error) {
      console.error('❌ [Context] Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [user?.id]);

  const selectBusiness = (businessId: string) => {
    console.log('✅ [Context] Selecting business:', businessId);
    setSelectedBusinessId(businessId);
    localStorage.setItem(SELECTED_BUSINESS_KEY, businessId);
  };

  const value: SelectedBusinessContextType = {
    selectedBusinessId,
    selectedBusiness: businesses.find(b => b.id === selectedBusinessId),
    businesses,
    loading,
    selectBusiness,
    refetch: loadBusinesses,
  };

  return (
    <SelectedBusinessContext.Provider value={value}>
      {children}
    </SelectedBusinessContext.Provider>
  );
};

export const useSelectedBusiness = () => {
  const context = useContext(SelectedBusinessContext);
  if (!context) {
    throw new Error('useSelectedBusiness must be used within SelectedBusinessProvider');
  }
  return context;
};
