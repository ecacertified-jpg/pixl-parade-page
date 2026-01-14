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

export type { CityCoordinates };
export { getCityColor };

// Map of country code to cities data
const COUNTRY_CITIES: Record<string, CityCoordinates[]> = {
  CI: IVORY_COAST_CITIES,
  BJ: BENIN_CITIES,
};

const COUNTRY_CENTERS: Record<string, [number, number]> = {
  CI: IVORY_COAST_CENTER,
  BJ: BENIN_CENTER,
};

const COUNTRY_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  CI: IVORY_COAST_BOUNDS,
  BJ: BENIN_BOUNDS,
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
