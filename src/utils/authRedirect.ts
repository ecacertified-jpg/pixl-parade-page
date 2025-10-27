import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const getRedirectPath = async (user: User): Promise<string> => {
  try {
    // Récupérer le mode préféré depuis localStorage
    const preferredMode = localStorage.getItem('userMode') as 'client' | 'business' | null;
    
    // Vérifier si l'utilisateur a un business_account
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    const hasBusinessAccount = businessAccount !== null;
    
    // Si mode business préféré ET possède un business_account
    if (preferredMode === 'business' && hasBusinessAccount) {
      return '/business-account';
    }
    
    // Si flag is_business dans metadata ET a un business_account
    if (user.user_metadata?.is_business && hasBusinessAccount) {
      return '/business-account';
    }
    
    // Sinon, mode client par défaut
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