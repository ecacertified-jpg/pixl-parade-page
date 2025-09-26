import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
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

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          console.log('🔐 Initial session:', session?.user?.id || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id || 'No session');
        
        if (mounted) {
          // For SIGNED_OUT events, ensure we clear everything
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          } else {
            // For other events, validate session is actually working
            if (session?.user) {
              try {
                // Quick test to ensure the session works with Supabase
                const { error: testError } = await supabase
                  .from('profiles')
                  .select('id')
                  .limit(1);
                
                if (testError && testError.code === '401') {
                  console.warn('⚠️ Session appears invalid, clearing auth state');
                  setSession(null);
                  setUser(null);
                } else {
                  setSession(session);
                  setUser(session.user);
                }
              } catch (error) {
                console.error('Session validation failed:', error);
                setSession(session);
                setUser(session.user);
              }
            } else {
              setSession(session);
              setUser(session?.user ?? null);
            }
          }
          setLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};