export interface CelebrationArtisanRole {
  key: string;
  label: string;
  emoji: string;
}

export const CELEBRATION_ARTISAN_ROLES: CelebrationArtisanRole[] = [
  { key: 'organisateur', label: 'Organisateur', emoji: '🎉' },
  { key: 'decorateur', label: 'Décorateur', emoji: '🎈' },
  { key: 'patissier', label: 'Pâtissier', emoji: '🎂' },
  { key: 'photographe', label: 'Photographe', emoji: '📸' },
  { key: 'videaste', label: 'Vidéaste', emoji: '🎥' },
  { key: 'animateur', label: 'Animateur / DJ', emoji: '🎤' },
  { key: 'maquilleuse', label: 'Maquilleuse', emoji: '💄' },
  { key: 'autre', label: 'Autre prestataire', emoji: '🎁' },
];

export const getArtisanRole = (key: string): CelebrationArtisanRole | undefined =>
  CELEBRATION_ARTISAN_ROLES.find((r) => r.key === key);