import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const getRedirectPath = async (user: User): Promise<string> => {
  try {
    // Check if user metadata indicates they signed up as business
    // This is the primary indicator of a real business account
    if (user.user_metadata?.is_business) {
      return '/business-account';
    }

    // Check if user has a business account
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    // Only redirect to business account if is_business flag is set
    // This prevents auto-created business accounts from redirecting regular users
    if (businessAccount && user.user_metadata?.is_business) {
      return '/business-account';
    }

    // Default to regular dashboard for all regular users
    return '/dashboard';
  } catch (error) {
    console.error('Error determining redirect path:', error);
    // Fallback to dashboard on error
    return '/dashboard';
  }
};

export const handleSmartRedirect = async (user: User, navigate: (path: string) => void) => {
  const path = await getRedirectPath(user);
  navigate(path);
};