/**
 * Admin Country Validator - Server-side validation for admin country restrictions
 * This module provides utilities to validate admin access based on assigned_countries
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AdminUser {
  user_id: string;
  role: string;
  permissions: Record<string, boolean> | null;
  assigned_countries: string[] | null;
  is_active: boolean;
}

export interface AdminValidationResult {
  isValid: boolean;
  adminUser: AdminUser | null;
  error?: string;
  statusCode?: number;
}

export interface CountryAccessResult {
  canAccess: boolean;
  reason?: string;
}

/**
 * Validate that a user is an active admin with optional permission check
 */
export async function validateAdminAccess(
  supabaseAdmin: SupabaseClient,
  authUserId: string,
  requiredPermission?: string
): Promise<AdminValidationResult> {
  try {
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id, role, permissions, assigned_countries, is_active')
      .eq('user_id', authUserId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return {
        isValid: false,
        adminUser: null,
        error: 'Forbidden - Admin access required',
        statusCode: 403
      };
    }

    // Check specific permission if required
    if (requiredPermission) {
      const permissions = adminUser.permissions as Record<string, boolean> | null;
      const hasPermission = adminUser.role === 'super_admin' || 
        (permissions && permissions[requiredPermission] === true);
      
      if (!hasPermission) {
        return {
          isValid: false,
          adminUser: adminUser as AdminUser,
          error: `Forbidden - Missing permission: ${requiredPermission}`,
          statusCode: 403
        };
      }
    }

    return {
      isValid: true,
      adminUser: adminUser as AdminUser
    };
  } catch (error) {
    console.error('Admin validation error:', error);
    return {
      isValid: false,
      adminUser: null,
      error: 'Internal Server Error - Admin validation failed',
      statusCode: 500
    };
  }
}

/**
 * Check if an admin can access data for a specific country
 * Super admins and admins with null/empty assigned_countries can access all countries
 */
export function canAccessCountry(
  assignedCountries: string[] | null,
  role: string,
  targetCountryCode: string | null
): CountryAccessResult {
  // Super admins can access all countries
  if (role === 'super_admin') {
    return { canAccess: true };
  }

  // If target has no country code, allow access (legacy data)
  if (!targetCountryCode) {
    return { canAccess: true };
  }

  // If admin has no country restrictions (null or empty), allow all
  if (!assignedCountries || assignedCountries.length === 0) {
    return { canAccess: true };
  }

  // Check if target country is in admin's assigned countries
  const canAccess = assignedCountries.includes(targetCountryCode);
  
  if (!canAccess) {
    return {
      canAccess: false,
      reason: `Access denied for country: ${targetCountryCode}. You have access to: ${assignedCountries.join(', ')}`
    };
  }

  return { canAccess: true };
}

/**
 * Validate admin access including country restriction check
 * Returns a complete validation result with country access status
 */
export async function validateAdminCountryAccess(
  supabaseAdmin: SupabaseClient,
  authUserId: string,
  targetCountryCode: string | null,
  requiredPermission?: string
): Promise<AdminValidationResult> {
  // First validate admin access
  const adminResult = await validateAdminAccess(supabaseAdmin, authUserId, requiredPermission);
  
  if (!adminResult.isValid || !adminResult.adminUser) {
    return adminResult;
  }

  // Then check country access
  const countryResult = canAccessCountry(
    adminResult.adminUser.assigned_countries,
    adminResult.adminUser.role,
    targetCountryCode
  );

  if (!countryResult.canAccess) {
    console.warn(`Country access denied for admin ${authUserId}: ${countryResult.reason}`);
    return {
      isValid: false,
      adminUser: adminResult.adminUser,
      error: `Forbidden - ${countryResult.reason}`,
      statusCode: 403
    };
  }

  return adminResult;
}

/**
 * Get the country code for a user profile
 */
export async function getUserCountryCode(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('country_code')
    .eq('user_id', userId)
    .single();
  
  return profile?.country_code || null;
}

/**
 * Get the country code for a business
 */
export async function getBusinessCountryCode(
  supabaseAdmin: SupabaseClient,
  businessId: string
): Promise<string | null> {
  const { data: business } = await supabaseAdmin
    .from('business_accounts')
    .select('country_code')
    .eq('id', businessId)
    .single();
  
  return business?.country_code || null;
}

/**
 * Log unauthorized country access attempt to admin_audit_logs
 */
export async function logUnauthorizedCountryAccess(
  supabaseAdmin: SupabaseClient,
  adminUserId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  targetCountryCode: string,
  adminAssignedCountries: string[]
): Promise<void> {
  try {
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_user_id: adminUserId,
      action_type: 'unauthorized_country_access',
      target_type: targetType,
      target_id: targetId,
      description: `Attempted ${actionType} on ${targetType} from restricted country: ${targetCountryCode}`,
      metadata: {
        attempted_action: actionType,
        target_country: targetCountryCode,
        admin_assigned_countries: adminAssignedCountries,
        blocked: true
      }
    });
  } catch (error) {
    console.error('Failed to log unauthorized access attempt:', error);
  }
}
