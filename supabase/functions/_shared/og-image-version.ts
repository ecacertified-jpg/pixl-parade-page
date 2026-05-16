/**
 * Canonical version stamp for the static social-preview image
 * (public/og-image.jpg). Bumping this value invalidates Facebook /
 * WhatsApp / LinkedIn caches by changing the og:image URL.
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH.
 * Imported by:
 *  - All edge functions that emit og:image meta tags
 *  - Frontend code via src/config/ogImage.ts (re-export)
 *
 * index.html cannot import TS, so its hardcoded ?v= value MUST be
 * kept in sync manually. Search the repo for OG_IMAGE_VERSION before
 * changing anything.
 *
 * Format: YYYYMMDDNN (date + 2-digit bump counter within the day).
 */
export const OG_IMAGE_VERSION = "2026051602";

export const OG_IMAGE_SITE_URL = "https://joiedevivre-africa.com";

/** Default absolute og:image URL with version cache-buster. */
export const DEFAULT_OG_IMAGE_URL =
  `${OG_IMAGE_SITE_URL}/og-image.jpg?v=${OG_IMAGE_VERSION}`;

/** Append the canonical ?v=... to any same-origin og-image path. */
export function withOgVersion(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${OG_IMAGE_VERSION}`;
}
