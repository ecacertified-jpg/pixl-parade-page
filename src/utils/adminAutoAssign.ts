import { supabase } from '@/integrations/supabase/client';

/**
 * Attempts to auto-assign the current user to an admin via their share code.
 * Reads the admin_ref from URL params or sessionStorage, calls the edge function,
 * and cleans up storage.
 */
export const processAdminAutoAssign = async (
  userId: string,
  type: 'user' | 'business' = 'user'
) => {
  try {
    // Check URL params first, then sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const adminRef = urlParams.get('admin_ref') || sessionStorage.getItem('jdv_admin_ref');

    if (!adminRef) return;

    console.log(`🔗 [Admin Auto-Assign] Processing admin_ref=${adminRef} for ${type} ${userId}`);

    const { data, error } = await supabase.functions.invoke('admin-auto-assign', {
      body: { admin_ref: adminRef, user_id: userId, type },
    });

    if (error) {
      console.error('❌ [Admin Auto-Assign] Error:', error);
    } else {
      console.log('✅ [Admin Auto-Assign] Result:', data);
    }

    // Clean up
    sessionStorage.removeItem('jdv_admin_ref');
  } catch (e) {
    console.error('💥 [Admin Auto-Assign] Unexpected error:', e);
  }
};
