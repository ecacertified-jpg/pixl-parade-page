import { useState, useEffect, useCallback } from 'react';
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

export type AdminRole = 'super_admin' | 'regional_admin' | 'moderator' | null;

export const useAdmin = () => {
  console.warn('⚠️⚠️⚠️ useAdmin HOOK CALLED ⚠️⚠️⚠️');
  
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>({
    manage_users: false,
    manage_admins: false,
    manage_content: false,
    manage_finances: false,
    view_analytics: false,
    manage_settings: false,
  });
  const [assignedCountries, setAssignedCountries] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  
  console.warn('⚠️ useAdmin - Current user:', user?.id, 'AuthContext loading:', authLoading);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else if (!authLoading) {
      // Seulement si AuthContext a fini de charger et qu'il n'y a pas d'utilisateur
      console.warn('⚠️ useAdmin - No user found after auth loading complete');
      setAdminRole(null);
      setAssignedCountries(null);
      setLoading(false);
    }
    // Si authLoading = true, on garde loading = true
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      console.warn('🔍 [ADMIN DEBUG] Checking admin status for user:', user?.id);
      
      // Fallback direct: interroger directement la table admin_users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active, assigned_countries')
        .eq('user_id', user?.id)
        .single();

      console.warn('🔍 [ADMIN DEBUG] Admin data query result:', { adminData, adminError });

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          // No rows found - user is not an admin
          console.warn('🔍 [ADMIN DEBUG] User is not an admin (no record found)');
        } else {
          console.error('🔍 [ADMIN DEBUG] Error fetching admin data:', adminError);
        }
        setAdminRole(null);
        setAssignedCountries(null);
        setLoading(false);
        return;
      }

      if (!adminData || !adminData.is_active) {
        console.warn('🔍 [ADMIN DEBUG] Admin account exists but is not active:', adminData);
        setAdminRole(null);
        setAssignedCountries(null);
        setLoading(false);
        return;
      }

      console.warn('✅ [ADMIN DEBUG] User is admin with role:', adminData.role);
      setAdminRole(adminData.role as AdminRole);
      setAssignedCountries(adminData.assigned_countries as string[] | null);
      
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
      
      console.warn('✅ [ADMIN DEBUG] Permissions set:', perms);
      console.warn('✅ [ADMIN DEBUG] Assigned countries:', adminData.assigned_countries);
    } catch (error) {
      console.error('❌ [ADMIN DEBUG] Error checking admin status:', error);
      setAdminRole(null);
      setAssignedCountries(null);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = adminRole === 'super_admin';
  const isRegionalAdmin = adminRole === 'regional_admin';
  const isAdmin = adminRole !== null;

  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    if (isSuperAdmin) return true; // Super admin a toutes les permissions
    return permissions[permission] || false;
  };

  // Check if admin can access a specific country
  const canAccessCountry = useCallback((countryCode: string): boolean => {
    if (isSuperAdmin) return true; // Super admin has access to all countries
    if (!assignedCountries || assignedCountries.length === 0) return true; // No restrictions
    return assignedCountries.includes(countryCode);
  }, [isSuperAdmin, assignedCountries]);

  // Get list of accessible countries for filtering
  const getAccessibleCountries = useCallback((): string[] | null => {
    if (isSuperAdmin) return null; // null means all countries
    return assignedCountries;
  }, [isSuperAdmin, assignedCountries]);

  return {
    adminRole,
    permissions,
    assignedCountries,
    loading,
    isAdmin,
    isSuperAdmin,
    isRegionalAdmin,
    hasPermission,
    canAccessCountry,
    getAccessibleCountries,
    refetch: checkAdminStatus,
  };
};
