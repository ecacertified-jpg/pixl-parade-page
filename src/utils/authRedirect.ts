import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
  const path = await getRedirectPath(user);
  navigate(path);
};
