import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const getRedirectPath = async (user: User): Promise<string> => {
  try {
    // Check if user has a business account
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    // If user has an active business account, redirect to business space
    if (businessAccount?.is_active) {
      return '/business-account';
    }

    // If user has an inactive business account, still redirect to business but they'll see inactive status
    if (businessAccount) {
      return '/business-account';
    }

    // Check if user metadata indicates they signed up as business
    if (user.user_metadata?.is_business) {
      return '/business-account';
    }

    // Default to regular dashboard
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