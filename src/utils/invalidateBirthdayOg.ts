import { supabase } from '@/integrations/supabase/client';

/**
 * Asks the backend to invalidate the OG image cache for a birthday page
 * and re-prime social-network scrapers (Facebook/WhatsApp, LinkedIn).
 *
 * Fire-and-forget: never throws. Call after any mutation that changes how
 * the birthday page should appear in shared previews (publish, cover
 * change, title change, profile picture change, etc.).
 */
export async function invalidateBirthdayOg(slug: string | null | undefined): Promise<void> {
  if (!slug) return;
  try {
    await supabase.functions.invoke('invalidate-birthday-og', {
      body: { slug },
    });
  } catch (err) {
    // Non-blocking by design — log only.
    console.warn('invalidateBirthdayOg failed:', err);
  }
}