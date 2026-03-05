import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { usePresenceTracker } from '@/hooks/usePresenceTracker';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Track user presence for admin realtime dashboard
  usePresenceTracker();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Sauvegarder l'URL de destination complète (avec query params) pour redirection après connexion
    const returnUrl = location.pathname + location.search;
    if (returnUrl && returnUrl !== '/' && returnUrl !== '/auth') {
      localStorage.setItem('returnUrl', returnUrl);
    }
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};