import { SUPABASE_URL } from "@/integrations/supabase/client";

/**
 * Build the public share URL for an Inspiration item.
 *
 * The URL points to the `inspiration-preview` Supabase Edge Function so social
 * crawlers (WhatsApp, Facebook, LinkedIn…) receive per-item Open Graph tags
 * (title, description, thumbnail). Human visitors are transparently redirected
 * back to the actual page (`/birthday/:slug?inspiration=…` or
 * `/event/:slug?inspiration=…`).
 */
export function buildInspirationShareUrl(shareToken: string): string {
  return `${SUPABASE_URL}/functions/v1/inspiration-preview?token=${encodeURIComponent(shareToken)}`;
}