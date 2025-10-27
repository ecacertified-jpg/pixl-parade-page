import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminPermissions {
  manage_users: boolean;
  manage_admins: boolean;
  manage_content: boolean;
  manage_finances: boolean;
  view_analytics: boolean;
  manage_settings: boolean;
}

export type AdminRole = 'super_admin' | 'moderator' | null;

export const useAdmin = () => {
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>({
    manage_users: false,
    manage_admins: false,
    manage_content: false,
    manage_finances: false,
    view_analytics: false,
    manage_settings: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setAdminRole(null);
      setLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      // Appeler la fonction RPC pour récupérer le rôle
      const { data: roleData, error: roleError } = await supabase.rpc('current_user_role');
      
      if (roleError) {
        console.error('Error fetching admin role:', roleError);
        setAdminRole(null);
        setLoading(false);
        return;
      }

      // Si l'utilisateur n'est pas admin, arrêter
      if (roleData === 'user' || !roleData) {
        setAdminRole(null);
        setLoading(false);
        return;
      }

      // Récupérer les permissions de l'admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active')
        .eq('user_id', user?.id)
        .single();

      if (adminError || !adminData || !adminData.is_active) {
        setAdminRole(null);
        setLoading(false);
        return;
      }

      setAdminRole(adminData.role as AdminRole);
      
      // Safely parse permissions with defaults
      const perms = adminData.permissions as any || {};
      setPermissions({
        manage_users: perms.manage_users ?? false,
        manage_admins: perms.manage_admins ?? false,
        manage_content: perms.manage_content ?? false,
        manage_finances: perms.manage_finances ?? false,
        view_analytics: perms.view_analytics ?? false,
        manage_settings: perms.manage_settings ?? false,
      });
    } catch (error) {
      console.error('Error checking admin status:', error);
      setAdminRole(null);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = adminRole === 'super_admin';
  const isAdmin = adminRole !== null;

  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    if (isSuperAdmin) return true; // Super admin a toutes les permissions
    return permissions[permission] || false;
  };

  return {
    adminRole,
    permissions,
    loading,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    refetch: checkAdminStatus,
  };
};
