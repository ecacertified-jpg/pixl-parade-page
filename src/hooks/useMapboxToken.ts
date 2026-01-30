import { useState, useEffect, useCallback } from "react";
import { MAPBOX_TOKEN_KEY, DEFAULT_MAPBOX_TOKEN } from "@/utils/mapboxConfig";

interface UseMapboxTokenOptions {
  /**
   * If true, falls back to DEFAULT_MAPBOX_TOKEN when no custom token is stored.
   * Set to false for admin features that require explicit token configuration.
   * @default true
   */
  useDefault?: boolean;
}

interface UseMapboxTokenResult {
  /** The effective token (stored or default) */
  token: string | null;
  /** Whether a custom token is stored in localStorage */
  isConfigured: boolean;
  /** Whether the hook is using the default token */
  isUsingDefault: boolean;
  /** Store a new token in localStorage */
  setToken: (token: string) => void;
  /** Remove the stored token from localStorage */
  clearToken: () => void;
}

/**
 * Centralized hook for Mapbox token management.
 * 
 * Features:
 * - Single source of truth for token retrieval
 * - Automatic migration from legacy 'mapbox_token' key
 * - Optional fallback to default public token
 * 
 * @example
 * // Public pages - use default token
 * const { token } = useMapboxToken();
 * 
 * // Admin pages - require explicit configuration
 * const { token, setToken } = useMapboxToken({ useDefault: false });
 */
export function useMapboxToken(
  options: UseMapboxTokenOptions = {}
): UseMapboxTokenResult {
  const { useDefault = true } = options;
  
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Try to get the current token
    const saved = localStorage.getItem(MAPBOX_TOKEN_KEY);
    
    if (saved) {
      setStoredToken(saved);
    } else {
      // Migration: check for legacy key from BusinessClusterMap
      const legacyToken = localStorage.getItem("mapbox_token");
      if (legacyToken) {
        // Migrate to new key
        localStorage.setItem(MAPBOX_TOKEN_KEY, legacyToken);
        localStorage.removeItem("mapbox_token");
        setStoredToken(legacyToken);
        console.log("[useMapboxToken] Migrated legacy token to new key");
      }
    }
    
    setInitialized(true);
  }, []);

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem(MAPBOX_TOKEN_KEY, newToken);
    setStoredToken(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(MAPBOX_TOKEN_KEY);
    setStoredToken(null);
  }, []);

  // Determine effective token
  const effectiveToken = storedToken || (useDefault ? DEFAULT_MAPBOX_TOKEN : null);

  return {
    token: initialized ? effectiveToken : null,
    isConfigured: !!storedToken,
    isUsingDefault: !storedToken && useDefault,
    setToken,
    clearToken,
  };
}
