/**
 * Catalogue des fêtes calendaires utilisable pour les vidéos de couverture.
 * Les fêtes à date fixe pré-remplissent le mois/jour ; les fêtes mobiles
 * (movable = true) imposent à l'utilisateur de saisir la date.
 */

export interface CalendarEventPreset {
  key: string;
  label: string;
  month?: number; // 1-12
  day?: number; // 1-31
  movable?: boolean;
}

export const CALENDAR_EVENT_PRESETS: CalendarEventPreset[] = [
  { key: "nouvel_an", label: "Nouvel An", month: 1, day: 1 },
  { key: "saint_valentin", label: "Saint Valentin", month: 2, day: 14 },
  { key: "journee_femmes", label: "Journée Mondiale des Femmes", month: 3, day: 8 },
  { key: "paques", label: "Pâques", movable: true },
  { key: "fete_meres", label: "Fête des Mères", movable: true },
  { key: "fete_peres", label: "Fête des Pères", movable: true },
  { key: "toussaint", label: "Toussaint", month: 11, day: 1 },
  { key: "noel", label: "Noël", month: 12, day: 25 },
  { key: "aid_el_fitr", label: "Aïd el-Fitr", movable: true },
  { key: "aid_el_kebir", label: "Tabaski (Aïd el-Kébir)", movable: true },
  { key: "ramadan", label: "Début du Ramadan", movable: true },
  { key: "fete_independance", label: "Fête de l'Indépendance", movable: true },
  { key: "autre", label: "Autre fête", movable: true },
];

export function findEventPreset(key: string | null | undefined): CalendarEventPreset | undefined {
  if (!key) return undefined;
  return CALENDAR_EVENT_PRESETS.find((p) => p.key === key);
}