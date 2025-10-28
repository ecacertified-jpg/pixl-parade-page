import { useAdmin, AdminRole } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

export const AdminRoute = ({ children, requiredRole }: AdminRouteProps) => {
  console.warn('🔒🔒🔒 AdminRoute RENDERED 🔒🔒🔒');
  
  const { isAdmin, adminRole, loading, isSuperAdmin } = useAdmin();
  
  console.warn('🔒 AdminRoute state:', { isAdmin, adminRole, loading, isSuperAdmin });

  if (loading) {
    console.warn('🔒 AdminRoute - Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si pas admin du tout, rediriger vers home
  if (!isAdmin) {
    console.warn('🔒 AdminRoute - User is NOT admin, redirecting to /');
    return <Navigate to="/" replace />;
  }
  
  console.warn('🔒 AdminRoute - User IS admin, allowing access');

  // Si un rôle spécifique est requis et l'utilisateur ne l'a pas
  if (requiredRole && requiredRole === 'super_admin' && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les Super Administrateurs peuvent y accéder.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
