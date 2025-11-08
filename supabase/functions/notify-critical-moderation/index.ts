import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CriticalModerationPayload {
  actionType: 'bulk_delete' | 'repeated_warnings' | 'mass_deletion';
  adminName: string;
  adminRole: string;
  details: string;
  metadata: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: CriticalModerationPayload = await req.json();
    console.log('🚨 Critical moderation action detected:', payload);

    // Get all super admins
    const { data: superAdmins, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('role', 'super_admin');

    if (adminError) {
      console.error('Error fetching super admins:', adminError);
      throw adminError;
    }

    if (!superAdmins || superAdmins.length === 0) {
      console.log('No super admins found to notify');
      return new Response(
        JSON.stringify({ message: 'No super admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const superAdminIds = superAdmins.map(admin => admin.user_id);

    // Get active push subscriptions for super admins
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', superAdminIds)
      .eq('active', true);

    if (subError) {
      console.error('Error fetching push subscriptions:', subError);
      throw subError;
    }

    let notificationsSent = 0;

    // Send push notifications
    if (subscriptions && subscriptions.length > 0) {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: superAdminIds,
          title: '🚨 Action critique de modération',
          message: payload.details,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            type: 'critical_moderation',
            actionType: payload.actionType,
            adminName: payload.adminName,
            adminRole: payload.adminRole,
            metadata: payload.metadata,
          }
        }
      });

      if (!pushError) {
        notificationsSent = subscriptions.length;
      }
    }

    // Create notifications in database for all super admins
    const notifications = superAdminIds.map(userId => ({
      user_id: userId,
      type: 'critical_moderation',
      title: '🚨 Action critique de modération',
      message: payload.details,
      data: {
        actionType: payload.actionType,
        adminName: payload.adminName,
        adminRole: payload.adminRole,
        metadata: payload.metadata,
      },
      read: false,
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    console.log(`✅ Notified ${superAdminIds.length} super admins (${notificationsSent} push notifications sent)`);

    return new Response(
      JSON.stringify({
        success: true,
        notifiedAdmins: superAdminIds.length,
        pushNotificationsSent: notificationsSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in notify-critical-moderation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
