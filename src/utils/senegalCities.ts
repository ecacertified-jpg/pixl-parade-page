// Villes et coordonnées du Sénégal pour JOIE DE VIVRE

import type { CityCoordinates } from "./ivoryCoastCities";

export const SENEGAL_CITIES: CityCoordinates[] = [
  // Dakar et agglomération
  { name: "Dakar", lat: 14.6928, lng: -17.4467, aliases: ["dkr", "dakar"] },
  { name: "Plateau", lat: 14.6683, lng: -17.4381, aliases: [], region: "Dakar" },
  { name: "Médina", lat: 14.6731, lng: -17.4550, aliases: ["medina"], region: "Dakar" },
  { name: "Grand Dakar", lat: 14.7017, lng: -17.4450, aliases: [], region: "Dakar" },
  { name: "Parcelles Assainies", lat: 14.7631, lng: -17.4181, aliases: ["parcelles"], region: "Dakar" },
  { name: "Almadies", lat: 14.7458, lng: -17.5153, aliases: [], region: "Dakar" },
  { name: "Ngor", lat: 14.7500, lng: -17.5167, aliases: [], region: "Dakar" },
  { name: "Ouakam", lat: 14.7250, lng: -17.4833, aliases: [], region: "Dakar" },
  { name: "Yoff", lat: 14.7644, lng: -17.4658, aliases: [], region: "Dakar" },
  { name: "Mermoz", lat: 14.7083, lng: -17.4833, aliases: ["mermoz-sacre-coeur"], region: "Dakar" },
  { name: "Fann", lat: 14.6889, lng: -17.4639, aliases: ["fann-point-e"], region: "Dakar" },
  { name: "Pikine", lat: 14.7556, lng: -17.3906, aliases: [] },
  { name: "Guédiawaye", lat: 14.7767, lng: -17.3939, aliases: ["guediawaye"] },
  { name: "Rufisque", lat: 14.7167, lng: -17.2667, aliases: [] },
  { name: "Keur Massar", lat: 14.7794, lng: -17.3144, aliases: ["keur-massar"] },
  { name: "Diamniadio", lat: 14.7000, lng: -17.1833, aliases: [] },
  
  // Grandes villes régionales
  { name: "Thiès", lat: 14.7833, lng: -16.9333, aliases: ["thies"] },
  { name: "Saint-Louis", lat: 16.0167, lng: -16.5000, aliases: ["saint louis", "ndar"] },
  { name: "Kaolack", lat: 14.1500, lng: -16.0667, aliases: [] },
  { name: "Ziguinchor", lat: 12.5667, lng: -16.2667, aliases: [] },
  { name: "Touba", lat: 14.8500, lng: -15.8833, aliases: [] },
  { name: "Mbour", lat: 14.4167, lng: -16.9667, aliases: [] },
  { name: "Tambacounda", lat: 13.7667, lng: -13.6667, aliases: ["tamba"] },
  { name: "Kolda", lat: 12.8833, lng: -14.9500, aliases: [] },
  { name: "Diourbel", lat: 14.6500, lng: -16.2333, aliases: [] },
  { name: "Louga", lat: 15.6167, lng: -16.2167, aliases: [] },
  { name: "Matam", lat: 15.6556, lng: -13.2553, aliases: [] },
  { name: "Fatick", lat: 14.3333, lng: -16.4000, aliases: [] },
  { name: "Kaffrine", lat: 14.1000, lng: -15.5500, aliases: [] },
  { name: "Kédougou", lat: 12.5500, lng: -12.1833, aliases: ["kedougou"] },
  { name: "Sédhiou", lat: 12.7000, lng: -15.5500, aliases: ["sedhiou"] },
  
  // Zones touristiques et autres
  { name: "Saly", lat: 14.4500, lng: -17.0167, aliases: ["saly portudal"] },
  { name: "Cap Skirring", lat: 12.3833, lng: -16.7500, aliases: ["cap-skirring"] },
  { name: "Gorée", lat: 14.6667, lng: -17.4000, aliases: ["ile de goree"] },
  { name: "Joal-Fadiouth", lat: 14.1667, lng: -16.8333, aliases: ["joal", "fadiouth"] },
  { name: "Petite-Côte", lat: 14.4000, lng: -17.0000, aliases: ["petite cote"] },
  { name: "Richard-Toll", lat: 16.4667, lng: -15.7000, aliases: ["richard toll"] },
  { name: "Dagana", lat: 16.5167, lng: -15.5000, aliases: [] },
  { name: "Podor", lat: 16.6500, lng: -14.9500, aliases: [] },
  { name: "Linguère", lat: 15.3833, lng: -15.1167, aliases: ["linguere"] },
  { name: "Nioro du Rip", lat: 13.7500, lng: -15.8000, aliases: ["nioro"] },
  { name: "Vélingara", lat: 13.1500, lng: -14.1167, aliases: ["velingara"] },
  { name: "Bignona", lat: 12.8167, lng: -16.2333, aliases: [] },
  { name: "Oussouye", lat: 12.4833, lng: -16.5500, aliases: [] },
];

// Centre géographique du Sénégal (Dakar)
export const SENEGAL_CENTER: [number, number] = [-17.4677, 14.7167];

// Limites géographiques du Sénégal
export const SENEGAL_BOUNDS: [[number, number], [number, number]] = [
  [-17.5, 12.3], // Southwest (lng, lat)
  [-11.4, 16.7], // Northeast (lng, lat)
];

/**
 * Trouve les coordonnées d'une ville sénégalaise à partir d'une adresse
 */
export function findSenegalCityCoordinates(address: string): CityCoordinates | null {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase().trim();
  
  for (const city of SENEGAL_CITIES) {
    if (
      normalizedAddress.includes(city.name.toLowerCase()) ||
      city.aliases.some(alias => normalizedAddress.includes(alias.toLowerCase()))
    ) {
      return city;
    }
  }
  
  return null;
}
