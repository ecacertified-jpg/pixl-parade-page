import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { 
  COUNTRIES, 
  DEFAULT_COUNTRY_CODE, 
  getCountryConfig, 
  isValidCountryCode,
  type CountryConfig 
} from "@/config/countries";
import { getCitiesForCountry, type CityCoordinates } from "@/utils/countryCities";

const STORAGE_KEY = "joiedevivre_country";

interface CountryContextType {
  country: CountryConfig;
  countryCode: string;
  setCountryCode: (code: string) => void;
  cities: CityCoordinates[];
  allCountries: CountryConfig[];
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

interface CountryProviderProps {
  children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
  const [countryCode, setCountryCodeState] = useState<string>(() => {
    // Initialize from localStorage or default
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidCountryCode(stored)) {
        return stored;
      }
    }
    return DEFAULT_COUNTRY_CODE;
  });

  const country = getCountryConfig(countryCode);
  const cities = getCitiesForCountry(countryCode);
  const allCountries = Object.values(COUNTRIES);

  const setCountryCode = (code: string) => {
    if (isValidCountryCode(code)) {
      setCountryCodeState(code);
      localStorage.setItem(STORAGE_KEY, code);
    }
  };

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidCountryCode(stored) && stored !== countryCode) {
      setCountryCodeState(stored);
    }
  }, []);

  return (
    <CountryContext.Provider 
      value={{ 
        country, 
        countryCode, 
        setCountryCode, 
        cities,
        allCountries 
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry(): CountryContextType {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return context;
}

// Hook to get just the country config without the setter
export function useCountryConfig(): CountryConfig {
  const { country } = useCountry();
  return country;
}

// Hook to get cities for the current country
export function useCountryCities(): CityCoordinates[] {
  const { cities } = useCountry();
  return cities;
}
