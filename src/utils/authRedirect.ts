import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { runExpressPostSignup, readExpressIntent, clearExpressIntent } from '@/utils/expressSignup';

const REDIRECT_TIMEOUT_MS = 3000;

export const getRedirectPath = async (user: User): Promise<string> => {
  try {
    const preferredMode = localStorage.getItem('userMode') as 'client' | 'business' | null;
    
    // Wrap business_accounts query in a timeout to prevent hanging
    const businessCheckPromise = supabase
      .from('business_accounts')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), REDIRECT_TIMEOUT_MS);
    });

    const result = await Promise.race([businessCheckPromise, timeoutPromise]);
    
    // If timeout won or error, fallback to dashboard
    if (!result || 'error' in result && result.error) {
      console.warn('⏱️ Redirect: business check timed out or failed, defaulting to /dashboard');
      return '/dashboard';
    }

    const businessAccount = 'data' in result ? result.data : null;
    const hasBusinessAccount = businessAccount !== null;
    
    if (preferredMode === 'business' && hasBusinessAccount) {
      return '/business-account';
    }
    
    if (user.user_metadata?.is_business && hasBusinessAccount) {
      return '/business-account';
    }
    
    return '/dashboard';
  } catch (error) {
    console.error('Error determining redirect path:', error);
    return '/dashboard';
  }
};

export const handleSmartRedirect = async (user: User, navigate: (path: string) => void) => {
  const path = await resolvePostAuthPath(user);
  navigate(path);
};

const isSafePath = (p: string | null | undefined): p is string =>
  !!p && p.startsWith('/') && p !== '/auth' && !p.startsWith('/auth?') && !p.startsWith('/auth/');

/**
 * Resolve the post-auth destination, honoring (in priority order):
 * 1. `?returnTo=` URL param
 * 2. `jdv_pending_intent.returnTo` (sessionStorage, set by AuthGate)
 * 3. `returnUrl` (localStorage, set by ProtectedRoute / AuthGate)
 * 4. `?redirect=` URL param (legacy compat, with create-fund passthrough)
 * 5. `last_visited_route` (localStorage)
 * 6. Smart fallback (business account vs `/dashboard`)
 *
 * When `isNewUser` is true and the resolved path is the dashboard fallback,
 * appends `?onboarding=true` so the onboarding overlay triggers. For any
 * other resolved path, we DO NOT force onboarding into the URL — the
 * `useOnboarding` hook will still raise the modal as an overlay so the
 * user keeps their original context.
 */
export const resolvePostAuthPath = async (
  user: User,
  opts?: { isNewUser?: boolean }
): Promise<string> => {
  // 0) Express birthday intent (or organizer claim token) — bypass other rules
  //    so the new user lands directly on their newly-published birthday page.
  try {
    const express = readExpressIntent();
    if (express.intent || express.claim) {
      const result = await runExpressPostSignup(user, { claim: express.claim });
      clearExpressIntent();
      if (result.slug) return `/birthday/${result.slug}?welcome=1`;
      return '/dashboard?bp_express_failed=1';
    }
  } catch (e) {
    console.warn('[resolvePostAuthPath] express flow failed', e);
  }

  // 1) ?returnTo= URL param
  try {
    const url = new URL(window.location.href);
    const returnTo = url.searchParams.get('returnTo');
    if (isSafePath(returnTo)) return returnTo;
  } catch {}

  // 2) AuthGate pending intent
  try {
    const raw = sessionStorage.getItem('jdv_pending_intent');
    if (raw) {
      const parsed = JSON.parse(raw) as { returnTo?: string };
      sessionStorage.removeItem('jdv_pending_intent');
      if (isSafePath(parsed?.returnTo)) return parsed!.returnTo!;
    }
  } catch {}

  // 3) localStorage returnUrl
  try {
    const returnUrl = localStorage.getItem('returnUrl');
    if (isSafePath(returnUrl)) {
      localStorage.removeItem('returnUrl');
      return returnUrl;
    }
  } catch {}

  // 4) ?redirect= legacy param
  try {
    const url = new URL(window.location.href);
    const redirectParam = url.searchParams.get('redirect');
    if (redirectParam) {
      const occasion = url.searchParams.get('occasion');
      const beneficiaryName = url.searchParams.get('beneficiaryName');
      if (redirectParam === 'create-fund' && (occasion || beneficiaryName)) {
        const params = new URLSearchParams();
        if (occasion) params.set('occasion', occasion);
        if (beneficiaryName) params.set('beneficiaryName', beneficiaryName);
        return `/create-fund?${params.toString()}`;
      }
      const safe = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
      if (isSafePath(safe)) return safe;
    }
  } catch {}

  // 5) last_visited_route
  try {
    const last = localStorage.getItem('last_visited_route');
    if (isSafePath(last) && last !== '/') {
      localStorage.removeItem('last_visited_route');
      return last;
    }
  } catch {}

  // 6) Smart fallback (business vs dashboard)
  const path = await getRedirectPath(user);
  if (opts?.isNewUser && path === '/dashboard') {
    // New signup with no explicit destination: auto-create + publish their
    // birthday page and land them straight on it.
    try {
      const result = await runExpressPostSignup(user);
      if (result.slug) return `/birthday/${result.slug}?welcome=1`;
    } catch (e) {
      console.warn('[resolvePostAuthPath] auto birthday page failed', e);
    }
    return '/dashboard?onboarding=true';
  }
  return path;
};
