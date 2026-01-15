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
