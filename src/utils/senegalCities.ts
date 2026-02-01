// Villes et coordonnées du Sénégal pour JOIE DE VIVRE

import type { CityCoordinates } from "./ivoryCoastCities";

export const SENEGAL_CITIES: CityCoordinates[] = [
  // === DAKAR (Capitale) ===
  { name: "Dakar", lat: 14.6928, lng: -17.4467, aliases: ["dkr", "dakar"], type: "city" },
  
  // Communes d'arrondissement de Dakar
  { name: "Plateau", lat: 14.6683, lng: -17.4381, aliases: [], region: "Dakar", type: "commune" },
  { name: "Médina", lat: 14.6731, lng: -17.4550, aliases: ["medina"], region: "Dakar", type: "commune" },
  { name: "Grand Dakar", lat: 14.7017, lng: -17.4450, aliases: ["grand-dakar"], region: "Dakar", type: "commune" },
  { name: "Parcelles Assainies", lat: 14.7631, lng: -17.4181, aliases: ["parcelles"], region: "Dakar", type: "commune" },
  { name: "Almadies", lat: 14.7458, lng: -17.5153, aliases: [], region: "Dakar", type: "commune" },
  { name: "Ngor", lat: 14.7500, lng: -17.5167, aliases: [], region: "Dakar", type: "commune" },
  { name: "Ouakam", lat: 14.7250, lng: -17.4833, aliases: [], region: "Dakar", type: "commune" },
  { name: "Yoff", lat: 14.7644, lng: -17.4658, aliases: [], region: "Dakar", type: "commune" },
  { name: "Mermoz-Sacré-Cœur", lat: 14.7083, lng: -17.4833, aliases: ["mermoz", "sacre-coeur", "mermoz sacre coeur"], region: "Dakar", type: "commune" },
  { name: "Fann-Point E-Amitié", lat: 14.6889, lng: -17.4639, aliases: ["fann", "point e", "amitie", "fann-point-e"], region: "Dakar", type: "commune" },
  { name: "Gueule Tapée-Fass-Colobane", lat: 14.6806, lng: -17.4528, aliases: ["gueule tapee", "fass", "colobane"], region: "Dakar", type: "commune" },
  { name: "Hann Bel-Air", lat: 14.7167, lng: -17.4333, aliases: ["hann", "bel-air", "bel air"], region: "Dakar", type: "commune" },
  { name: "Sicap-Liberté", lat: 14.7083, lng: -17.4528, aliases: ["sicap", "liberte", "sicap liberte"], region: "Dakar", type: "commune" },
  { name: "HLM", lat: 14.7000, lng: -17.4500, aliases: [], region: "Dakar", type: "commune" },
  { name: "Grand Yoff", lat: 14.7417, lng: -17.4333, aliases: ["grand-yoff"], region: "Dakar", type: "commune" },
  { name: "Patte d'Oie", lat: 14.7500, lng: -17.4250, aliases: ["patte-d-oie"], region: "Dakar", type: "commune" },
  { name: "Cambérène", lat: 14.7833, lng: -17.4333, aliases: ["camberene"], region: "Dakar", type: "commune" },

  // Quartiers du Plateau
  { name: "Indépendance", lat: 14.6700, lng: -17.4350, aliases: ["independence"], region: "Plateau", type: "neighborhood" },
  { name: "Kermel", lat: 14.6656, lng: -17.4400, aliases: [], region: "Plateau", type: "neighborhood" },
  { name: "Sandaga", lat: 14.6678, lng: -17.4378, aliases: [], region: "Plateau", type: "neighborhood" },
  { name: "Peytavin", lat: 14.6639, lng: -17.4361, aliases: [], region: "Plateau", type: "neighborhood" },

  // Quartiers de Médina
  { name: "Médina Centre", lat: 14.6731, lng: -17.4550, aliases: [], region: "Médina", type: "neighborhood" },
  { name: "Rebeuss", lat: 14.6722, lng: -17.4500, aliases: [], region: "Médina", type: "neighborhood" },
  { name: "Tilène", lat: 14.6750, lng: -17.4583, aliases: ["tilene"], region: "Médina", type: "neighborhood" },

  // Quartiers de Grand Dakar
  { name: "HLM Grand Dakar", lat: 14.7000, lng: -17.4500, aliases: [], region: "Grand Dakar", type: "neighborhood" },
  { name: "Sicap Baobabs", lat: 14.7028, lng: -17.4472, aliases: ["baobabs"], region: "Grand Dakar", type: "neighborhood" },
  { name: "Dieuppeul", lat: 14.7056, lng: -17.4417, aliases: [], region: "Grand Dakar", type: "neighborhood" },

  // Quartiers de Mermoz-Sacré-Cœur
  { name: "Sacré-Cœur 1", lat: 14.7056, lng: -17.4750, aliases: ["sacre coeur 1"], region: "Mermoz-Sacré-Cœur", type: "neighborhood" },
  { name: "Sacré-Cœur 2", lat: 14.7083, lng: -17.4806, aliases: ["sacre coeur 2"], region: "Mermoz-Sacré-Cœur", type: "neighborhood" },
  { name: "Sacré-Cœur 3", lat: 14.7111, lng: -17.4861, aliases: ["sacre coeur 3"], region: "Mermoz-Sacré-Cœur", type: "neighborhood" },
  { name: "Sicap Foire", lat: 14.7139, lng: -17.4750, aliases: ["foire"], region: "Mermoz-Sacré-Cœur", type: "neighborhood" },
  { name: "Mermoz", lat: 14.7028, lng: -17.4778, aliases: [], region: "Mermoz-Sacré-Cœur", type: "neighborhood" },

  // Quartiers des Almadies
  { name: "Virage", lat: 14.7417, lng: -17.5083, aliases: [], region: "Almadies", type: "neighborhood" },
  { name: "Mamelles", lat: 14.7333, lng: -17.5000, aliases: [], region: "Almadies", type: "neighborhood" },
  { name: "Ngor Almadies", lat: 14.7472, lng: -17.5139, aliases: [], region: "Almadies", type: "neighborhood" },
  { name: "Phare des Mamelles", lat: 14.7306, lng: -17.4972, aliases: ["phare"], region: "Almadies", type: "neighborhood" },

  // Quartiers de Parcelles Assainies
  { name: "Unité 17", lat: 14.7667, lng: -17.4167, aliases: ["unite 17", "u17"], region: "Parcelles Assainies", type: "neighborhood" },
  { name: "Grand Médine", lat: 14.7583, lng: -17.4250, aliases: ["grand medine"], region: "Parcelles Assainies", type: "neighborhood" },
  { name: "Unité 26", lat: 14.7694, lng: -17.4111, aliases: ["unite 26", "u26"], region: "Parcelles Assainies", type: "neighborhood" },
  { name: "Unité 10", lat: 14.7611, lng: -17.4194, aliases: ["unite 10", "u10"], region: "Parcelles Assainies", type: "neighborhood" },
  { name: "Unité 6", lat: 14.7639, lng: -17.4222, aliases: ["unite 6", "u6"], region: "Parcelles Assainies", type: "neighborhood" },

  // Quartiers de Yoff
  { name: "Yoff Tonghor", lat: 14.7611, lng: -17.4694, aliases: ["tonghor"], region: "Yoff", type: "neighborhood" },
  { name: "Yoff Layène", lat: 14.7667, lng: -17.4611, aliases: ["layene"], region: "Yoff", type: "neighborhood" },
  { name: "Yoff Village", lat: 14.7639, lng: -17.4667, aliases: [], region: "Yoff", type: "neighborhood" },

  // === PIKINE (Banlieue) ===
  { name: "Pikine", lat: 14.7556, lng: -17.3906, aliases: [], type: "city" },
  
  // Quartiers de Pikine
  { name: "Pikine Est", lat: 14.7583, lng: -17.3833, aliases: [], region: "Pikine", type: "neighborhood" },
  { name: "Pikine Ouest", lat: 14.7528, lng: -17.3972, aliases: [], region: "Pikine", type: "neighborhood" },
  { name: "Tally Boumack", lat: 14.7611, lng: -17.3861, aliases: ["tally-boumack"], region: "Pikine", type: "neighborhood" },
  { name: "Guinaw Rails", lat: 14.7639, lng: -17.3944, aliases: ["guinaw-rails"], region: "Pikine", type: "neighborhood" },
  { name: "Thiaroye", lat: 14.7444, lng: -17.3667, aliases: [], region: "Pikine", type: "neighborhood" },
  { name: "Yeumbeul", lat: 14.7833, lng: -17.3500, aliases: [], region: "Pikine", type: "neighborhood" },
  { name: "Malika", lat: 14.7944, lng: -17.3333, aliases: [], region: "Pikine", type: "neighborhood" },

  // === GUÉDIAWAYE ===
  { name: "Guédiawaye", lat: 14.7767, lng: -17.3939, aliases: ["guediawaye"], type: "city" },
  
  // Quartiers de Guédiawaye
  { name: "Golf", lat: 14.7806, lng: -17.3972, aliases: [], region: "Guédiawaye", type: "neighborhood" },
  { name: "Sam Notaire", lat: 14.7778, lng: -17.3889, aliases: ["sam-notaire"], region: "Guédiawaye", type: "neighborhood" },
  { name: "Wakhinane", lat: 14.7722, lng: -17.4000, aliases: [], region: "Guédiawaye", type: "neighborhood" },
  { name: "Ndiarème", lat: 14.7750, lng: -17.3833, aliases: ["ndiareme"], region: "Guédiawaye", type: "neighborhood" },
  { name: "Sahm", lat: 14.7694, lng: -17.3917, aliases: [], region: "Guédiawaye", type: "neighborhood" },

  // === RUFISQUE ===
  { name: "Rufisque", lat: 14.7167, lng: -17.2667, aliases: [], type: "city" },
  
  // Quartiers de Rufisque
  { name: "Rufisque Est", lat: 14.7194, lng: -17.2583, aliases: [], region: "Rufisque", type: "neighborhood" },
  { name: "Rufisque Ouest", lat: 14.7139, lng: -17.2750, aliases: [], region: "Rufisque", type: "neighborhood" },
  { name: "Keury Kao", lat: 14.7111, lng: -17.2611, aliases: ["keury-kao"], region: "Rufisque", type: "neighborhood" },
  { name: "Colobane Rufisque", lat: 14.7222, lng: -17.2694, aliases: [], region: "Rufisque", type: "neighborhood" },
  { name: "Dangou", lat: 14.7083, lng: -17.2639, aliases: [], region: "Rufisque", type: "neighborhood" },

  // === KEUR MASSAR ===
  { name: "Keur Massar", lat: 14.7794, lng: -17.3144, aliases: ["keur-massar"], type: "city" },
  
  // Quartiers de Keur Massar
  { name: "Keur Massar Nord", lat: 14.7833, lng: -17.3111, aliases: [], region: "Keur Massar", type: "neighborhood" },
  { name: "Keur Massar Sud", lat: 14.7750, lng: -17.3167, aliases: [], region: "Keur Massar", type: "neighborhood" },
  { name: "Jaxaay", lat: 14.7806, lng: -17.3083, aliases: [], region: "Keur Massar", type: "neighborhood" },

  // === DIAMNIADIO ===
  { name: "Diamniadio", lat: 14.7000, lng: -17.1833, aliases: [], type: "city" },

  // === THIÈS ===
  { name: "Thiès", lat: 14.7833, lng: -16.9333, aliases: ["thies"], type: "city" },
  
  // Quartiers de Thiès
  { name: "Thiès Nord", lat: 14.7889, lng: -16.9306, aliases: ["thies nord"], region: "Thiès", type: "neighborhood" },
  { name: "Grand Standing", lat: 14.7861, lng: -16.9278, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "HLM Thiès", lat: 14.7806, lng: -16.9361, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Diakhao", lat: 14.7778, lng: -16.9417, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Randoulène", lat: 14.7917, lng: -16.9250, aliases: ["randoulene"], region: "Thiès", type: "neighborhood" },
  { name: "Hersent", lat: 14.7833, lng: -16.9389, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Mbour 2 Thiès", lat: 14.7750, lng: -16.9444, aliases: [], region: "Thiès", type: "neighborhood" },
  // Nouveaux quartiers de Thiès
  { name: "Mbour 1", lat: 14.7694, lng: -16.9500, aliases: ["mbour 1 thies"], region: "Thiès", type: "neighborhood" },
  { name: "Médina Fall", lat: 14.7722, lng: -16.9389, aliases: ["medina fall"], region: "Thiès", type: "neighborhood" },
  { name: "Nguinth", lat: 14.7778, lng: -16.9222, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Cité Lamy", lat: 14.7806, lng: -16.9444, aliases: ["cite lamy"], region: "Thiès", type: "neighborhood" },
  { name: "Escale", lat: 14.7889, lng: -16.9361, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Thialy", lat: 14.7750, lng: -16.9528, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Keur Issa", lat: 14.7944, lng: -16.9194, aliases: ["keur-issa"], region: "Thiès", type: "neighborhood" },
  { name: "Silmang", lat: 14.7667, lng: -16.9306, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "10ème", lat: 14.7833, lng: -16.9167, aliases: ["dixieme", "10e"], region: "Thiès", type: "neighborhood" },
  { name: "Darou Salam Thiès", lat: 14.7972, lng: -16.9278, aliases: ["darou salam"], region: "Thiès", type: "neighborhood" },
  { name: "Carrière", lat: 14.7611, lng: -16.9417, aliases: ["carriere"], region: "Thiès", type: "neighborhood" },
  { name: "Cité Senghor", lat: 14.7778, lng: -16.9083, aliases: ["cite senghor"], region: "Thiès", type: "neighborhood" },
  { name: "Takhikao", lat: 14.7639, lng: -16.9583, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Zone Portuaire", lat: 14.7917, lng: -16.9417, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Diamagueune", lat: 14.7556, lng: -16.9250, aliases: [], region: "Thiès", type: "neighborhood" },
  { name: "Keur Saib Ndoye", lat: 14.8000, lng: -16.9139, aliases: ["keur saib"], region: "Thiès", type: "neighborhood" },
  { name: "Sampathé", lat: 14.7694, lng: -16.9139, aliases: ["sampathe"], region: "Thiès", type: "neighborhood" },

  // === SAINT-LOUIS ===
  { name: "Saint-Louis", lat: 16.0167, lng: -16.5000, aliases: ["saint louis", "ndar"], type: "city" },
  
  // Quartiers de Saint-Louis
  { name: "Sor", lat: 16.0139, lng: -16.4917, aliases: [], region: "Saint-Louis", type: "neighborhood" },
  { name: "Guet Ndar", lat: 16.0278, lng: -16.5028, aliases: ["guet-ndar"], region: "Saint-Louis", type: "neighborhood" },
  { name: "Ndar Toute", lat: 16.0250, lng: -16.5056, aliases: [], region: "Saint-Louis", type: "neighborhood" },
  { name: "Île de Saint-Louis", lat: 16.0194, lng: -16.5000, aliases: ["ile saint-louis"], region: "Saint-Louis", type: "neighborhood" },
  { name: "Léona", lat: 16.0111, lng: -16.4861, aliases: ["leona"], region: "Saint-Louis", type: "neighborhood" },

  // === AUTRES GRANDES VILLES ===
  { name: "Kaolack", lat: 14.1500, lng: -16.0667, aliases: [], type: "city" },
  { name: "Ziguinchor", lat: 12.5667, lng: -16.2667, aliases: [], type: "city" },
  { name: "Touba", lat: 14.8500, lng: -15.8833, aliases: [], type: "city" },
  { name: "Mbour", lat: 14.4167, lng: -16.9667, aliases: [], type: "city" },
  { name: "Tambacounda", lat: 13.7667, lng: -13.6667, aliases: ["tamba"], type: "city" },
  { name: "Kolda", lat: 12.8833, lng: -14.9500, aliases: [], type: "city" },
  { name: "Diourbel", lat: 14.6500, lng: -16.2333, aliases: [], type: "city" },
  { name: "Louga", lat: 15.6167, lng: -16.2167, aliases: [], type: "city" },
  { name: "Matam", lat: 15.6556, lng: -13.2553, aliases: [], type: "city" },
  { name: "Fatick", lat: 14.3333, lng: -16.4000, aliases: [], type: "city" },
  { name: "Kaffrine", lat: 14.1000, lng: -15.5500, aliases: [], type: "city" },
  { name: "Kédougou", lat: 12.5500, lng: -12.1833, aliases: ["kedougou"], type: "city" },
  { name: "Sédhiou", lat: 12.7000, lng: -15.5500, aliases: ["sedhiou"], type: "city" },
  
  // Zones touristiques
  { name: "Saly", lat: 14.4500, lng: -17.0167, aliases: ["saly portudal"], type: "city" },
  { name: "Cap Skirring", lat: 12.3833, lng: -16.7500, aliases: ["cap-skirring"], type: "city" },
  { name: "Gorée", lat: 14.6667, lng: -17.4000, aliases: ["ile de goree"], type: "city" },
  { name: "Joal-Fadiouth", lat: 14.1667, lng: -16.8333, aliases: ["joal", "fadiouth"], type: "city" },
  { name: "Richard-Toll", lat: 16.4667, lng: -15.7000, aliases: ["richard toll"], type: "city" },
  { name: "Dagana", lat: 16.5167, lng: -15.5000, aliases: [], type: "city" },
  { name: "Podor", lat: 16.6500, lng: -14.9500, aliases: [], type: "city" },
  { name: "Linguère", lat: 15.3833, lng: -15.1167, aliases: ["linguere"], type: "city" },
  { name: "Nioro du Rip", lat: 13.7500, lng: -15.8000, aliases: ["nioro"], type: "city" },
  { name: "Vélingara", lat: 13.1500, lng: -14.1167, aliases: ["velingara"], type: "city" },
  { name: "Bignona", lat: 12.8167, lng: -16.2333, aliases: [], type: "city" },
  { name: "Oussouye", lat: 12.4833, lng: -16.5500, aliases: [], type: "city" },

  // Quartiers de Kaolack
  { name: "Kaolack Centre", lat: 14.1500, lng: -16.0667, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Médina Baye", lat: 14.1556, lng: -16.0583, aliases: ["medina baye"], region: "Kaolack", type: "neighborhood" },
  { name: "Ndangane", lat: 14.1444, lng: -16.0750, aliases: [], region: "Kaolack", type: "neighborhood" },
  // Nouveaux quartiers de Kaolack
  { name: "Sara", lat: 14.1389, lng: -16.0556, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Thiofack", lat: 14.1472, lng: -16.0611, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Léona Kaolack", lat: 14.1611, lng: -16.0722, aliases: ["leona"], region: "Kaolack", type: "neighborhood" },
  { name: "Bongré", lat: 14.1417, lng: -16.0806, aliases: ["bongre"], region: "Kaolack", type: "neighborhood" },
  { name: "Dialègne", lat: 14.1528, lng: -16.0528, aliases: ["dialegne"], region: "Kaolack", type: "neighborhood" },
  { name: "Sam", lat: 14.1361, lng: -16.0694, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Koutal", lat: 14.1639, lng: -16.0639, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Touba Kaolack", lat: 14.1583, lng: -16.0472, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Médina Mbaba", lat: 14.1333, lng: -16.0611, aliases: ["medina mbaba"], region: "Kaolack", type: "neighborhood" },
  { name: "Gandiaye", lat: 14.1667, lng: -16.0833, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Kasaville", lat: 14.1500, lng: -16.0861, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Ndorong", lat: 14.1278, lng: -16.0528, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Sing-Sing", lat: 14.1444, lng: -16.0417, aliases: ["sing sing"], region: "Kaolack", type: "neighborhood" },
  { name: "Kountia", lat: 14.1694, lng: -16.0556, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Kahone", lat: 14.1222, lng: -16.0750, aliases: [], region: "Kaolack", type: "neighborhood" },
  { name: "Ngane", lat: 14.1389, lng: -16.0333, aliases: [], region: "Kaolack", type: "neighborhood" },

  // Quartiers de Ziguinchor
  { name: "Ziguinchor Centre", lat: 12.5667, lng: -16.2667, aliases: [], region: "Ziguinchor", type: "neighborhood" },
  { name: "Boucotte", lat: 12.5694, lng: -16.2583, aliases: [], region: "Ziguinchor", type: "neighborhood" },
  { name: "Lyndiane", lat: 12.5611, lng: -16.2750, aliases: [], region: "Ziguinchor", type: "neighborhood" },
  { name: "Kandialang", lat: 12.5750, lng: -16.2528, aliases: [], region: "Ziguinchor", type: "neighborhood" },

  // Quartiers de Mbour
  { name: "Mbour Centre", lat: 14.4167, lng: -16.9667, aliases: [], region: "Mbour", type: "neighborhood" },
  { name: "Saly Portudal", lat: 14.4417, lng: -17.0083, aliases: ["saly portudal"], region: "Mbour", type: "neighborhood" },
  { name: "Nianing", lat: 14.3667, lng: -16.9333, aliases: [], region: "Mbour", type: "neighborhood" },
  { name: "Somone", lat: 14.4833, lng: -17.0667, aliases: [], region: "Mbour", type: "neighborhood" },
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
