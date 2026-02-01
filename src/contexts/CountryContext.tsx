import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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
import { toast } from "sonner";

const NAV_STORAGE_KEY = "joiedevivre_nav_country";
const SESSION_DETECTED_KEY = "joiedevivre_session_detected";

interface CountryContextType {
  country: CountryConfig;
  countryCode: string;
  setCountryCode: (code: string, updateProfile?: boolean) => void;
  cities: CityCoordinates[];
  allCountries: CountryConfig[];
  isDetecting: boolean;
  wasAutoDetected: boolean;
  showAllCountries: boolean;
  setShowAllCountries: (value: boolean) => void;
  effectiveCountryFilter: string | null; // null = all countries
  
  // Profile country for hybrid filtering
  profileCountryCode: string | null;
  isVisiting: boolean; // true if current country differs from profile country
  
  // New: Manual detection trigger
  detectCurrentLocation: () => Promise<void>;
  setAsHomeCountry: () => Promise<void>;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

interface CountryProviderProps {
  children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
  const [countryCode, setCountryCodeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      // Check sessionStorage first for current session navigation
      const sessionNav = sessionStorage.getItem(NAV_STORAGE_KEY);
      if (sessionNav && isValidCountryCode(sessionNav)) {
        return sessionNav;
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
        setProfileCountryCode(code);
      }
    } catch (error) {
      console.error('Error syncing country to profile:', error);
    }
  };

  // Set country code for navigation (does not update profile by default)
  const setCountryCode = useCallback((code: string, updateProfile = false) => {
    if (isValidCountryCode(code)) {
      setCountryCodeState(code);
      sessionStorage.setItem(NAV_STORAGE_KEY, code);
      
      // Only sync to profile if explicitly requested
      if (updateProfile) {
        syncCountryToProfile(code);
      }
    }
  }, []);

  // Manual detection trigger
  const detectCurrentLocation = useCallback(async () => {
    setIsDetecting(true);
    try {
      const detectedCode = await detectUserCountry(false);
      if (isValidCountryCode(detectedCode)) {
        const detectedCountry = getCountryConfig(detectedCode);
        setCountryCodeState(detectedCode);
        sessionStorage.setItem(NAV_STORAGE_KEY, detectedCode);
        toast.success(`Position détectée : ${detectedCountry.flag} ${detectedCountry.name}`);
      }
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // Set current navigation country as home country
  const setAsHomeCountry = useCallback(async () => {
    await syncCountryToProfile(countryCode);
    const currentCountry = getCountryConfig(countryCode);
    toast.success(`${currentCountry.flag} ${currentCountry.name} défini comme pays d'origine`);
  }, [countryCode]);

  // Auto-detect country on each session (not just first visit)
  useEffect(() => {
    const sessionDetected = sessionStorage.getItem(SESSION_DETECTED_KEY);

    // Detect on each new session
    if (!sessionDetected) {
      setIsDetecting(true);
      
      detectUserCountry(false).then((detectedCode) => {
        if (isValidCountryCode(detectedCode)) {
          const previousCountry = sessionStorage.getItem(NAV_STORAGE_KEY);
          
          setCountryCodeState(detectedCode);
          sessionStorage.setItem(NAV_STORAGE_KEY, detectedCode);
          
          // Show welcome toast if country changed
          if (previousCountry && previousCountry !== detectedCode) {
            const detectedCountry = getCountryConfig(detectedCode);
            toast.success(`Bienvenue ${detectedCountry.flag} ${detectedCountry.name} !`, {
              description: "Contenu adapté à votre localisation"
            });
            setWasAutoDetected(true);
          } else if (detectedCode !== DEFAULT_COUNTRY_CODE) {
            setWasAutoDetected(true);
          }
        }
        
        // Mark that we've detected for this session
        sessionStorage.setItem(SESSION_DETECTED_KEY, 'true');
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
        isVisiting,
        detectCurrentLocation,
        setAsHomeCountry
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

// Safe version that returns null instead of throwing when provider is missing
export function useCountrySafe(): CountryContextType | null {
  const context = useContext(CountryContext);
  return context ?? null;
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
