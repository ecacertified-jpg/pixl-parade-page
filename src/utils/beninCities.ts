import type { CityCoordinates } from "./ivoryCoastCities";

export const BENIN_CITIES: CityCoordinates[] = [
  // Cotonou et environs (Capitale économique)
  { name: "Cotonou", lat: 6.3654, lng: 2.4183, aliases: ["cot", "cotonou"] },
  { name: "Akpakpa", lat: 6.3667, lng: 2.4500, aliases: [], region: "Cotonou" },
  { name: "Cadjèhoun", lat: 6.3622, lng: 2.3897, aliases: ["cadjehoun"], region: "Cotonou" },
  { name: "Fidjrossè", lat: 6.3542, lng: 2.3611, aliases: ["fidjrosse"], region: "Cotonou" },
  { name: "Gbégamey", lat: 6.3694, lng: 2.3861, aliases: ["gbegamey"], region: "Cotonou" },
  { name: "Mènontin", lat: 6.3833, lng: 2.3667, aliases: ["menontin"], region: "Cotonou" },
  { name: "Zongo", lat: 6.3583, lng: 2.4333, aliases: [], region: "Cotonou" },
  { name: "Dantokpa", lat: 6.3619, lng: 2.4286, aliases: [], region: "Cotonou" },
  { name: "Haie Vive", lat: 6.3667, lng: 2.4000, aliases: ["haie-vive"], region: "Cotonou" },
  
  // Porto-Novo (Capitale administrative)
  { name: "Porto-Novo", lat: 6.4969, lng: 2.6283, aliases: ["porto novo", "porto-novo", "pn"] },
  { name: "Ouando", lat: 6.5000, lng: 2.6333, aliases: [], region: "Porto-Novo" },
  { name: "Tokpota", lat: 6.4833, lng: 2.6167, aliases: [], region: "Porto-Novo" },
  
  // Abomey-Calavi (Grande agglomération)
  { name: "Abomey-Calavi", lat: 6.4486, lng: 2.3556, aliases: ["calavi", "abomey calavi"] },
  { name: "Godomey", lat: 6.4000, lng: 2.3500, aliases: [], region: "Abomey-Calavi" },
  { name: "Togba", lat: 6.4333, lng: 2.3333, aliases: [], region: "Abomey-Calavi" },
  
  // Autres grandes villes
  { name: "Parakou", lat: 9.3372, lng: 2.6303, aliases: [] },
  { name: "Djougou", lat: 9.7083, lng: 1.6658, aliases: [] },
  { name: "Bohicon", lat: 7.1778, lng: 2.0667, aliases: [] },
  { name: "Natitingou", lat: 10.3042, lng: 1.3797, aliases: ["nati"] },
  { name: "Lokossa", lat: 6.6386, lng: 1.7167, aliases: [] },
  { name: "Abomey", lat: 7.1833, lng: 1.9833, aliases: [] },
  { name: "Ouidah", lat: 6.3667, lng: 2.0833, aliases: ["whydah"] },
  { name: "Kandi", lat: 11.1306, lng: 2.9378, aliases: [] },
  { name: "Malanville", lat: 11.8667, lng: 3.3833, aliases: [] },
  { name: "Savalou", lat: 7.9333, lng: 1.9833, aliases: [] },
  { name: "Sakété", lat: 6.7333, lng: 2.6500, aliases: ["sakete"] },
  { name: "Pobè", lat: 6.9833, lng: 2.6667, aliases: ["pobe"] },
  { name: "Dogbo", lat: 6.8000, lng: 1.7833, aliases: [] },
  { name: "Comè", lat: 6.4000, lng: 1.8833, aliases: ["come"] },
  { name: "Grand-Popo", lat: 6.2833, lng: 1.8167, aliases: ["grand popo", "grand-popo"] },
  { name: "Sèmè-Podji", lat: 6.3833, lng: 2.6167, aliases: ["seme", "seme-podji", "seme podji"] },
  { name: "Allada", lat: 6.6667, lng: 2.1500, aliases: [] },
  { name: "Tchaourou", lat: 8.8833, lng: 2.6000, aliases: [] },
  { name: "Nikki", lat: 9.9333, lng: 3.2167, aliases: [] },
  { name: "Bassila", lat: 9.0167, lng: 1.6667, aliases: [] },
  { name: "Kétou", lat: 7.3500, lng: 2.6000, aliases: ["ketou"] },
  { name: "Dassa-Zoumè", lat: 7.7500, lng: 2.1833, aliases: ["dassa", "dassa-zoume"] },
  { name: "Glazoué", lat: 7.9667, lng: 2.2333, aliases: ["glazoue"] },
  { name: "Covè", lat: 7.2167, lng: 2.3333, aliases: ["cove"] },
  { name: "Savè", lat: 8.0333, lng: 2.4833, aliases: ["save"] },
  { name: "Banikoara", lat: 11.3000, lng: 2.4333, aliases: [] },
  { name: "Tanguiéta", lat: 10.6167, lng: 1.2667, aliases: ["tanguieta"] },
  { name: "Kouandé", lat: 10.3333, lng: 1.6833, aliases: ["kouande"] },
  { name: "Copargo", lat: 9.8500, lng: 1.5333, aliases: [] },
  { name: "Aplahoué", lat: 6.9333, lng: 1.6833, aliases: ["aplahoue"] },
];

// Centre du Bénin pour la vue par défaut
export const BENIN_CENTER: [number, number] = [2.3158, 9.3077];
export const BENIN_BOUNDS: [[number, number], [number, number]] = [
  [0.7, 6.0], // Southwest
  [3.9, 12.5], // Northeast
];

export function findBeninCityCoordinates(address: string): CityCoordinates | null {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase().trim();
  
  for (const city of BENIN_CITIES) {
    if (
      normalizedAddress.includes(city.name.toLowerCase()) ||
      city.aliases.some(alias => normalizedAddress.includes(alias.toLowerCase()))
    ) {
      return city;
    }
  }
  
  return null;
}
