import { getAppBaseUrl } from "./appUrl";

const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || "vaimfeurvzokepqqqrsl";

const HOME_PREVIEW_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/home-preview`;

const SUPPORTED_COUNTRIES = ["CI", "BJ", "SN", "TG", "ML", "BF"] as const;
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

function isSupportedCountry(code?: string | null): code is SupportedCountry {
  if (!code) return false;
  return (SUPPORTED_COUNTRIES as readonly string[]).includes(code.toUpperCase());
}

/**
 * Construit une URL à partager sur les réseaux sociaux pour la home.
 * Quand un pays est fourni, on retourne l'URL de l'edge function `home-preview`,
 * qui sert un aperçu OG (titre, description) localisé aux crawlers et redirige
 * les humains vers la home.
 *
 * @param countryCode Code ISO du pays du partageur (ex: 'BJ', 'SN'). Optionnel.
 * @returns URL prête à être partagée sur WhatsApp / Facebook / X / etc.
 */
export function buildHomeShareUrl(countryCode?: string | null): string {
  // Si pas de pays valide ou pays par défaut (CI), on garde l'URL canonique.
  if (!isSupportedCountry(countryCode) || countryCode.toUpperCase() === "CI") {
    return `${getAppBaseUrl()}/`;
  }

  // URL de l'edge function : c'est elle qui sert l'aperçu localisé aux crawlers
  // et redirige les humains vers https://joiedevivre-africa.com/?c=XX.
  return `${HOME_PREVIEW_URL}?c=${countryCode.toUpperCase()}`;
}

/**
 * Construit une URL pour une page interne, avec option d'ajouter le pays.
 * Pour les pages internes (autres que la home), on ajoute simplement `?c=XX`
 * en query param sans passer par l'edge function.
 */
export function buildShareUrl(path: string, countryCode?: string | null): string {
  const base = getAppBaseUrl();
  const url = new URL(path, base);
  if (isSupportedCountry(countryCode) && countryCode.toUpperCase() !== "CI") {
    url.searchParams.set("c", countryCode.toUpperCase());
  }
  return url.toString();
}
