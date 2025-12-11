import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SessionValidationResult {
  valid: boolean;
  session: Session | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userMode: 'client' | 'business';
  setUserMode: (mode: 'client' | 'business') => void;
  hasBusinessAccount: boolean;
  refreshSession: () => Promise<boolean>;
  ensureValidSession: () => Promise<SessionValidationResult>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userMode: 'client',
  setUserMode: () => {},
  hasBusinessAccount: false,
  refreshSession: async () => false,
  ensureValidSession: async () => ({ valid: false, session: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBusinessAccount, setHasBusinessAccount] = useState(false);
  const [userMode, setUserModeState] = useState<'client' | 'business'>(() => {
    const savedMode = localStorage.getItem('userMode');
    return (savedMode === 'business' || savedMode === 'client') ? savedMode : 'client';
  });

  const setUserMode = (mode: 'client' | 'business') => {
    localStorage.setItem('userMode', mode);
    setUserModeState(mode);
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      return !!data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      setSession(null);
      setUser(null);
      return false;
    }
  };

  const ensureValidSession = async (): Promise<SessionValidationResult> => {
    try {
      // D'abord, vérifier la session existante
      const { data: { session: currentSession }, error: getError } = await supabase.auth.getSession();
      
      if (getError) {
        console.error('Error getting session:', getError);
        return { valid: false, session: null };
      }
      
      if (currentSession) {
        // Session existe, vérifier si elle n'est pas expirée
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        
        // Si la session expire dans moins de 5 minutes, la rafraîchir
        if (expiresAt && expiresAt - now < 300) {
          console.log('Session expiring soon, refreshing...');
          const refreshSuccess = await refreshSession();
          if (!refreshSuccess) {
            return { valid: false, session: null };
          }
          // Récupérer la nouvelle session après rafraîchissement
          const { data: { session: newSession } } = await supabase.auth.getSession();
          return { valid: !!newSession, session: newSession };
        }
        
        return { valid: true, session: currentSession };
      }
      
      // Pas de session, essayer de rafraîchir
      console.log('No session found, attempting refresh...');
      const refreshSuccess = await refreshSession();
      if (!refreshSuccess) {
        return { valid: false, session: null };
      }
      
      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      return { valid: !!refreshedSession, session: refreshedSession };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, session: null };
    }
  };

  const checkBusinessAccount = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('business_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      const hasBusiness = data !== null;
      console.log('AuthContext - checkBusinessAccount result:', hasBusiness, 'data:', data);
      setHasBusinessAccount(hasBusiness);
    } catch (error) {
      console.error('Error checking business account:', error);
      setHasBusinessAccount(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check business account when user changes
        if (session?.user) {
          setTimeout(() => checkBusinessAccount(session.user.id), 0);
        } else {
          setHasBusinessAccount(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkBusinessAccount(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userMode, setUserMode, hasBusinessAccount, refreshSession, ensureValidSession }}>
      {children}
    </AuthContext.Provider>
  );
};