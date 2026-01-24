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
import { supabase } from "@/integrations/supabase/client";

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
  showAllCountries: boolean;
  setShowAllCountries: (value: boolean) => void;
  effectiveCountryFilter: string | null; // null = all countries
  
  // New: Profile country for hybrid filtering
  profileCountryCode: string | null;
  isVisiting: boolean; // true if current country differs from profile country
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
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [profileCountryCode, setProfileCountryCode] = useState<string | null>(null);

  const country = getCountryConfig(countryCode);
  const cities = getCitiesForCountry(countryCode);
  const allCountries = Object.values(COUNTRIES);
  
  // effectiveCountryFilter returns null when showing all countries, otherwise the current countryCode
  const effectiveCountryFilter = showAllCountries ? null : countryCode;
  
  // isVisiting is true when the navigation country differs from the user's profile country
  const isVisiting = profileCountryCode !== null && countryCode !== profileCountryCode;

  // Synchronize country code with user profile in database
  const syncCountryToProfile = async (code: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ country_code: code })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error syncing country to profile:', error);
    }
  };

  const setCountryCode = (code: string) => {
    if (isValidCountryCode(code)) {
      setCountryCodeState(code);
      localStorage.setItem(STORAGE_KEY, code);
      // Sync to database
      syncCountryToProfile(code);
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

  // Load profile country code for authenticated users
  useEffect(() => {
    const loadProfileCountry = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('country_code')
            .eq('user_id', user.id)
            .single();
          
          if (data?.country_code && isValidCountryCode(data.country_code)) {
            setProfileCountryCode(data.country_code);
          }
        } else {
          setProfileCountryCode(null);
        }
      } catch (error) {
        console.error('Error loading profile country:', error);
      }
    };

    loadProfileCountry();

    // Listen to auth changes to update profile country
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfileCountry();
    });

    return () => {
      subscription.unsubscribe();
    };
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
        wasAutoDetected,
        showAllCountries,
        setShowAllCountries,
        effectiveCountryFilter,
        profileCountryCode,
        isVisiting
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
