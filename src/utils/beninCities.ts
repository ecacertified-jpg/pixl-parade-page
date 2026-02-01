import type { CityCoordinates } from "./ivoryCoastCities";

export const BENIN_CITIES: CityCoordinates[] = [
  // === COTONOU (Capitale économique) ===
  { name: "Cotonou", lat: 6.3654, lng: 2.4183, aliases: ["cot", "cotonou"], type: "city" },
  
  // Arrondissements/Communes de Cotonou
  { name: "Akpakpa", lat: 6.3667, lng: 2.4500, aliases: [], region: "Cotonou", type: "commune" },
  { name: "Cadjèhoun", lat: 6.3622, lng: 2.3897, aliases: ["cadjehoun"], region: "Cotonou", type: "commune" },
  { name: "Dantokpa", lat: 6.3619, lng: 2.4286, aliases: [], region: "Cotonou", type: "commune" },
  { name: "Gbégamey", lat: 6.3694, lng: 2.3861, aliases: ["gbegamey"], region: "Cotonou", type: "commune" },
  { name: "Haie Vive", lat: 6.3667, lng: 2.4000, aliases: ["haie-vive"], region: "Cotonou", type: "commune" },
  { name: "Mènontin", lat: 6.3833, lng: 2.3667, aliases: ["menontin"], region: "Cotonou", type: "commune" },
  { name: "Zongo", lat: 6.3583, lng: 2.4333, aliases: [], region: "Cotonou", type: "commune" },
  { name: "Fidjrossè", lat: 6.3542, lng: 2.3611, aliases: ["fidjrosse"], region: "Cotonou", type: "commune" },
  { name: "Sainte-Rita", lat: 6.3750, lng: 2.4083, aliases: ["sainte rita"], region: "Cotonou", type: "commune" },
  { name: "Placodji", lat: 6.3583, lng: 2.4167, aliases: [], region: "Cotonou", type: "commune" },
  { name: "Agla", lat: 6.3750, lng: 2.3750, aliases: [], region: "Cotonou", type: "commune" },
  { name: "Houéyiho", lat: 6.3639, lng: 2.3833, aliases: ["houeyiho"], region: "Cotonou", type: "commune" },
  { name: "Sikècodji", lat: 6.3528, lng: 2.4083, aliases: ["sikecodji"], region: "Cotonou", type: "commune" },

  // Quartiers d'Akpakpa
  { name: "PK10", lat: 6.3750, lng: 2.4583, aliases: ["pk 10"], region: "Akpakpa", type: "neighborhood" },
  { name: "Agblangandan", lat: 6.3861, lng: 2.4694, aliases: [], region: "Akpakpa", type: "neighborhood" },
  { name: "Aïbatin", lat: 6.3694, lng: 2.4556, aliases: ["aibatin"], region: "Akpakpa", type: "neighborhood" },
  { name: "Womey", lat: 6.3778, lng: 2.4611, aliases: [], region: "Akpakpa", type: "neighborhood" },
  { name: "Sènadé", lat: 6.3722, lng: 2.4639, aliases: ["senade"], region: "Akpakpa", type: "neighborhood" },
  { name: "Ahouanlèko", lat: 6.3806, lng: 2.4528, aliases: ["ahouanleko"], region: "Akpakpa", type: "neighborhood" },
  { name: "Avotrou", lat: 6.3639, lng: 2.4472, aliases: [], region: "Akpakpa", type: "neighborhood" },
  { name: "Gbèdjromèdé", lat: 6.3694, lng: 2.4417, aliases: ["gbedjiromede"], region: "Akpakpa", type: "neighborhood" },

  // Quartiers de Cadjèhoun
  { name: "Patte d'Oie", lat: 6.3583, lng: 2.3806, aliases: ["patte-d-oie", "patte d oie"], region: "Cadjèhoun", type: "neighborhood" },
  { name: "Les Cocotiers", lat: 6.3556, lng: 2.3750, aliases: ["cocotiers"], region: "Cadjèhoun", type: "neighborhood" },
  { name: "Fidjrossè Kpota", lat: 6.3500, lng: 2.3556, aliases: ["fidjrosse kpota"], region: "Cadjèhoun", type: "neighborhood" },
  { name: "Togbin", lat: 6.3444, lng: 2.3472, aliases: [], region: "Cadjèhoun", type: "neighborhood" },

  // Quartiers de Dantokpa
  { name: "Marché Dantokpa", lat: 6.3611, lng: 2.4278, aliases: ["marche dantokpa"], region: "Dantokpa", type: "neighborhood" },
  { name: "Jonquet", lat: 6.3556, lng: 2.4250, aliases: [], region: "Dantokpa", type: "neighborhood" },
  { name: "Missèbo", lat: 6.3639, lng: 2.4306, aliases: ["missebo"], region: "Dantokpa", type: "neighborhood" },
  { name: "Gbèto", lat: 6.3583, lng: 2.4222, aliases: ["gbeto"], region: "Dantokpa", type: "neighborhood" },

  // Quartiers de Gbégamey
  { name: "Vodjè", lat: 6.3750, lng: 2.3917, aliases: ["vodje"], region: "Gbégamey", type: "neighborhood" },
  { name: "Akpakpa Centre", lat: 6.3667, lng: 2.3889, aliases: [], region: "Gbégamey", type: "neighborhood" },
  { name: "Kowégbo", lat: 6.3722, lng: 2.3833, aliases: ["kowegbo"], region: "Gbégamey", type: "neighborhood" },

  // Quartiers de Haie Vive
  { name: "Zogbo", lat: 6.3722, lng: 2.4028, aliases: [], region: "Haie Vive", type: "neighborhood" },
  { name: "Cica Toyota", lat: 6.3639, lng: 2.3972, aliases: ["cica-toyota"], region: "Haie Vive", type: "neighborhood" },
  { name: "Saint-Michel", lat: 6.3694, lng: 2.4056, aliases: ["saint michel"], region: "Haie Vive", type: "neighborhood" },
  { name: "Aidjèdo", lat: 6.3611, lng: 2.3944, aliases: ["aidjedo"], region: "Haie Vive", type: "neighborhood" },

  // Quartiers de Mènontin
  { name: "Carrefour", lat: 6.3861, lng: 2.3694, aliases: [], region: "Mènontin", type: "neighborhood" },
  { name: "Jéricho", lat: 6.3889, lng: 2.3611, aliases: ["jericho"], region: "Mènontin", type: "neighborhood" },
  { name: "Mènontin Centre", lat: 6.3833, lng: 2.3639, aliases: [], region: "Mènontin", type: "neighborhood" },

  // Quartiers de Fidjrossè
  { name: "Fidjrossè Plage", lat: 6.3500, lng: 2.3583, aliases: ["fidjrosse plage"], region: "Fidjrossè", type: "neighborhood" },
  { name: "Fidjrossè Centre", lat: 6.3528, lng: 2.3611, aliases: [], region: "Fidjrossè", type: "neighborhood" },

  // === PORTO-NOVO (Capitale administrative) ===
  { name: "Porto-Novo", lat: 6.4969, lng: 2.6283, aliases: ["porto novo", "porto-novo", "pn"], type: "city" },
  
  // Quartiers de Porto-Novo
  { name: "Ouando", lat: 6.5000, lng: 2.6333, aliases: [], region: "Porto-Novo", type: "neighborhood" },
  { name: "Tokpota", lat: 6.4833, lng: 2.6167, aliases: [], region: "Porto-Novo", type: "neighborhood" },
  { name: "Djègan", lat: 6.4889, lng: 2.6222, aliases: ["djegan"], region: "Porto-Novo", type: "neighborhood" },
  { name: "Houinmè", lat: 6.4944, lng: 2.6389, aliases: ["houinme"], region: "Porto-Novo", type: "neighborhood" },
  { name: "Agbokou", lat: 6.5056, lng: 2.6278, aliases: [], region: "Porto-Novo", type: "neighborhood" },
  { name: "Akonaboè", lat: 6.4917, lng: 2.6194, aliases: ["akonaboe"], region: "Porto-Novo", type: "neighborhood" },
  { name: "Attakè", lat: 6.5028, lng: 2.6361, aliases: ["attake"], region: "Porto-Novo", type: "neighborhood" },
  { name: "Zèbou", lat: 6.4972, lng: 2.6444, aliases: ["zebou"], region: "Porto-Novo", type: "neighborhood" },
  { name: "Djassin", lat: 6.4861, lng: 2.6111, aliases: [], region: "Porto-Novo", type: "neighborhood" },
  { name: "Centre-Ville Porto-Novo", lat: 6.4944, lng: 2.6250, aliases: ["centre ville porto-novo"], region: "Porto-Novo", type: "neighborhood" },

  // === ABOMEY-CALAVI (Grande agglomération) ===
  { name: "Abomey-Calavi", lat: 6.4486, lng: 2.3556, aliases: ["calavi", "abomey calavi"], type: "city" },
  
  // Quartiers d'Abomey-Calavi
  { name: "Godomey", lat: 6.4000, lng: 2.3500, aliases: [], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Togba", lat: 6.4333, lng: 2.3333, aliases: [], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Zogbadjè", lat: 6.4417, lng: 2.3444, aliases: ["zogbadje"], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Tankpè", lat: 6.4556, lng: 2.3611, aliases: ["tankpe"], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Akassato", lat: 6.4722, lng: 2.3694, aliases: [], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Togoudo", lat: 6.4611, lng: 2.3528, aliases: [], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Agori", lat: 6.4389, lng: 2.3389, aliases: [], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Hêvié", lat: 6.4278, lng: 2.3250, aliases: ["hevie"], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Wolomè", lat: 6.4167, lng: 2.3167, aliases: ["wolome"], region: "Abomey-Calavi", type: "neighborhood" },
  { name: "Calavi Centre", lat: 6.4500, lng: 2.3556, aliases: [], region: "Abomey-Calavi", type: "neighborhood" },

  // === PARAKOU (Nord) ===
  { name: "Parakou", lat: 9.3372, lng: 2.6303, aliases: [], type: "city" },
  
  // Quartiers de Parakou
  { name: "Banikanni", lat: 9.3417, lng: 2.6361, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Tourou", lat: 9.3333, lng: 2.6222, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Albarika", lat: 9.3444, lng: 2.6278, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Zongo Parakou", lat: 9.3306, lng: 2.6389, aliases: ["zongo"], region: "Parakou", type: "neighborhood" },
  { name: "Guéma", lat: 9.3500, lng: 2.6333, aliases: ["guema"], region: "Parakou", type: "neighborhood" },
  { name: "Titirou", lat: 9.3278, lng: 2.6167, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Kpébié", lat: 9.3389, lng: 2.6417, aliases: ["kpebie"], region: "Parakou", type: "neighborhood" },
  // Nouveaux quartiers de Parakou
  { name: "Ladji-Farani", lat: 9.3450, lng: 2.6250, aliases: ["ladji farani", "farani"], region: "Parakou", type: "neighborhood" },
  { name: "Arafat", lat: 9.3528, lng: 2.6194, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Camp Adagbe", lat: 9.3361, lng: 2.6306, aliases: ["camp adagbé", "adagbe"], region: "Parakou", type: "neighborhood" },
  { name: "Ganou", lat: 9.3222, lng: 2.6278, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Tranza", lat: 9.3389, lng: 2.6139, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Nima", lat: 9.3472, lng: 2.6333, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Thian-Thia", lat: 9.3250, lng: 2.6417, aliases: ["thian thia", "thianthia"], region: "Parakou", type: "neighborhood" },
  { name: "Koroborou", lat: 9.3306, lng: 2.6083, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Kpébié-Koka", lat: 9.3417, lng: 2.6444, aliases: ["kpebie koka", "koka"], region: "Parakou", type: "neighborhood" },
  { name: "Madina Parakou", lat: 9.3333, lng: 2.6333, aliases: ["madina"], region: "Parakou", type: "neighborhood" },
  { name: "Dépôt", lat: 9.3361, lng: 2.6222, aliases: ["depot", "gare"], region: "Parakou", type: "neighborhood" },
  { name: "Hubert Maga", lat: 9.3500, lng: 2.6250, aliases: ["hubert-maga"], region: "Parakou", type: "neighborhood" },
  { name: "Wansirou", lat: 9.3444, lng: 2.6361, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Baka", lat: 9.3194, lng: 2.6167, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Gah", lat: 9.3528, lng: 2.6278, aliases: [], region: "Parakou", type: "neighborhood" },
  { name: "Zongo II", lat: 9.3278, lng: 2.6444, aliases: ["zongo 2"], region: "Parakou", type: "neighborhood" },
  { name: "Okédama", lat: 9.3556, lng: 2.6167, aliases: ["okedama"], region: "Parakou", type: "neighborhood" },

  // === AUTRES GRANDES VILLES ===
  { name: "Djougou", lat: 9.7083, lng: 1.6658, aliases: [], type: "city" },
  { name: "Bohicon", lat: 7.1778, lng: 2.0667, aliases: [], type: "city" },
  { name: "Natitingou", lat: 10.3042, lng: 1.3797, aliases: ["nati"], type: "city" },
  { name: "Lokossa", lat: 6.6386, lng: 1.7167, aliases: [], type: "city" },
  { name: "Abomey", lat: 7.1833, lng: 1.9833, aliases: [], type: "city" },
  { name: "Ouidah", lat: 6.3667, lng: 2.0833, aliases: ["whydah"], type: "city" },
  { name: "Kandi", lat: 11.1306, lng: 2.9378, aliases: [], type: "city" },
  { name: "Malanville", lat: 11.8667, lng: 3.3833, aliases: [], type: "city" },
  { name: "Savalou", lat: 7.9333, lng: 1.9833, aliases: [], type: "city" },
  { name: "Sakété", lat: 6.7333, lng: 2.6500, aliases: ["sakete"], type: "city" },
  { name: "Pobè", lat: 6.9833, lng: 2.6667, aliases: ["pobe"], type: "city" },
  { name: "Dogbo", lat: 6.8000, lng: 1.7833, aliases: [], type: "city" },
  { name: "Comè", lat: 6.4000, lng: 1.8833, aliases: ["come"], type: "city" },
  { name: "Grand-Popo", lat: 6.2833, lng: 1.8167, aliases: ["grand popo", "grand-popo"], type: "city" },
  { name: "Sèmè-Podji", lat: 6.3833, lng: 2.6167, aliases: ["seme", "seme-podji", "seme podji"], type: "city" },
  { name: "Allada", lat: 6.6667, lng: 2.1500, aliases: [], type: "city" },
  { name: "Tchaourou", lat: 8.8833, lng: 2.6000, aliases: [], type: "city" },
  { name: "Nikki", lat: 9.9333, lng: 3.2167, aliases: [], type: "city" },
  { name: "Bassila", lat: 9.0167, lng: 1.6667, aliases: [], type: "city" },
  { name: "Kétou", lat: 7.3500, lng: 2.6000, aliases: ["ketou"], type: "city" },
  { name: "Dassa-Zoumè", lat: 7.7500, lng: 2.1833, aliases: ["dassa", "dassa-zoume"], type: "city" },
  { name: "Glazoué", lat: 7.9667, lng: 2.2333, aliases: ["glazoue"], type: "city" },
  { name: "Covè", lat: 7.2167, lng: 2.3333, aliases: ["cove"], type: "city" },
  { name: "Savè", lat: 8.0333, lng: 2.4833, aliases: ["save"], type: "city" },
  { name: "Banikoara", lat: 11.3000, lng: 2.4333, aliases: [], type: "city" },
  { name: "Tanguiéta", lat: 10.6167, lng: 1.2667, aliases: ["tanguieta"], type: "city" },
  { name: "Kouandé", lat: 10.3333, lng: 1.6833, aliases: ["kouande"], type: "city" },
  { name: "Copargo", lat: 9.8500, lng: 1.5333, aliases: [], type: "city" },
  { name: "Aplahoué", lat: 6.9333, lng: 1.6833, aliases: ["aplahoue"], type: "city" },

  // Quartiers de Bohicon
  { name: "Bohicon Centre", lat: 7.1778, lng: 2.0667, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Lissèzoun", lat: 7.1833, lng: 2.0722, aliases: ["lissezoun"], region: "Bohicon", type: "neighborhood" },
  { name: "Saclo", lat: 7.1722, lng: 2.0611, aliases: [], region: "Bohicon", type: "neighborhood" },
  // Nouveaux quartiers de Bohicon
  { name: "Agongointo", lat: 7.1750, lng: 2.0583, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Avogbanna", lat: 7.1806, lng: 2.0750, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Soglogon", lat: 7.1694, lng: 2.0694, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Gnidjazoun", lat: 7.1889, lng: 2.0639, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Passagon", lat: 7.1722, lng: 2.0778, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Zakpo", lat: 7.1667, lng: 2.0611, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Sèhoun", lat: 7.1861, lng: 2.0806, aliases: ["sehoun"], region: "Bohicon", type: "neighborhood" },
  { name: "Dogoudo", lat: 7.1778, lng: 2.0528, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Gbèhanzoun", lat: 7.1639, lng: 2.0750, aliases: ["gbehanzoun"], region: "Bohicon", type: "neighborhood" },
  { name: "Agouako", lat: 7.1806, lng: 2.0583, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Kinta", lat: 7.1750, lng: 2.0833, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Ouassaho", lat: 7.1611, lng: 2.0639, aliases: [], region: "Bohicon", type: "neighborhood" },
  { name: "Zounzonmè", lat: 7.1917, lng: 2.0722, aliases: ["zounzonme"], region: "Bohicon", type: "neighborhood" },
  { name: "Houégbo", lat: 7.1694, lng: 2.0556, aliases: ["houegbo"], region: "Bohicon", type: "neighborhood" },

  // Quartiers d'Ouidah
  { name: "Ouidah Centre", lat: 6.3667, lng: 2.0833, aliases: [], region: "Ouidah", type: "neighborhood" },
  { name: "Pahou", lat: 6.3833, lng: 2.1167, aliases: [], region: "Ouidah", type: "neighborhood" },
  { name: "Kpassè", lat: 6.3611, lng: 2.0778, aliases: ["kpasse"], region: "Ouidah", type: "neighborhood" },
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
