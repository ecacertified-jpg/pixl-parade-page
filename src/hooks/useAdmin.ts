import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminPermissions {
  manage_users: boolean;
  manage_admins: boolean;
  manage_businesses: boolean;
  manage_content: boolean;
  manage_finances: boolean;
  view_analytics: boolean;
  manage_settings: boolean;
}

export type AdminRole = 'super_admin' | 'regional_admin' | 'moderator' | null;

export const useAdmin = () => {
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>({
    manage_users: false,
    manage_admins: false,
    manage_businesses: false,
    manage_content: false,
    manage_finances: false,
    view_analytics: false,
    manage_settings: false,
  });
  const [assignedCountries, setAssignedCountries] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('⏱️ [ADMIN] Safety timeout reached - forcing loading to stop');
        setLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else if (!authLoading) {
      setAdminRole(null);
      setAssignedCountries(null);
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active, assigned_countries')
        .eq('user_id', user?.id)
        .single();

      if (adminError) {
        if (adminError.code !== 'PGRST116') {
          console.error('[ADMIN] Error fetching admin data:', adminError);
        }
        setAdminRole(null);
        setAssignedCountries(null);
        setLoading(false);
        return;
      }

      if (!adminData || !adminData.is_active) {
        setAdminRole(null);
        setAssignedCountries(null);
        setLoading(false);
        return;
      }

      setAdminRole(adminData.role as AdminRole);
      setAssignedCountries(adminData.assigned_countries as string[] | null);
      
      // Super admins et regional admins ont automatiquement toutes les permissions
      if (adminData.role === 'super_admin' || adminData.role === 'regional_admin') {
        setPermissions({
          manage_users: true,
          manage_admins: true,
          manage_businesses: true,
          manage_content: true,
          manage_finances: true,
          view_analytics: true,
          manage_settings: true,
        });
      } else {
        const perms = adminData.permissions as any || {};
        setPermissions({
          manage_users: perms.manage_users ?? false,
          manage_admins: perms.manage_admins ?? false,
          manage_businesses: perms.manage_businesses ?? false,
          manage_content: perms.manage_content ?? false,
          manage_finances: perms.manage_finances ?? false,
          view_analytics: perms.view_analytics ?? false,
          manage_settings: perms.manage_settings ?? false,
        });
      }
    } catch (error) {
      console.error('[ADMIN] Error checking admin status:', error);
      setAdminRole(null);
      setAssignedCountries(null);
    } finally {
      setLoading(false);
      setHasChecked(true);
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
    hasChecked,
    isAdmin,
    isSuperAdmin,
    isRegionalAdmin,
    hasPermission,
    canAccessCountry,
    getAccessibleCountries,
    refetch: checkAdminStatus,
  };
};
