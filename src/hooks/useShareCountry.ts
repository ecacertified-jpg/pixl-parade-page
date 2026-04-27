import { useCountrySafe } from "@/contexts/CountryContext";

/**
 * Renvoie le code pays détecté pour pré-remplir les liens de partage
 * AVANT le clic sur un bouton "Partager".
 *
 * - S'appuie sur `CountryContext` qui auto-détecte le pays au boot
 *   (sessionStorage → profil utilisateur → IP via ipapi.co → défaut CI).
 * - `useCountrySafe()` est utilisé pour ne pas crasher si le composant est
 *   monté hors `CountryProvider` (ex. landing publique).
 * - `isReady` permet à un composant d'afficher l'état de détection si besoin
 *   (mais le clic sur "Partager" ne doit pas être bloqué : si la détection
 *   n'est pas finie, on tombe simplement sur l'URL canonique).
 */
export function useShareCountry(): {
  countryCode: string | null;
  isReady: boolean;
} {
  const ctx = useCountrySafe();
  if (!ctx) {
    return { countryCode: null, isReady: true };
  }
  return {
    countryCode: ctx.countryCode ?? null,
    isReady: !ctx.isDetecting,
  };
}