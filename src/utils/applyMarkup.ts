/**
 * Applique un taux de majoration au prix d'un produit.
 * @param price Prix d'origine du prestataire
 * @param markupRate Taux de majoration en pourcentage (ex: 10 pour 10%)
 * @returns Prix majoré arrondi à l'entier
 */
export function applyMarkup(price: number, markupRate: number): number {
  if (!markupRate || markupRate <= 0) return price;
  return Math.round(price * (1 + markupRate / 100));
}
