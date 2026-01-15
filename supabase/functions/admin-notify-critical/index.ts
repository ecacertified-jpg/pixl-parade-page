import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types for notification request
type NotificationType = 
  | 'business_approval' 
  | 'business_rejection' 
  | 'business_verification' 
  | 'user_suspension' 
  | 'refund_approved' 
  | 'refund_rejected' 
  | 'client_deletion'
  | 'struggling_country'
  | 'struggling_country_recovery'
  | 'objective_critical';

interface CriticalNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  adminName: string;
  entityId: string;
  entityType: 'business' | 'user' | 'order' | 'country' | 'objective';
  actionUrl: string;
  metadata?: Record<string, any>;
}

interface AdminNotificationPreferences {
  admin_user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  client_deletion_alerts: boolean;
  new_client_alerts: boolean;
  new_business_alerts: boolean;
  new_order_alerts: boolean;
  refund_request_alerts: boolean;
  critical_moderation_alerts: boolean;
  performance_alerts: boolean;
  growth_alerts: boolean;
  struggling_country_alerts: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

// Map notification type to preference field
function getPreferenceField(type: NotificationType): keyof AdminNotificationPreferences {
  switch (type) {
    case 'business_approval':
    case 'business_rejection':
    case 'business_verification':
      return 'new_business_alerts';
    case 'user_suspension':
    case 'client_deletion':
      return 'client_deletion_alerts';
    case 'refund_approved':
    case 'refund_rejected':
      return 'refund_request_alerts';
    case 'struggling_country':
    case 'struggling_country_recovery':
      return 'struggling_country_alerts';
    case 'objective_critical':
      return 'performance_alerts';
    default:
      return 'critical_moderation_alerts';
  }
}

// Check if current time is within quiet hours
function isInQuietHours(prefs: AdminNotificationPreferences): boolean {
  if (!prefs.quiet_hours_enabled || !prefs.quiet_hours_start || !prefs.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
  const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  if (startTime <= endTime) {
    // Same day (ex: 09:00 - 18:00)
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Overnight (ex: 22:00 - 08:00)
    return currentTime >= startTime || currentTime < endTime;
  }
}

// Get severity and colors based on notification type
function getNotificationStyle(type: NotificationType): { emoji: string; color: string; severity: string } {
  switch (type) {
    case 'business_approval':
    case 'business_verification':
      return { emoji: '✅', color: '#22C55E', severity: 'info' };
    case 'business_rejection':
      return { emoji: '❌', color: '#EF4444', severity: 'warning' };
    case 'user_suspension':
      return { emoji: '⚠️', color: '#F59E0B', severity: 'warning' };
    case 'refund_approved':
      return { emoji: '💰', color: '#22C55E', severity: 'info' };
    case 'refund_rejected':
      return { emoji: '❌', color: '#EF4444', severity: 'warning' };
    case 'client_deletion':
      return { emoji: '🗑️', color: '#EF4444', severity: 'critical' };
    case 'struggling_country':
      return { emoji: '🚨', color: '#EF4444', severity: 'critical' };
    case 'struggling_country_recovery':
      return { emoji: '🎉', color: '#22C55E', severity: 'info' };
    case 'objective_critical':
      return { emoji: '⚠️', color: '#F59E0B', severity: 'warning' };
    default:
      return { emoji: '🔔', color: '#7A5DC7', severity: 'info' };
  }
}

// Generate email HTML
function generateEmailHtml(
  notification: CriticalNotificationRequest,
  style: { emoji: string; color: string; severity: string }
): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${style.color}, ${style.color}CC); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .info-box { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6B7280; font-weight: 500; }
        .info-value { color: #111827; font-weight: 600; }
        .action-btn { display: inline-block; background: ${style.color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
        .footer { background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${style.emoji} ${notification.title}</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${notification.message}</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Administrateur</span>
              <span class="info-value">${notification.adminName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date</span>
              <span class="info-value">${date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Type</span>
              <span class="info-value">${notification.entityType}</span>
            </div>
            ${notification.metadata?.reason ? `
            <div class="info-row">
              <span class="info-label">Raison</span>
              <span class="info-value">${notification.metadata.reason}</span>
            </div>
            ` : ''}
            ${notification.metadata?.amount ? `
            <div class="info-row">
              <span class="info-label">Montant</span>
              <span class="info-value">${notification.metadata.amount} XOF</span>
            </div>
            ` : ''}
          </div>

          <a href="https://joiedevivre-africa.com${notification.actionUrl}" class="action-btn">
            Voir les détails
          </a>
        </div>
        <div class="footer">
          <p>JOIE DE VIVRE - Panneau d'Administration</p>
          <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const notification: CriticalNotificationRequest = await req.json();

    if (!notification.type || !notification.title || !notification.message) {
      return new Response(
        JSON.stringify({ error: 'Bad Request - type, title, and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📣 Processing critical notification: ${notification.type}`);

    // Fetch all active super admins
    const { data: superAdmins, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if (adminError || !superAdmins || superAdmins.length === 0) {
      console.log('No super admins found to notify');
      return new Response(
        JSON.stringify({ success: true, sent: { email: 0, push: 0, inApp: 0 }, message: 'No super admins to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const superAdminIds = superAdmins.map(a => a.user_id);
    console.log(`Found ${superAdminIds.length} super admins`);

    // Fetch preferences for all super admins
    const { data: allPreferences } = await supabaseAdmin
      .from('admin_notification_preferences')
      .select('*')
      .in('admin_user_id', superAdminIds);

    // Create a map of preferences (with defaults for those without prefs)
    const prefsMap = new Map<string, AdminNotificationPreferences>();
    const defaultPrefs: Omit<AdminNotificationPreferences, 'admin_user_id'> = {
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      client_deletion_alerts: true,
      new_client_alerts: true,
      new_business_alerts: true,
      new_order_alerts: true,
      refund_request_alerts: true,
      critical_moderation_alerts: true,
      performance_alerts: true,
      growth_alerts: true,
      struggling_country_alerts: true,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };

    for (const adminId of superAdminIds) {
      const existingPrefs = allPreferences?.find(p => p.admin_user_id === adminId);
      if (existingPrefs) {
        prefsMap.set(adminId, existingPrefs as AdminNotificationPreferences);
      } else {
        prefsMap.set(adminId, { ...defaultPrefs, admin_user_id: adminId });
      }
    }

    const preferenceField = getPreferenceField(notification.type);
    const style = getNotificationStyle(notification.type);

    // Filter admins based on preferences
    const emailRecipients: string[] = [];
    const pushRecipients: string[] = [];
    const inAppRecipients: string[] = [];

    for (const [adminId, prefs] of prefsMap.entries()) {
      // Check if this type of alert is enabled
      if (!prefs[preferenceField]) {
        console.log(`Admin ${adminId} has ${preferenceField} disabled`);
        continue;
      }

      // Check quiet hours (only for non-critical)
      if (style.severity !== 'critical' && isInQuietHours(prefs)) {
        console.log(`Admin ${adminId} is in quiet hours`);
        continue;
      }

      if (prefs.email_enabled) emailRecipients.push(adminId);
      if (prefs.push_enabled) pushRecipients.push(adminId);
      if (prefs.in_app_enabled) inAppRecipients.push(adminId);
    }

    console.log(`Recipients - Email: ${emailRecipients.length}, Push: ${pushRecipients.length}, In-App: ${inAppRecipients.length}`);

    const results = { email: 0, push: 0, inApp: 0 };

    // Send emails
    if (resendApiKey && emailRecipients.length > 0) {
      try {
        const emailAddresses: string[] = [];
        for (const adminId of emailRecipients) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(adminId);
          if (authUser?.user?.email) {
            emailAddresses.push(authUser.user.email);
          }
        }

        if (emailAddresses.length > 0) {
          const resend = new Resend(resendApiKey);
          const emailHtml = generateEmailHtml(notification, style);

          await resend.emails.send({
            from: 'JOIE DE VIVRE <onboarding@resend.dev>',
            to: emailAddresses,
            subject: `${style.emoji} ${notification.title}`,
            html: emailHtml
          });

          results.email = emailAddresses.length;
          console.log(`📧 Sent email to ${results.email} admin(s)`);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    // Send push notifications
    if (pushRecipients.length > 0) {
      try {
        const { error: pushError } = await supabaseAdmin.functions.invoke('send-push-notification', {
          body: {
            user_ids: pushRecipients,
            title: `${style.emoji} ${notification.title}`,
            message: notification.message,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `admin-${notification.type}-${notification.entityId}`,
            type: 'default',
            isUrgent: style.severity === 'critical',
            requireInteraction: style.severity === 'critical',
            data: {
              type: notification.type,
              entityId: notification.entityId,
              entityType: notification.entityType,
              url: notification.actionUrl,
              ...notification.metadata
            }
          }
        });

        if (!pushError) {
          results.push = pushRecipients.length;
          console.log(`📱 Sent push to ${results.push} admin(s)`);
        } else {
          console.error('Push notification failed:', pushError);
        }
      } catch (pushError) {
        console.error('Push sending failed:', pushError);
      }
    }

    // Create in-app notifications
    if (inAppRecipients.length > 0) {
      try {
        const notifications = inAppRecipients.map(adminId => ({
          admin_user_id: adminId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          entity_type: notification.entityType,
          entity_id: notification.entityId,
          action_url: notification.actionUrl,
          severity: style.severity,
          metadata: notification.metadata || {},
          is_read: false,
          is_dismissed: false
        }));

        const { error: inAppError } = await supabaseAdmin
          .from('admin_notifications')
          .insert(notifications);

        if (!inAppError) {
          results.inApp = inAppRecipients.length;
          console.log(`🔔 Created ${results.inApp} in-app notification(s)`);
        } else {
          console.error('In-app notification failed:', inAppError);
        }
      } catch (inAppError) {
        console.error('In-app creation failed:', inAppError);
      }
    }

    console.log(`✅ Notification complete - Email: ${results.email}, Push: ${results.push}, In-App: ${results.inApp}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results,
        type: notification.type
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
