import { useEffect } from 'react';
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

  // Continuously save current route for session restoration
  useEffect(() => {
    if (user && location.pathname !== '/auth') {
      localStorage.setItem('last_visited_route', location.pathname + location.search);
    }
  }, [user, location.pathname, location.search]);

  if (loading) {
    return null;
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