import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { CountryConfig, getAllCountries } from '@/config/countries';
import { useAdmin } from '@/hooks/useAdmin';

interface AdminCountryContextType {
  selectedCountry: string | null; // null = tous les pays
  setSelectedCountry: (code: string | null) => void;
  allCountries: CountryConfig[];
  accessibleCountries: CountryConfig[]; // Countries the admin can access
  getCountryFilter: () => string | null; // Pour les requêtes Supabase
  canAccessCountry: (code: string) => boolean;
  isRestricted: boolean; // True if admin has country restrictions
}

const AdminCountryContext = createContext<AdminCountryContextType | undefined>(undefined);

export function AdminCountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<string | null>(null);
  const allCountries = getAllCountries();
  const { isSuperAdmin, assignedCountries, canAccessCountry: adminCanAccessCountry } = useAdmin();

  // Calculate accessible countries based on admin's assigned countries
  const accessibleCountries = useMemo(() => {
    if (isSuperAdmin || !assignedCountries || assignedCountries.length === 0) {
      return allCountries;
    }
    return allCountries.filter(c => assignedCountries.includes(c.code));
  }, [isSuperAdmin, assignedCountries, allCountries]);

  // Determine if admin has country restrictions
  const isRestricted = !isSuperAdmin && assignedCountries !== null && assignedCountries.length > 0;

  // Set initial selected country for restricted admins
  useEffect(() => {
    if (isRestricted && assignedCountries && assignedCountries.length > 0) {
      // If admin has only one country, auto-select it
      if (assignedCountries.length === 1) {
        setSelectedCountryState(assignedCountries[0]);
      }
    }
  }, [isRestricted, assignedCountries]);

  // Wrapped setSelectedCountry that validates access
  const setSelectedCountry = (code: string | null) => {
    if (code === null) {
      // Only super admins can select "all countries"
      if (isSuperAdmin) {
        setSelectedCountryState(null);
      }
      return;
    }
    
    // Check if admin can access this country
    if (adminCanAccessCountry(code)) {
      setSelectedCountryState(code);
    }
  };

  // Retourne le filtre à utiliser pour les requêtes
  const getCountryFilter = () => {
    // If a specific country is selected, use it
    if (selectedCountry) return selectedCountry;
    
    // For restricted admins with no selection, return first assigned country
    if (isRestricted && assignedCountries && assignedCountries.length > 0) {
      return assignedCountries.length === 1 ? assignedCountries[0] : null;
    }
    
    return null;
  };

  // Check if current admin can access a country
  const canAccessCountry = (code: string): boolean => {
    return adminCanAccessCountry(code);
  };

  return (
    <AdminCountryContext.Provider value={{
      selectedCountry,
      setSelectedCountry,
      allCountries,
      accessibleCountries,
      getCountryFilter,
      canAccessCountry,
      isRestricted,
    }}>
      {children}
    </AdminCountryContext.Provider>
  );
}

export function useAdminCountry() {
  const context = useContext(AdminCountryContext);
  if (!context) {
    throw new Error('useAdminCountry must be used within AdminCountryProvider');
  }
  return context;
}
