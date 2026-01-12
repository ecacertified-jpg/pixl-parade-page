import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuthMethod {
  type: 'phone' | 'google' | 'email';
  value: string | null;
  verified: boolean;
}

export interface AccountLinkingState {
  authMethods: AuthMethod[];
  loading: boolean;
  error: string | null;
}

export function useAccountLinking() {
  const { user } = useAuth();
  const [state, setState] = useState<AccountLinkingState>({
    authMethods: [],
    loading: false,
    error: null,
  });

  const fetchAuthMethods = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const methods: AuthMethod[] = [];

      // Vérifier le téléphone
      if (currentUser.phone) {
        methods.push({
          type: 'phone',
          value: currentUser.phone,
          verified: true,
        });
      }

      // Vérifier Google
      const hasGoogle = currentUser.app_metadata?.provider === 'google' || 
        currentUser.identities?.some(i => i.provider === 'google');
      if (hasGoogle) {
        methods.push({
          type: 'google',
          value: currentUser.email,
          verified: true,
        });
      }

      // Vérifier email (non-Google)
      if (currentUser.email && !hasGoogle) {
        methods.push({
          type: 'email',
          value: currentUser.email,
          verified: currentUser.email_confirmed_at !== null,
        });
      }

      setState({
        authMethods: methods,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching auth methods:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur lors de la récupération des méthodes d\'authentification',
      }));
    }
  }, [user]);

  const linkPhone = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('link-account-identity', {
        body: {
          current_user_id: user.id,
          target_phone: phone,
        },
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      if (data.error) {
        if (data.error === 'phone_already_used') {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: 'Ce numéro est déjà utilisé par un autre compte. Vous pouvez demander une fusion de comptes.',
          }));
          return { 
            success: false, 
            error: data.message,
          };
        }
        setState(prev => ({ ...prev, loading: false, error: data.error }));
        return { success: false, error: data.error };
      }

      // Rafraîchir les méthodes d'auth
      await fetchAuthMethods();

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de la liaison du téléphone';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [user, fetchAuthMethods]);

  const checkExistingAccount = useCallback(async (
    phone?: string,
    email?: string,
    firstName?: string,
    city?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-existing-account', {
        body: { phone, email, first_name: firstName, city },
      });

      if (error) {
        console.error('Error checking existing account:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking existing account:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    fetchAuthMethods,
    linkPhone,
    checkExistingAccount,
  };
}
