import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userMode: 'client' | 'business';
  setUserMode: (mode: 'client' | 'business') => void;
  hasBusinessAccount: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userMode: 'client',
  setUserMode: () => {},
  hasBusinessAccount: false,
  refreshSession: async () => {},
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

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
    } catch (error) {
      console.error('Error refreshing session:', error);
      setSession(null);
      setUser(null);
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
    <AuthContext.Provider value={{ user, session, loading, userMode, setUserMode, hasBusinessAccount, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};