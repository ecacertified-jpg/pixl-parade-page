import { 
  IVORY_COAST_CITIES, 
  IVORY_COAST_CENTER, 
  IVORY_COAST_BOUNDS,
  findCityCoordinates as findIvoryCityCoordinates,
  getCityColor,
  type CityCoordinates 
} from "./ivoryCoastCities";

import { 
  BENIN_CITIES, 
  BENIN_CENTER, 
  BENIN_BOUNDS,
  findBeninCityCoordinates 
} from "./beninCities";

import { 
  SENEGAL_CITIES, 
  SENEGAL_CENTER, 
  SENEGAL_BOUNDS,
  findSenegalCityCoordinates 
} from "./senegalCities";

import { getCountryConfig } from "@/config/countries";

export type { CityCoordinates };
export { getCityColor };

// Interface for grouped cities by country
export interface CountryCitiesGroup {
  countryCode: string;
  countryName: string;
  flag: string;
  isUserCountry: boolean;
  cities: CityCoordinates[];
}

// Map of country code to cities data
const COUNTRY_CITIES: Record<string, CityCoordinates[]> = {
  CI: IVORY_COAST_CITIES,
  BJ: BENIN_CITIES,
  SN: SENEGAL_CITIES,
};

const COUNTRY_CENTERS: Record<string, [number, number]> = {
  CI: IVORY_COAST_CENTER,
  BJ: BENIN_CENTER,
  SN: SENEGAL_CENTER,
};

const COUNTRY_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  CI: IVORY_COAST_BOUNDS,
  BJ: BENIN_BOUNDS,
  SN: SENEGAL_BOUNDS,
};

// Mapping des grandes villes avec communes/arrondissements par pays
const MAJOR_CITY_MAPPING: Record<string, { name: string; label: string }> = {
  CI: { name: "Abidjan", label: "🏙️ Abidjan (communes)" },
  BJ: { name: "Cotonou", label: "🏙️ Cotonou (arrondissements)" },
  SN: { name: "Dakar", label: "🏙️ Dakar (communes)" },
};

/**
 * Get cities for a specific country
 */
export function getCitiesForCountry(countryCode: string): CityCoordinates[] {
  return COUNTRY_CITIES[countryCode] || COUNTRY_CITIES.CI;
}

/**
 * Get all cities from all countries
 */
export function getAllCities(): CityCoordinates[] {
  return Object.values(COUNTRY_CITIES).flat();
}

/**
 * Get map center for a specific country
 */
export function getMapCenterForCountry(countryCode: string): [number, number] {
  return COUNTRY_CENTERS[countryCode] || COUNTRY_CENTERS.CI;
}

/**
 * Get map bounds for a specific country
 */
export function getMapBoundsForCountry(countryCode: string): [[number, number], [number, number]] {
  return COUNTRY_BOUNDS[countryCode] || COUNTRY_BOUNDS.CI;
}

/**
 * Find city coordinates in a specific country
 */
export function findCityInCountry(address: string, countryCode: string): CityCoordinates | null {
  if (!address) return null;
  
  switch (countryCode) {
    case "BJ":
      return findBeninCityCoordinates(address);
    case "SN":
      return findSenegalCityCoordinates(address);
    case "CI":
    default:
      return findIvoryCityCoordinates(address);
  }
}

/**
 * Find city coordinates across all countries
 */
export function findCityAcrossCountries(address: string): { city: CityCoordinates; countryCode: string } | null {
  if (!address) return null;
  
  // Try each country
  for (const [countryCode, cities] of Object.entries(COUNTRY_CITIES)) {
    const normalizedAddress = address.toLowerCase().trim();
    
    for (const city of cities) {
      if (
        normalizedAddress.includes(city.name.toLowerCase()) ||
        city.aliases.some(alias => normalizedAddress.includes(alias.toLowerCase()))
      ) {
        return { city, countryCode };
      }
    }
  }
  
  return null;
}

/**
 * Get major cities for a country (for quick selection)
 */
export function getMajorCities(countryCode: string): CityCoordinates[] {
  const cities = getCitiesForCountry(countryCode);
  // Return cities without a region (main cities, not neighborhoods)
  return cities.filter(city => !city.region).slice(0, 10);
}

/**
 * Get neighborhoods/communes for a specific city
 */
export function getNeighborhoods(countryCode: string, cityName: string): CityCoordinates[] {
  const cities = getCitiesForCountry(countryCode);
  return cities.filter(city => city.region === cityName);
}

/**
 * Get main locations for first-level selection (cities + major city communes)
 * Returns: communes of the major city + standalone cities
 */
export function getMainLocations(countryCode: string): { 
  majorCityCommunes: CityCoordinates[]; 
  majorCityName: string | null;
  majorCityLabel: string;
  otherCities: CityCoordinates[];
} {
  const cities = getCitiesForCountry(countryCode);
  const majorCityConfig = MAJOR_CITY_MAPPING[countryCode];
  
  if (!majorCityConfig) {
    // No major city with communes for this country
    const allCities = cities.filter(city => city.type === "city");
    return { 
      majorCityCommunes: [], 
      majorCityName: null,
      majorCityLabel: "",
      otherCities: allCities 
    };
  }
  
  const majorCityName = majorCityConfig.name;
  
  // Get communes of the major city
  const majorCityCommunes = cities.filter(
    city => city.region === majorCityName && city.type === "commune"
  );
  
  // Get standalone cities (type: city, excluding the major city itself)
  const otherCities = cities.filter(
    city => city.type === "city" && city.name !== majorCityName
  );
  
  return { 
    majorCityCommunes, 
    majorCityName,
    majorCityLabel: majorCityConfig.label,
    otherCities 
  };
}

/**
 * Check if a location is a commune of the major city for this country
 */
export function isMajorCityCommune(countryCode: string, locationName: string): boolean {
  const cities = getCitiesForCountry(countryCode);
  const majorCityConfig = MAJOR_CITY_MAPPING[countryCode];
  
  if (!majorCityConfig) return false;
  
  const location = cities.find(c => c.name === locationName);
  return location?.region === majorCityConfig.name && location?.type === "commune";
}

/**
 * Get the major city name for a country
 */
export function getMajorCityName(countryCode: string): string | null {
  return MAJOR_CITY_MAPPING[countryCode]?.name || null;
}

/**
 * Legacy function - kept for backward compatibility
 * Check if a location is an Abidjan commune (Côte d'Ivoire specific)
 */
export function isAbidjanCommune(countryCode: string, locationName: string): boolean {
  return isMajorCityCommune(countryCode, locationName);
}

/**
 * Get neighborhoods for a specific location (commune or city)
 */
export function getNeighborhoodsOf(countryCode: string, locationName: string): CityCoordinates[] {
  const cities = getCitiesForCountry(countryCode);
  return cities.filter(city => city.region === locationName && city.type === "neighborhood");
}

/**
 * Get coordinates for a location (city, commune, or neighborhood)
 * Falls back to parent location if neighborhood not found
 */
export function getCoordinatesFor(
  countryCode: string, 
  city: string, 
  neighborhood?: string
): { lat: number; lng: number } | null {
  const cities = getCitiesForCountry(countryCode);
  
  // If neighborhood is specified, try to find it
  if (neighborhood) {
    const neighborhoodData = cities.find(
      c => c.name.toLowerCase() === neighborhood.toLowerCase() && c.region === city
    );
    if (neighborhoodData) {
      return { lat: neighborhoodData.lat, lng: neighborhoodData.lng };
    }
  }
  
  // Fall back to city/commune
  const cityData = cities.find(c => c.name.toLowerCase() === city.toLowerCase());
  if (cityData) {
    return { lat: cityData.lat, lng: cityData.lng };
  }
  
  return null;
}

/**
 * Get all cities grouped by country, with user's country first
 */
export function getCitiesGroupedByCountry(userCountryCode: string): CountryCitiesGroup[] {
  const groups: CountryCitiesGroup[] = [];
  
  // Get all country codes and sort with user's country first
  const countryCodes = Object.keys(COUNTRY_CITIES);
  const sortedCodes = [
    userCountryCode,
    ...countryCodes.filter(c => c !== userCountryCode)
  ].filter(code => COUNTRY_CITIES[code]); // Only include countries with cities
  
  for (const code of sortedCodes) {
    const countryConfig = getCountryConfig(code);
    groups.push({
      countryCode: code,
      countryName: countryConfig.name,
      flag: countryConfig.flag,
      isUserCountry: code === userCountryCode,
      cities: COUNTRY_CITIES[code] || []
    });
  }
  
  return groups;
}
