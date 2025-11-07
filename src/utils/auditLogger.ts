import { supabase } from '@/integrations/supabase/client';

export const logModerationAction = async (
  actionType: 'approve' | 'hide' | 'delete' | 'update' | 'bulk_action',
  targetType: 'post' | 'comment' | 'report',
  targetId: string | null,
  description: string,
  metadata?: Record<string, any>
) => {
  try {
    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get admin_user_id
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!adminUser) return;

    // Get client info
    const userAgent = navigator.userAgent;

    // Insert audit log
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_user_id: adminUser.id,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        description,
        metadata: metadata || {},
        user_agent: userAgent,
      });
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
};
