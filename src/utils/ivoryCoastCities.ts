export interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
  region?: string;        // Parent commune/city (e.g., "Abidjan" for communes, "Yopougon" for neighborhoods)
  type?: 'city' | 'commune' | 'neighborhood';
}

export const IVORY_COAST_CITIES: CityCoordinates[] = [
  // ========== ABIDJAN (Ville principale) ==========
  { name: "Abidjan", lat: 5.3600, lng: -4.0083, aliases: ["abj", "abidjan"], type: "city" },
  
  // --- Communes d'Abidjan ---
  { name: "Cocody", lat: 5.3543, lng: -3.9785, aliases: ["coco"], region: "Abidjan", type: "commune" },
  { name: "Marcory", lat: 5.3047, lng: -3.9833, aliases: [], region: "Abidjan", type: "commune" },
  { name: "Yopougon", lat: 5.3361, lng: -4.0856, aliases: ["yop"], region: "Abidjan", type: "commune" },
  { name: "Abobo", lat: 5.4167, lng: -4.0167, aliases: [], region: "Abidjan", type: "commune" },
  { name: "Treichville", lat: 5.2981, lng: -3.9944, aliases: ["treich"], region: "Abidjan", type: "commune" },
  { name: "Plateau", lat: 5.3192, lng: -4.0194, aliases: [], region: "Abidjan", type: "commune" },
  { name: "Adjamé", lat: 5.3589, lng: -4.0267, aliases: ["adjame"], region: "Abidjan", type: "commune" },
  { name: "Port-Bouët", lat: 5.2500, lng: -3.9333, aliases: ["port bouet", "port-bouet"], region: "Abidjan", type: "commune" },
  { name: "Koumassi", lat: 5.2942, lng: -3.9433, aliases: [], region: "Abidjan", type: "commune" },
  { name: "Attécoubé", lat: 5.3375, lng: -4.0456, aliases: ["attecoube"], region: "Abidjan", type: "commune" },
  { name: "Bingerville", lat: 5.3547, lng: -3.8883, aliases: [], region: "Abidjan", type: "commune" },
  { name: "Songon", lat: 5.3167, lng: -4.2667, aliases: [], region: "Abidjan", type: "commune" },
  { name: "Anyama", lat: 5.4917, lng: -4.0508, aliases: [], region: "Abidjan", type: "commune" },
  
  // --- Quartiers de Yopougon ---
  { name: "Siporex", lat: 5.3583, lng: -4.0722, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Niangon Sud", lat: 5.3417, lng: -4.1028, aliases: ["niangon-sud"], region: "Yopougon", type: "neighborhood" },
  { name: "Niangon Nord", lat: 5.3533, lng: -4.1083, aliases: ["niangon-nord"], region: "Yopougon", type: "neighborhood" },
  { name: "Zone Industrielle", lat: 5.3111, lng: -4.0611, aliases: ["zi", "zone industrielle yopougon"], region: "Yopougon", type: "neighborhood" },
  { name: "Millionnaire", lat: 5.3389, lng: -4.0694, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Selmer", lat: 5.3306, lng: -4.0667, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Sicogi", lat: 5.3333, lng: -4.0889, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Gesco", lat: 5.3417, lng: -4.0917, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Toits Rouges", lat: 5.3472, lng: -4.0778, aliases: ["toits-rouges"], region: "Yopougon", type: "neighborhood" },
  { name: "Port-Bouët 2", lat: 5.3528, lng: -4.0833, aliases: ["port-bouet 2"], region: "Yopougon", type: "neighborhood" },
  { name: "Banco", lat: 5.3639, lng: -4.0528, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Lokoa", lat: 5.3278, lng: -4.0750, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Wassakara", lat: 5.3361, lng: -4.0944, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Andokoi", lat: 5.3389, lng: -4.0806, aliases: [], region: "Yopougon", type: "neighborhood" },
  { name: "Azito", lat: 5.3222, lng: -4.0833, aliases: [], region: "Yopougon", type: "neighborhood" },
  
  // --- Quartiers de Cocody ---
  { name: "Riviera 2", lat: 5.3611, lng: -3.9694, aliases: ["riviera2", "riviera-2"], region: "Cocody", type: "neighborhood" },
  { name: "Riviera 3", lat: 5.3694, lng: -3.9556, aliases: ["riviera3", "riviera-3"], region: "Cocody", type: "neighborhood" },
  { name: "Riviera 4", lat: 5.3750, lng: -3.9472, aliases: ["riviera4", "riviera-4"], region: "Cocody", type: "neighborhood" },
  { name: "Angré", lat: 5.3806, lng: -3.9583, aliases: ["angre"], region: "Cocody", type: "neighborhood" },
  { name: "Deux Plateaux", lat: 5.3556, lng: -3.9667, aliases: ["2 plateaux", "ii plateaux"], region: "Cocody", type: "neighborhood" },
  { name: "Riviera Palmeraie", lat: 5.3611, lng: -3.9389, aliases: ["palmeraie"], region: "Cocody", type: "neighborhood" },
  { name: "Saint-Jean", lat: 5.3639, lng: -3.9833, aliases: ["st-jean", "st jean"], region: "Cocody", type: "neighborhood" },
  { name: "Bonoumin", lat: 5.3667, lng: -3.9611, aliases: [], region: "Cocody", type: "neighborhood" },
  { name: "Akouédo", lat: 5.3556, lng: -3.9278, aliases: ["akouedo"], region: "Cocody", type: "neighborhood" },
  { name: "Attoban", lat: 5.3528, lng: -3.9722, aliases: [], region: "Cocody", type: "neighborhood" },
  { name: "Faya", lat: 5.3694, lng: -3.9528, aliases: [], region: "Cocody", type: "neighborhood" },
  { name: "Danga", lat: 5.3778, lng: -3.9500, aliases: [], region: "Cocody", type: "neighborhood" },
  { name: "Riviera Golf", lat: 5.3750, lng: -3.9389, aliases: ["golf"], region: "Cocody", type: "neighborhood" },
  { name: "Ambassades", lat: 5.3417, lng: -3.9917, aliases: [], region: "Cocody", type: "neighborhood" },
  
  // --- Quartiers de Marcory ---
  { name: "Zone 4", lat: 5.3139, lng: -3.9833, aliases: ["zone4"], region: "Marcory", type: "neighborhood" },
  { name: "Anoumabo", lat: 5.3028, lng: -3.9750, aliases: [], region: "Marcory", type: "neighborhood" },
  { name: "Biétry", lat: 5.3000, lng: -3.9861, aliases: ["bietry"], region: "Marcory", type: "neighborhood" },
  { name: "Marcory Résidentiel", lat: 5.3056, lng: -3.9889, aliases: ["marcory-residentiel"], region: "Marcory", type: "neighborhood" },
  { name: "Sans Fil", lat: 5.2917, lng: -3.9806, aliases: ["sans-fil"], region: "Marcory", type: "neighborhood" },
  
  // --- Quartiers d'Abobo ---
  { name: "Avocatier", lat: 5.4194, lng: -4.0083, aliases: [], region: "Abobo", type: "neighborhood" },
  { name: "Plaque", lat: 5.4250, lng: -4.0139, aliases: [], region: "Abobo", type: "neighborhood" },
  { name: "Dokui", lat: 5.4139, lng: -4.0056, aliases: [], region: "Abobo", type: "neighborhood" },
  { name: "Sagbé", lat: 5.4333, lng: -4.0194, aliases: ["sagbe"], region: "Abobo", type: "neighborhood" },
  { name: "PK18", lat: 5.4417, lng: -4.0278, aliases: ["pk 18"], region: "Abobo", type: "neighborhood" },
  { name: "Anonkoua", lat: 5.4056, lng: -4.0222, aliases: [], region: "Abobo", type: "neighborhood" },
  { name: "Clouetcha", lat: 5.4278, lng: -4.0250, aliases: [], region: "Abobo", type: "neighborhood" },
  { name: "Anador", lat: 5.4389, lng: -4.0111, aliases: [], region: "Abobo", type: "neighborhood" },
  { name: "Samaké", lat: 5.4167, lng: -4.0306, aliases: ["samake"], region: "Abobo", type: "neighborhood" },
  
  // --- Quartiers de Treichville ---
  { name: "Avenue 10", lat: 5.2944, lng: -3.9917, aliases: ["av 10"], region: "Treichville", type: "neighborhood" },
  { name: "Marché Treichville", lat: 5.2972, lng: -3.9972, aliases: ["marche"], region: "Treichville", type: "neighborhood" },
  { name: "Abattoir", lat: 5.3000, lng: -3.9889, aliases: [], region: "Treichville", type: "neighborhood" },
  { name: "Gare de Bassam", lat: 5.2917, lng: -3.9944, aliases: [], region: "Treichville", type: "neighborhood" },
  
  // --- Quartiers d'Adjamé ---
  { name: "Liberté", lat: 5.3556, lng: -4.0222, aliases: [], region: "Adjamé", type: "neighborhood" },
  { name: "Williamsville", lat: 5.3694, lng: -4.0333, aliases: [], region: "Adjamé", type: "neighborhood" },
  { name: "Agban", lat: 5.3611, lng: -4.0306, aliases: [], region: "Adjamé", type: "neighborhood" },
  { name: "Bromakoté", lat: 5.3528, lng: -4.0278, aliases: ["bromakote"], region: "Adjamé", type: "neighborhood" },
  { name: "220 Logements", lat: 5.3583, lng: -4.0250, aliases: ["220-logements"], region: "Adjamé", type: "neighborhood" },
  
  // --- Quartiers de Koumassi ---
  { name: "Remblais", lat: 5.2889, lng: -3.9472, aliases: [], region: "Koumassi", type: "neighborhood" },
  { name: "Grand Campement", lat: 5.2917, lng: -3.9500, aliases: [], region: "Koumassi", type: "neighborhood" },
  { name: "Sicobois", lat: 5.2972, lng: -3.9417, aliases: [], region: "Koumassi", type: "neighborhood" },
  
  // --- Quartiers de Port-Bouët ---
  { name: "Vridi", lat: 5.2528, lng: -3.9778, aliases: [], region: "Port-Bouët", type: "neighborhood" },
  { name: "Gonzagueville", lat: 5.2444, lng: -3.9139, aliases: ["gonzague"], region: "Port-Bouët", type: "neighborhood" },
  { name: "Adjouffou", lat: 5.2500, lng: -3.9500, aliases: [], region: "Port-Bouët", type: "neighborhood" },
  
  // ========== AUTRES GRANDES VILLES ==========
  { name: "Bouaké", lat: 7.6906, lng: -5.0305, aliases: ["bouake"], type: "city" },
  { name: "Daloa", lat: 6.8774, lng: -6.4502, aliases: [], type: "city" },
  { name: "Yamoussoukro", lat: 6.8276, lng: -5.2893, aliases: ["yakro"], type: "city" },
  { name: "San-Pédro", lat: 4.7485, lng: -6.6363, aliases: ["san pedro", "san-pedro"], type: "city" },
  { name: "Korhogo", lat: 9.4580, lng: -5.6297, aliases: [], type: "city" },
  { name: "Man", lat: 7.4125, lng: -7.5536, aliases: [], type: "city" },
  { name: "Gagnoa", lat: 6.1319, lng: -5.9506, aliases: [], type: "city" },
  { name: "Divo", lat: 5.8372, lng: -5.3572, aliases: [], type: "city" },
  { name: "Grand-Bassam", lat: 5.2122, lng: -3.7400, aliases: ["bassam", "grand bassam", "grand-bassam"], type: "city" },
  { name: "Adzopé", lat: 6.1050, lng: -3.8619, aliases: ["adzope"], type: "city" },
  { name: "Abengourou", lat: 6.7297, lng: -3.4964, aliases: [], type: "city" },
  { name: "Agboville", lat: 5.9286, lng: -4.2136, aliases: [], type: "city" },
  { name: "Bondoukou", lat: 8.0404, lng: -2.7997, aliases: [], type: "city" },
  { name: "Soubré", lat: 5.7856, lng: -6.5936, aliases: ["soubre"], type: "city" },
  { name: "Séguéla", lat: 7.9611, lng: -6.6731, aliases: ["seguela"], type: "city" },
  { name: "Odienné", lat: 9.5000, lng: -7.5667, aliases: ["odienne"], type: "city" },
  { name: "Ferkessédougou", lat: 9.5933, lng: -5.1947, aliases: ["ferke", "ferkessedougou"], type: "city" },
  { name: "Dimbokro", lat: 6.6500, lng: -4.7000, aliases: [], type: "city" },
  { name: "Duékoué", lat: 6.7392, lng: -7.3500, aliases: ["duekoue"], type: "city" },
  { name: "Bouaflé", lat: 6.9833, lng: -5.7500, aliases: ["bouafle"], type: "city" },
  { name: "Issia", lat: 6.4833, lng: -6.5833, aliases: [], type: "city" },
  { name: "Bongouanou", lat: 6.6500, lng: -4.2000, aliases: [], type: "city" },
  { name: "Dabou", lat: 5.3256, lng: -4.3767, aliases: [], type: "city" },
  { name: "Tiassalé", lat: 5.8983, lng: -4.8233, aliases: ["tiassale"], type: "city" },
  { name: "Sassandra", lat: 4.9500, lng: -6.0833, aliases: [], type: "city" },
  { name: "Tabou", lat: 4.4228, lng: -7.3531, aliases: [], type: "city" },
  { name: "Guiglo", lat: 6.5333, lng: -7.4833, aliases: [], type: "city" },
  { name: "Oumé", lat: 6.3833, lng: -5.4167, aliases: ["oume"], type: "city" },
  { name: "Sinfra", lat: 6.6167, lng: -5.9167, aliases: [], type: "city" },
  { name: "Katiola", lat: 8.1333, lng: -5.1000, aliases: [], type: "city" },
  { name: "Tengrela", lat: 10.4833, lng: -6.4000, aliases: [], type: "city" },
  { name: "Boundiali", lat: 9.5167, lng: -6.4833, aliases: [], type: "city" },
  
  // --- Quartiers de Bouaké ---
  { name: "Commerce", lat: 7.6889, lng: -5.0278, aliases: [], region: "Bouaké", type: "neighborhood" },
  { name: "Koko", lat: 7.6944, lng: -5.0361, aliases: [], region: "Bouaké", type: "neighborhood" },
  { name: "Air France", lat: 7.6833, lng: -5.0222, aliases: ["air-france"], region: "Bouaké", type: "neighborhood" },
  { name: "Belleville", lat: 7.6972, lng: -5.0333, aliases: [], region: "Bouaké", type: "neighborhood" },
  { name: "Dar-es-Salam", lat: 7.6917, lng: -5.0389, aliases: ["dar es salam", "daressalam"], region: "Bouaké", type: "neighborhood" },
  { name: "Sokoura", lat: 7.6861, lng: -5.0194, aliases: [], region: "Bouaké", type: "neighborhood" },
  { name: "N'Gattakro", lat: 7.6806, lng: -5.0417, aliases: ["ngattakro"], region: "Bouaké", type: "neighborhood" },
  
  // --- Quartiers de Yamoussoukro ---
  { name: "Habitat", lat: 6.8306, lng: -5.2917, aliases: [], region: "Yamoussoukro", type: "neighborhood" },
  { name: "Morofé", lat: 6.8222, lng: -5.2833, aliases: ["morofe"], region: "Yamoussoukro", type: "neighborhood" },
  { name: "Kokrenou", lat: 6.8361, lng: -5.2972, aliases: [], region: "Yamoussoukro", type: "neighborhood" },
  { name: "Assabou", lat: 6.8194, lng: -5.2861, aliases: [], region: "Yamoussoukro", type: "neighborhood" },
  
  // --- Quartiers de San-Pédro ---
  { name: "Cité Bardot", lat: 4.7528, lng: -6.6389, aliases: ["bardot"], region: "San-Pédro", type: "neighborhood" },
  { name: "Séwéké", lat: 4.7444, lng: -6.6306, aliases: ["seweke"], region: "San-Pédro", type: "neighborhood" },
  { name: "Lac", lat: 4.7556, lng: -6.6417, aliases: [], region: "San-Pédro", type: "neighborhood" },
  
  // --- Quartiers de Korhogo ---
  { name: "Soba", lat: 9.4556, lng: -5.6250, aliases: [], region: "Korhogo", type: "neighborhood" },
  { name: "Banaforo", lat: 9.4611, lng: -5.6333, aliases: [], region: "Korhogo", type: "neighborhood" },
  { name: "Koko Korhogo", lat: 9.4528, lng: -5.6278, aliases: [], region: "Korhogo", type: "neighborhood" },
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
