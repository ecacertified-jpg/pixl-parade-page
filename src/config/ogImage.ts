/**
 * Frontend re-export of the canonical OG image version stamp.
 * Single source of truth lives in supabase/functions/_shared/og-image-version.ts
 * so edge functions and frontend code share the exact same value.
 */
export {
  OG_IMAGE_VERSION,
  OG_IMAGE_SITE_URL,
  DEFAULT_OG_IMAGE_URL,
  withOgVersion,
} from "../../supabase/functions/_shared/og-image-version";
