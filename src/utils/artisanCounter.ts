/**
 * Returns a unified artisan counter label for any page (birthday or event).
 * Returns `null` when there are no artisans (caller decides whether to hide).
 */
export function getArtisanCounterLabel(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return "🎉 Organisé avec l'aide d'un prestataire";
  return `🎉 ${count} artisans participent à cette célébration`;
}
