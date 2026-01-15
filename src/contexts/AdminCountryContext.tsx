import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CountryConfig, getAllCountries } from '@/config/countries';

interface AdminCountryContextType {
  selectedCountry: string | null; // null = tous les pays
  setSelectedCountry: (code: string | null) => void;
  allCountries: CountryConfig[];
  getCountryFilter: () => string | null; // Pour les requêtes Supabase
}

const AdminCountryContext = createContext<AdminCountryContextType | undefined>(undefined);

export function AdminCountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const allCountries = getAllCountries();

  // Retourne le filtre à utiliser pour les requêtes
  const getCountryFilter = () => selectedCountry;

  return (
    <AdminCountryContext.Provider value={{
      selectedCountry,
      setSelectedCountry,
      allCountries,
      getCountryFilter,
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
