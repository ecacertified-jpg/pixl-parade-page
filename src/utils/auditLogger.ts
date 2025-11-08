import { supabase } from '@/integrations/supabase/client';

const CRITICAL_ACTION_THRESHOLDS = {
  BULK_DELETE_COUNT: 3, // Alert if deleting 3+ items at once
  REPEATED_ACTIONS_COUNT: 5, // Alert if 5+ actions in short time
  TIME_WINDOW_MINUTES: 5, // Time window for repeated actions
};

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

    // Check for critical actions and notify super admins
    await checkCriticalAction(adminUser.id, actionType, description, metadata);

  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
};

const checkCriticalAction = async (
  adminUserId: string,
  actionType: string,
  description: string,
  metadata?: Record<string, any>
) => {
  try {
    // Get admin details
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id, role')
      .eq('id', adminUserId)
      .single();

    if (!adminUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', adminUser.user_id)
      .single();

    const adminName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin'
      : 'Admin';

    let isCritical = false;
    let criticalType: 'bulk_delete' | 'repeated_warnings' | 'mass_deletion' | null = null;
    let criticalDetails = '';

    // Check for bulk deletions
    if (actionType === 'bulk_action' && metadata?.action === 'reject') {
      const count = metadata?.count || 0;
      if (count >= CRITICAL_ACTION_THRESHOLDS.BULK_DELETE_COUNT) {
        isCritical = true;
        criticalType = 'bulk_delete';
        criticalDetails = `${adminName} (${adminUser.role}) a supprimé ${count} signalements en masse`;
      }
    }

    // Check for repeated moderation actions in short time
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - CRITICAL_ACTION_THRESHOLDS.TIME_WINDOW_MINUTES);

    const { data: recentActions } = await supabase
      .from('admin_audit_logs')
      .select('id')
      .eq('admin_user_id', adminUserId)
      .in('action_type', ['delete', 'hide'])
      .gte('created_at', timeWindow.toISOString());

    if (recentActions && recentActions.length >= CRITICAL_ACTION_THRESHOLDS.REPEATED_ACTIONS_COUNT) {
      isCritical = true;
      criticalType = 'repeated_warnings';
      criticalDetails = `${adminName} (${adminUser.role}) a effectué ${recentActions.length} suppressions/masquages en ${CRITICAL_ACTION_THRESHOLDS.TIME_WINDOW_MINUTES} minutes`;
    }

    // Send notification if critical
    if (isCritical && criticalType) {
      console.log('🚨 Critical moderation action detected, notifying super admins...');
      
      await supabase.functions.invoke('notify-critical-moderation', {
        body: {
          actionType: criticalType,
          adminName,
          adminRole: adminUser.role,
          details: criticalDetails,
          metadata: {
            ...metadata,
            originalDescription: description,
            timestamp: new Date().toISOString(),
          }
        }
      });
    }

  } catch (error) {
    console.error('Error checking critical action:', error);
  }
};
