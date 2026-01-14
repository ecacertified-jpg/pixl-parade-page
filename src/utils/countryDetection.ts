/**
 * Country detection utilities for automatic geolocation
 */

import { isValidCountryCode, DEFAULT_COUNTRY_CODE } from "@/config/countries";

interface IPAPIResponse {
  country_code: string;
  country_name: string;
  city: string;
  region: string;
}

// Map detected country codes to supported countries
const COUNTRY_MAPPING: Record<string, string> = {
  // Direct matches
  'CI': 'CI',  // Côte d'Ivoire
  'BJ': 'BJ',  // Bénin
  
  // Nearby countries mapped to closest supported country
  'TG': 'BJ',  // Togo -> Bénin (geographic proximity)
  'GH': 'CI',  // Ghana -> Côte d'Ivoire
  'ML': 'CI',  // Mali -> Côte d'Ivoire
  'BF': 'CI',  // Burkina Faso -> Côte d'Ivoire
  'SN': 'CI',  // Sénégal -> Côte d'Ivoire
  'GN': 'CI',  // Guinée -> Côte d'Ivoire
  'LR': 'CI',  // Liberia -> Côte d'Ivoire
  'NE': 'BJ',  // Niger -> Bénin
  'NG': 'BJ',  // Nigeria -> Bénin
};

/**
 * Detect country by IP address using ipapi.co (free tier: 1000 requests/day)
 * @returns Country code if detected and supported, null otherwise
 */
export async function detectCountryByIP(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[GeoDetect] IP API returned non-OK status:', response.status);
      return null;
    }

    const data: IPAPIResponse = await response.json();
    
    // Check if we have a mapping for this country
    const mappedCountry = COUNTRY_MAPPING[data.country_code];
    
    if (mappedCountry && isValidCountryCode(mappedCountry)) {
      console.log(`[GeoDetect] Detected country: ${data.country_name} (${data.country_code}) -> ${mappedCountry}`);
      return mappedCountry;
    }

    console.log(`[GeoDetect] Country ${data.country_code} not in supported list, using default`);
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[GeoDetect] IP detection timed out');
    } else {
      console.warn('[GeoDetect] IP detection failed:', error);
    }
    return null;
  }
}

/**
 * Detect country by browser geolocation (requires user permission)
 * @returns Country code if coordinates are within supported bounds, null otherwise
 */
export async function detectCountryByGeolocation(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('[GeoDetect] Geolocation API not available');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const country = getCountryFromCoordinates(latitude, longitude);
        console.log(`[GeoDetect] GPS coordinates: ${latitude}, ${longitude} -> ${country || 'unknown'}`);
        resolve(country);
      },
      (error) => {
        console.warn('[GeoDetect] Geolocation error:', error.message);
        resolve(null);
      },
      { 
        timeout: 10000, 
        enableHighAccuracy: false,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

/**
 * Map GPS coordinates to supported country codes
 * Uses approximate bounding boxes for each country
 */
function getCountryFromCoordinates(lat: number, lng: number): string | null {
  // Côte d'Ivoire bounds (approximate)
  // Lat: 4.3°N to 10.7°N, Lng: 8.6°W to 2.5°W
  if (lat >= 4.3 && lat <= 10.7 && lng >= -8.6 && lng <= -2.5) {
    return 'CI';
  }
  
  // Bénin bounds (approximate)
  // Lat: 6.0°N to 12.5°N, Lng: 0.7°E to 3.9°E
  if (lat >= 6.0 && lat <= 12.5 && lng >= 0.7 && lng <= 3.9) {
    return 'BJ';
  }
  
  return null;
}

/**
 * Main detection function - tries IP first, with optional GPS fallback
 * @param useGPSFallback Whether to try GPS if IP detection fails
 */
export async function detectUserCountry(useGPSFallback = false): Promise<string> {
  // Try IP-based detection first (faster, no permission needed)
  const ipCountry = await detectCountryByIP();
  if (ipCountry) {
    return ipCountry;
  }

  // Optionally try GPS fallback
  if (useGPSFallback) {
    const gpsCountry = await detectCountryByGeolocation();
    if (gpsCountry) {
      return gpsCountry;
    }
  }

  // Default fallback
  return DEFAULT_COUNTRY_CODE;
}
