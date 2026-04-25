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
const NAV_STORAGE_MANUAL_KEY = "joiedevivre_nav_country_manual";

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
  effectiveCountryFilter: string | null;

  profileCountryCode: string | null;
  isVisiting: boolean;

  detectCurrentLocation: () => Promise<void>;
  setAsHomeCountry: () => Promise<void>;
  resetToHomeCountry: () => void;

  // Profile country loading state
  profileLoadError: string | null;
  isLoadingProfile: boolean;
  retryProfileLoad: () => Promise<void>;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

interface CountryProviderProps {
  children: ReactNode;
}

export function CountryProvider({ children }: CountryProviderProps) {
  const [countryCode, setCountryCodeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
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
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const country = getCountryConfig(countryCode);
  const cities = getCitiesForCountry(countryCode);
  const allCountries = Object.values(COUNTRIES);

  const effectiveCountryFilter = showAllCountries ? null : countryCode;
  const isVisiting = profileCountryCode !== null && countryCode !== profileCountryCode;

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

  const setCountryCode = useCallback((code: string, updateProfile = false) => {
    if (isValidCountryCode(code)) {
      setCountryCodeState(code);
      sessionStorage.setItem(NAV_STORAGE_KEY, code);
      sessionStorage.setItem(NAV_STORAGE_MANUAL_KEY, "true");

      if (updateProfile) {
        syncCountryToProfile(code);
      }
    }
  }, []);

  const setCountryCodeInternal = useCallback((code: string) => {
    if (isValidCountryCode(code)) {
      setCountryCodeState(code);
      sessionStorage.setItem(NAV_STORAGE_KEY, code);
    }
  }, []);

  const detectCurrentLocation = useCallback(async () => {
    setIsDetecting(true);
    try {
      const detectedCode = await detectUserCountry(false);
      if (isValidCountryCode(detectedCode)) {
        const detectedCountry = getCountryConfig(detectedCode);
        setCountryCodeState(detectedCode);
        sessionStorage.setItem(NAV_STORAGE_KEY, detectedCode);
        sessionStorage.setItem(NAV_STORAGE_MANUAL_KEY, "true");
        toast.success(`Position détectée : ${detectedCountry.flag} ${detectedCountry.name}`);
      }
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const setAsHomeCountry = useCallback(async () => {
    await syncCountryToProfile(countryCode);
    const currentCountry = getCountryConfig(countryCode);
    toast.success(`${currentCountry.flag} ${currentCountry.name} défini comme pays d'origine`);
  }, [countryCode]);

  const resetToHomeCountry = useCallback(() => {
    if (profileCountryCode && isValidCountryCode(profileCountryCode)) {
      setCountryCodeState(profileCountryCode);
      sessionStorage.setItem(NAV_STORAGE_KEY, profileCountryCode);
      sessionStorage.removeItem(NAV_STORAGE_MANUAL_KEY);
    }
  }, [profileCountryCode]);

  // Auto-detect country on each session
  useEffect(() => {
    const sessionDetected = sessionStorage.getItem(SESSION_DETECTED_KEY);
    const manual = sessionStorage.getItem(NAV_STORAGE_MANUAL_KEY);

    if (manual) {
      sessionStorage.setItem(SESSION_DETECTED_KEY, 'true');
      return;
    }

    if (!sessionDetected) {
      setIsDetecting(true);

      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const { data } = await supabase
              .from('profiles')
              .select('country_code')
              .eq('user_id', user.id)
              .maybeSingle();
            if (data?.country_code && isValidCountryCode(data.country_code)) {
              setCountryCodeState(data.country_code);
              sessionStorage.setItem(NAV_STORAGE_KEY, data.country_code);
              sessionStorage.setItem(SESSION_DETECTED_KEY, 'true');
              setProfileCountryCode(data.country_code);
              setIsDetecting(false);
              return;
            }
          }
        } catch (e) {
          // fall back to IP detection
        }

        const detectedCode = await detectUserCountry(false);
        if (isValidCountryCode(detectedCode)) {
          const previousCountry = sessionStorage.getItem(NAV_STORAGE_KEY);

          setCountryCodeState(detectedCode);
          sessionStorage.setItem(NAV_STORAGE_KEY, detectedCode);

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

        sessionStorage.setItem(SESSION_DETECTED_KEY, 'true');
        setIsDetecting(false);
      })();
    }
  }, []);

  // Profile country loading (with error tracking + retry)
  const loadProfileCountry = useCallback(async () => {
    setIsLoadingProfile(true);
    setProfileLoadError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData?.user;
      if (!user?.id) {
        setProfileCountryCode(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('country_code')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;

      if (data?.country_code && isValidCountryCode(data.country_code)) {
        setProfileCountryCode(data.country_code);
        const manual = sessionStorage.getItem(NAV_STORAGE_MANUAL_KEY);
        const currentNav = sessionStorage.getItem(NAV_STORAGE_KEY);
        if (!manual && data.country_code !== currentNav) {
          setCountryCodeInternal(data.country_code);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile country:', error);
      setProfileLoadError(
        error?.message ?? "Impossible de charger votre pays d'origine"
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, [setCountryCodeInternal]);

  const retryProfileLoad = useCallback(async () => {
    await loadProfileCountry();
    // If still no profile country after retry, fall back to IP detection.
    if (!profileCountryCode) {
      try {
        await detectCurrentLocation();
      } catch {
        // already handled
      }
    }
  }, [loadProfileCountry, profileCountryCode, detectCurrentLocation]);

  useEffect(() => {
    loadProfileCountry();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfileCountry();
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setAsHomeCountry,
        resetToHomeCountry,
        profileLoadError,
        isLoadingProfile,
        retryProfileLoad,
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

export function useCountrySafe(): CountryContextType | null {
  const context = useContext(CountryContext);
  return context ?? null;
}

export function useCountryConfig(): CountryConfig {
  const { country } = useCountry();
  return country;
}

export function useCountryCities(): CityCoordinates[] {
  const { cities } = useCountry();
  return cities;
}
