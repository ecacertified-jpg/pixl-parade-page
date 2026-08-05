import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Slug generator: simple kebab + 5-char random suffix.
 */
const makeSlug = (firstName: string) => {
  const base = (firstName || 'page')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'page';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
};

export interface ExpressResult {
  slug: string | null;
  claimed: boolean;
}

/**
 * Runs after a successful signup/login when the URL has
 * `intent=express_birthday` or `claim=<token>`.
 *
 * - If a `claim` token is present, calls the `claim-client-account` edge
 *   function which transfers the pre-created birthday page to the user and
 *   grants the organizer admin rights.
 * - Otherwise, creates an active birthday page for the current year (if none
 *   exists yet) so the user lands directly on their published page.
 *
 * Best-effort: any failure resolves with `slug: null` and the caller
 * should fall back to `/dashboard?bp_express_failed=1`.
 */
export async function runExpressPostSignup(
  user: User,
  opts: { claim?: string | null } = {}
): Promise<ExpressResult> {
  try {
    if (opts.claim) {
      const { data, error } = await supabase.functions.invoke('claim-client-account', {
        body: { claim_token: opts.claim },
      });
      if (error) throw error;
      if (data?.slug) return { slug: data.slug as string, claimed: true };
    }

    const year = new Date().getFullYear();

    // 1) Réutiliser une page existante (année en cours en priorité, sinon la
    //    plus récente) au lieu d'en recréer une.
    const { data: pages } = await supabase
      .from('birthday_pages')
      .select('id, slug, celebration_year, published_at, is_active')
      .eq('user_id', user.id)
      .order('celebration_year', { ascending: false });

    const existing =
      pages?.find((p: any) => p.celebration_year === year) ??
      pages?.find((p: any) => p.is_active) ??
      pages?.[0];

    if (existing?.slug) {
      // Publier / réactiver si nécessaire, sans créer de nouvelle page.
      if (!existing.published_at || !existing.is_active) {
        const { error: pubErr } = await supabase
          .from('birthday_pages')
          .update({
            is_active: true,
            published_at: existing.published_at ?? new Date().toISOString(),
          } as any)
          .eq('id', existing.id);
        if (pubErr) console.warn('[expressSignup] publish existing page failed', pubErr);
      }
      try { localStorage.setItem(`bp_type_${user.id}`, 'self'); } catch {}
      return { slug: existing.slug as string, claimed: false };
    }

    const firstName =
      (user.user_metadata?.first_name as string) ||
      (user.user_metadata?.firstName as string) ||
      (user.email?.split('@')[0] as string) ||
      'Moi';
    const title = `${firstName} fête son anniversaire 🎂`;

    // Retry up to 3x on slug collision
    for (let i = 0; i < 3; i++) {
      const slug = makeSlug(firstName);
      const { data, error } = await supabase
        .from('birthday_pages')
        .insert({
          user_id: user.id,
          slug,
          celebration_year: year,
          title,
          is_active: true,
          // @ts-ignore - present in real schema
          published_at: new Date().toISOString(),
        } as any)
        .select('slug')
        .single();
      if (!error && data?.slug) {
        try {
          localStorage.setItem(`bp_type_${user.id}`, 'self');
          localStorage.setItem(`express_birthday_${user.id}`, '1');
        } catch {}
        return { slug: data.slug, claimed: false };
      }
      if (error && !`${error.message}`.toLowerCase().includes('unique')) {
        console.error('[expressSignup] insert error', error);
        break;
      }
    }
    return { slug: null, claimed: false };
  } catch (e) {
    console.error('[expressSignup] failed', e);
    return { slug: null, claimed: false };
  }
}

/**
 * Reads the current URL and returns the express-signup intent if any.
 */
export function readExpressIntent(): { intent: boolean; claim: string | null } {
  try {
    const url = new URL(window.location.href);
    const intent = url.searchParams.get('intent');
    const claim = url.searchParams.get('claim');
    const isExpress =
      intent === 'express_birthday' ||
      intent === 'create_birthday_page' ||
      !!claim;
    if (isExpress || claim) return { intent: isExpress, claim };

    // Fallback: intent persisted before an OAuth round-trip (Google strips
    // query params from the redirect URL).
    const stored = readStoredExpressIntent();
    if (stored) return stored;
    return { intent: false, claim: null };
  } catch {
    return { intent: false, claim: null };
  }
}

const EXPRESS_INTENT_KEY = 'jdv_express_intent';

/**
 * Persists the current URL express intent (if any) so it survives the
 * Google OAuth redirect, which drops query params.
 */
export function persistExpressIntent(): void {
  try {
    const url = new URL(window.location.href);
    const intent = url.searchParams.get('intent');
    const claim = url.searchParams.get('claim');
    const isExpress =
      intent === 'express_birthday' ||
      intent === 'create_birthday_page' ||
      !!claim;
    if (!isExpress) return;
    sessionStorage.setItem(
      EXPRESS_INTENT_KEY,
      JSON.stringify({ intent: true, claim: claim ?? null })
    );
  } catch {}
}

function readStoredExpressIntent(): { intent: boolean; claim: string | null } | null {
  try {
    const raw = sessionStorage.getItem(EXPRESS_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { intent?: boolean; claim?: string | null };
    return { intent: !!parsed?.intent, claim: parsed?.claim ?? null };
  } catch {
    return null;
  }
}

export function clearExpressIntent(): void {
  try {
    sessionStorage.removeItem(EXPRESS_INTENT_KEY);
  } catch {}
}