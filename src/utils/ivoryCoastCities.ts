export interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
  region?: string;
}

export const IVORY_COAST_CITIES: CityCoordinates[] = [
  // Abidjan et communes
  { name: "Abidjan", lat: 5.3600, lng: -4.0083, aliases: ["abj", "abidjan"] },
  { name: "Cocody", lat: 5.3543, lng: -3.9785, aliases: ["coco"], region: "Abidjan" },
  { name: "Marcory", lat: 5.3047, lng: -3.9833, aliases: [], region: "Abidjan" },
  { name: "Yopougon", lat: 5.3361, lng: -4.0856, aliases: ["yop"], region: "Abidjan" },
  { name: "Abobo", lat: 5.4167, lng: -4.0167, aliases: [], region: "Abidjan" },
  { name: "Treichville", lat: 5.2981, lng: -3.9944, aliases: ["treich"], region: "Abidjan" },
  { name: "Plateau", lat: 5.3192, lng: -4.0194, aliases: [], region: "Abidjan" },
  { name: "Adjamé", lat: 5.3589, lng: -4.0267, aliases: ["adjame"], region: "Abidjan" },
  { name: "Port-Bouët", lat: 5.2500, lng: -3.9333, aliases: ["port bouet", "port-bouet"], region: "Abidjan" },
  { name: "Koumassi", lat: 5.2942, lng: -3.9433, aliases: [], region: "Abidjan" },
  { name: "Attécoubé", lat: 5.3375, lng: -4.0456, aliases: ["attecoube"], region: "Abidjan" },
  { name: "Bingerville", lat: 5.3547, lng: -3.8883, aliases: [], region: "Abidjan" },
  { name: "Songon", lat: 5.3167, lng: -4.2667, aliases: [], region: "Abidjan" },
  { name: "Anyama", lat: 5.4917, lng: -4.0508, aliases: [], region: "Abidjan" },
  
  // Autres grandes villes
  { name: "Bouaké", lat: 7.6906, lng: -5.0305, aliases: ["bouake"] },
  { name: "Daloa", lat: 6.8774, lng: -6.4502, aliases: [] },
  { name: "Yamoussoukro", lat: 6.8276, lng: -5.2893, aliases: ["yakro"] },
  { name: "San-Pédro", lat: 4.7485, lng: -6.6363, aliases: ["san pedro", "san-pedro"] },
  { name: "Korhogo", lat: 9.4580, lng: -5.6297, aliases: [] },
  { name: "Man", lat: 7.4125, lng: -7.5536, aliases: [] },
  { name: "Gagnoa", lat: 6.1319, lng: -5.9506, aliases: [] },
  { name: "Divo", lat: 5.8372, lng: -5.3572, aliases: [] },
  { name: "Grand-Bassam", lat: 5.2122, lng: -3.7400, aliases: ["bassam", "grand bassam", "grand-bassam"] },
  { name: "Adzopé", lat: 6.1050, lng: -3.8619, aliases: ["adzope"] },
  { name: "Abengourou", lat: 6.7297, lng: -3.4964, aliases: [] },
  { name: "Agboville", lat: 5.9286, lng: -4.2136, aliases: [] },
  { name: "Bondoukou", lat: 8.0404, lng: -2.7997, aliases: [] },
  { name: "Soubré", lat: 5.7856, lng: -6.5936, aliases: ["soubre"] },
  { name: "Séguéla", lat: 7.9611, lng: -6.6731, aliases: ["seguela"] },
  { name: "Odienné", lat: 9.5000, lng: -7.5667, aliases: ["odienne"] },
  { name: "Ferkessédougou", lat: 9.5933, lng: -5.1947, aliases: ["ferke", "ferkessedougou"] },
  { name: "Dimbokro", lat: 6.6500, lng: -4.7000, aliases: [] },
  { name: "Duékoué", lat: 6.7392, lng: -7.3500, aliases: ["duekoue"] },
  { name: "Bouaflé", lat: 6.9833, lng: -5.7500, aliases: ["bouafle"] },
  { name: "Issia", lat: 6.4833, lng: -6.5833, aliases: [] },
  { name: "Bongouanou", lat: 6.6500, lng: -4.2000, aliases: [] },
  { name: "Dabou", lat: 5.3256, lng: -4.3767, aliases: [] },
  { name: "Tiassalé", lat: 5.8983, lng: -4.8233, aliases: ["tiassale"] },
  { name: "Sassandra", lat: 4.9500, lng: -6.0833, aliases: [] },
  { name: "Tabou", lat: 4.4228, lng: -7.3531, aliases: [] },
  { name: "Guiglo", lat: 6.5333, lng: -7.4833, aliases: [] },
  { name: "Oumé", lat: 6.3833, lng: -5.4167, aliases: ["oume"] },
  { name: "Sinfra", lat: 6.6167, lng: -5.9167, aliases: [] },
  { name: "Katiola", lat: 8.1333, lng: -5.1000, aliases: [] },
  { name: "Tengrela", lat: 10.4833, lng: -6.4000, aliases: [] },
  { name: "Boundiali", lat: 9.5167, lng: -6.4833, aliases: [] },
];

// Centre de la Côte d'Ivoire pour la vue par défaut
export const IVORY_COAST_CENTER: [number, number] = [-5.5471, 7.5400];
export const IVORY_COAST_BOUNDS: [[number, number], [number, number]] = [
  [-8.6, 4.3], // Southwest
  [-2.5, 10.7], // Northeast
];

export function findCityCoordinates(address: string): CityCoordinates | null {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase().trim();
  
  for (const city of IVORY_COAST_CITIES) {
    if (
      normalizedAddress.includes(city.name.toLowerCase()) ||
      city.aliases.some(alias => normalizedAddress.includes(alias.toLowerCase()))
    ) {
      return city;
    }
  }
  
  return null;
}

export function getCityColor(type: string): string {
  switch (type) {
    case 'user':
      return 'hsl(210, 100%, 50%)'; // Blue
    case 'business':
      return 'hsl(142, 76%, 36%)'; // Green
    case 'order':
      return 'hsl(25, 95%, 53%)'; // Orange
    case 'fund':
      return 'hsl(272, 76%, 75%)'; // Purple
    case 'contribution':
      return 'hsl(345, 100%, 65%)'; // Pink
    default:
      return 'hsl(259, 58%, 59%)'; // Primary
  }
}
