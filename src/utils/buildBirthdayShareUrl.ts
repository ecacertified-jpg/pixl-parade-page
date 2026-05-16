import { supabase } from "@/integrations/supabase/client";
import { getAppBaseUrl } from "./appUrl";

/**
 * Construit le tag de version utilisé pour invalider les caches OG
 * (WhatsApp, Facebook, LinkedIn...). DOIT matcher EXACTEMENT le format
 * calculé par `supabase/functions/birthday-preview/index.ts` :
 *   `${unix(updated_at)}-${social_share_photo_id?.slice(0,8) ?? 'default'}`
 */
export function computeBirthdayShareVersionTag(opts: {
  updatedAt?: string | null;
  socialSharePhotoId?: string | null;
}): string {
  const ts = opts.updatedAt
    ? Math.floor(new Date(opts.updatedAt).getTime() / 1000)
    : 0;
  const sharePhotoTag = opts.socialSharePhotoId
    ? opts.socialSharePhotoId.slice(0, 8)
    : "default";
  return `${ts}-${sharePhotoTag}`;
}

/**
 * Construit l'URL de partage pour une page d'anniversaire, en ajoutant
 * un cache-buster `?s=<versionTag>` qui force WhatsApp/Facebook à
 * re-scraper l'aperçu OG dès que l'image de partage change.
 *
 * - Si on dispose des champs `updatedAt` + `socialSharePhotoId`, la
 *   version est calculée immédiatement (sync).
 * - Sinon, on retourne l'URL canonique sans cache-buster.
 *
 * @example
 *   buildBirthdayShareUrl('ange-felicia--2026', {
 *     updatedAt: page.updated_at,
 *     socialSharePhotoId: page.social_share_photo_id,
 *   })
 *   // → https://joiedevivre-africa.com/birthday/ange-felicia--2026?s=1778894574-6f8dfe74
 */
export function buildBirthdayShareUrl(
  slug: string,
  opts?: { updatedAt?: string | null; socialSharePhotoId?: string | null },
): string {
  const base = getAppBaseUrl();
  const url = new URL(`/birthday/${slug}`, base);
  if (opts && (opts.updatedAt || opts.socialSharePhotoId)) {
    url.searchParams.set("s", computeBirthdayShareVersionTag(opts));
  }
  return url.toString();
}

/**
 * Variante asynchrone : récupère `updated_at` + `social_share_photo_id`
 * depuis la base puis construit l'URL versionnée. À utiliser quand le
 * call site ne dispose que du slug.
 */
export async function buildBirthdayShareUrlAsync(slug: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("birthday_pages")
      .select("updated_at, social_share_photo_id")
      .eq("slug", slug)
      .maybeSingle();
    return buildBirthdayShareUrl(slug, {
      updatedAt: data?.updated_at,
      socialSharePhotoId: data?.social_share_photo_id,
    });
  } catch {
    return buildBirthdayShareUrl(slug);
  }
}