import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { 
  COUNTRIES, 
  DEFAULT_COUNTRY_CODE, 
  getCountryConfig, 
  isValidCountryCode,
  type CountryConfig 
} from "@/config/countries";
import { getCitiesForCountry, type CityCoordinates } from "@/utils/countryCities";
import { detectUserCountry } from "@/utils/countryDetection";

const STORAGE_KEY = "joiedevivre_country";
const AUTO_DETECTED_KEY = "joiedevivre_country_auto_detected";

interface CountryContextType {
  country: CountryConfig;
  countryCode: string;
  setCountryCode: (code: string) => void;
  cities: CityCoordinates[];
  allCountries: CountryConfig[];
  isDetecting: boolean;
  wasAutoDetected: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

interface CountryProviderProps {
  children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
  const [countryCode, setCountryCodeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidCountryCode(stored)) {
        return stored;
      }
    }
    return DEFAULT_COUNTRY_CODE;
  });

  const [isDetecting, setIsDetecting] = useState(false);
  const [wasAutoDetected, setWasAutoDetected] = useState(false);

  const country = getCountryConfig(countryCode);
  const cities = getCitiesForCountry(countryCode);
  const allCountries = Object.values(COUNTRIES);

  const setCountryCode = (code: string) => {
    if (isValidCountryCode(code)) {
      setCountryCodeState(code);
      localStorage.setItem(STORAGE_KEY, code);
    }
  };

  // Auto-detect country on first visit
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const alreadyDetected = localStorage.getItem(AUTO_DETECTED_KEY);

    // Only auto-detect if no stored preference and not already attempted
    if (!stored && !alreadyDetected) {
      setIsDetecting(true);
      
      detectUserCountry(false).then((detectedCode) => {
        if (isValidCountryCode(detectedCode)) {
          setCountryCodeState(detectedCode);
          localStorage.setItem(STORAGE_KEY, detectedCode);
          
          // Only mark as auto-detected if it's different from default
          if (detectedCode !== DEFAULT_COUNTRY_CODE) {
            setWasAutoDetected(true);
          }
        }
        
        // Mark that we've attempted detection
        localStorage.setItem(AUTO_DETECTED_KEY, 'true');
        setIsDetecting(false);
      });
    }
  }, []);

  return (
    <CountryContext.Provider 
      value={{ 
        country, 
        countryCode, 
        setCountryCode, 
        cities,
        allCountries,
        isDetecting,
        wasAutoDetected
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
