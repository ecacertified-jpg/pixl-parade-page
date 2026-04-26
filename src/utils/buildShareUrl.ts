import { getAppBaseUrl } from "./appUrl";

const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || "vaimfeurvzokepqqqrsl";

const HOME_PREVIEW_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/home-preview`;

const SUPPORTED_COUNTRIES = ["CI", "BJ", "SN", "TG", "ML", "BF"] as const;
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Validation : un code pays est "supporté" s'il existe dans `SUPPORTED_COUNTRIES`
 * APRÈS normalisation (trim + uppercase + filtrage des caractères non-alpha).
 */
export function isSupportedCountry(code?: string | null): code is SupportedCountry {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return false;
  return (SUPPORTED_COUNTRIES as readonly string[]).includes(normalized);
}

/**
 * Nettoie un code pays brut : trim, uppercase, retire tout caractère non
 * alphabétique, tronque à 3 caractères max. Renvoie `""` si rien d'exploitable.
 */
function normalizeCountryCode(code?: string | null): string {
  if (!code) return "";
  return code.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

type CountryValidation = "supported" | "invalid" | "none";

/**
 * Catégorise un code pays brut :
 * - `none`     : pas de code fourni → on garde l'URL canonique (défaut CI).
 * - `supported`: code valide et reconnu.
 * - `invalid`  : code fourni mais inconnu → on déclenche le fallback générique
 *                "Afrique francophone" servi par l'edge function `home-preview`.
 */
function validateCountryCode(code?: string | null): {
  status: CountryValidation;
  normalized: string;
} {
  if (code === undefined || code === null || String(code).trim() === "") {
    return { status: "none", normalized: "" };
  }
  const normalized = normalizeCountryCode(code);
  if (!normalized) {
    return { status: "invalid", normalized: "" };
  }
  if ((SUPPORTED_COUNTRIES as readonly string[]).includes(normalized)) {
    return { status: "supported", normalized };
  }
  return { status: "invalid", normalized };
}

/**
 * Construit une URL à partager sur les réseaux sociaux pour la home.
 *
 * Comportement :
 * - Pas de code (`null`/`undefined`/vide) → URL canonique (défaut "Côte d'Ivoire").
 * - Code supporté autre que `CI` → URL de l'edge function `home-preview?c=XX`,
 *   qui sert un aperçu OG localisé aux crawlers et redirige les humains.
 * - Code supporté `CI` → URL canonique.
 * - Code fourni mais non supporté → URL de l'edge function avec le code nettoyé,
 *   l'edge function se chargera de servir l'aperçu générique
 *   "Afrique francophone | Capitales africaines".
 *
 * @param countryCode Code ISO du pays du partageur (ex: 'BJ', 'SN'). Optionnel.
 * @returns URL prête à être partagée sur WhatsApp / Facebook / X / etc.
 */
export function buildHomeShareUrl(countryCode?: string | null): string {
  const { status, normalized } = validateCountryCode(countryCode);

  // Pas de code, ou code = CI : URL canonique.
  if (status === "none" || (status === "supported" && normalized === "CI")) {
    return `${getAppBaseUrl()}/`;
  }

  // Code invalide sans rien d'exploitable après normalisation : fallback canonique.
  if (status === "invalid" && !normalized) {
    return `${getAppBaseUrl()}/`;
  }

  // Code supporté (autre que CI) ou code invalide nettoyé : on délègue à l'edge.
  // L'edge function décide d'afficher la version localisée (codes supportés)
  // ou la version générique "Afrique francophone" (codes invalides).
  return `${HOME_PREVIEW_URL}?c=${normalized}`;
}

/**
 * Construit une URL pour une page interne, avec option d'ajouter le pays.
 *
 * Pour les pages internes (autres que la home), on ajoute `?c=XX` uniquement
 * pour les codes **supportés** (et différents de CI, qui est le défaut).
 * Les codes invalides sont silencieusement ignorés pour ne pas polluer les URLs.
 */
export function buildShareUrl(path: string, countryCode?: string | null): string {
  const base = getAppBaseUrl();
  const url = new URL(path, base);
  const { status, normalized } = validateCountryCode(countryCode);
  if (status === "supported" && normalized !== "CI") {
    url.searchParams.set("c", normalized);
  }
  return url.toString();
}
