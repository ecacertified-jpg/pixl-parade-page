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
      
      console.log('🔍 [ADMIN DEBUG] Checking admin status for user:', user?.id);
      
      // Fallback direct: interroger directement la table admin_users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active')
        .eq('user_id', user?.id)
        .single();

      console.log('🔍 [ADMIN DEBUG] Admin data query result:', { adminData, adminError });

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          // No rows found - user is not an admin
          console.log('🔍 [ADMIN DEBUG] User is not an admin (no record found)');
        } else {
          console.error('🔍 [ADMIN DEBUG] Error fetching admin data:', adminError);
        }
        setAdminRole(null);
        setLoading(false);
        return;
      }

      if (!adminData || !adminData.is_active) {
        console.log('🔍 [ADMIN DEBUG] Admin account exists but is not active:', adminData);
        setAdminRole(null);
        setLoading(false);
        return;
      }

      console.log('✅ [ADMIN DEBUG] User is admin with role:', adminData.role);
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
      
      console.log('✅ [ADMIN DEBUG] Permissions set:', perms);
    } catch (error) {
      console.error('❌ [ADMIN DEBUG] Error checking admin status:', error);
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
