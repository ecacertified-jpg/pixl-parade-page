import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to send email notification to Super Admins when a client is deleted
async function sendDeletionNotificationEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  deletedUserName: string,
  deletedUserEmail: string | null,
  deletedUserId: string,
  adminName: string,
  adminEmail: string,
  reason: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.log('⚠️ RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  try {
    // Fetch all active super admins
    const { data: superAdmins } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if (!superAdmins || superAdmins.length === 0) {
      console.log('No super admins to notify');
      return;
    }

    // Get emails of super admins via auth.admin
    const superAdminEmails: string[] = [];
    for (const admin of superAdmins) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
      if (authUser?.user?.email) {
        superAdminEmails.push(authUser.user.email);
      }
    }

    if (superAdminEmails.length === 0) {
      console.log('No super admin emails found');
      return;
    }

    const resend = new Resend(resendApiKey);
    const deletionDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #7A5DC7, #C084FC); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-box { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
          .alert-box h3 { color: #DC2626; margin: 0 0 10px 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table th { text-align: left; padding: 12px; background: #F3F4F6; color: #374151; font-weight: 600; }
          .info-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; color: #4B5563; }
          .reason-box { background: #F3F4F6; padding: 15px; border-radius: 8px; color: #374151; }
          .footer { background: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
          .note { margin-top: 20px; color: #6B7280; }
          .note a { color: #7A5DC7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🗑️ Compte Client Supprimé</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h3>⚠️ Action Critique</h3>
              <p>Un compte client a été supprimé de la plateforme.</p>
            </div>
            
            <h2>Détails de l'action</h2>
            <table class="info-table">
              <tr>
                <th>Client supprimé</th>
                <td>${deletedUserName}</td>
              </tr>
              <tr>
                <th>Email du client</th>
                <td>${deletedUserEmail || 'Non disponible'}</td>
              </tr>
              <tr>
                <th>ID utilisateur</th>
                <td style="font-family: monospace; font-size: 12px;">${deletedUserId}</td>
              </tr>
              <tr>
                <th>Date de suppression</th>
                <td>${deletionDate}</td>
              </tr>
            </table>

            <h2>Administrateur responsable</h2>
            <table class="info-table">
              <tr>
                <th>Nom</th>
                <td>${adminName}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td>${adminEmail}</td>
              </tr>
            </table>

            <h2>Raison de la suppression</h2>
            <div class="reason-box">
              ${reason || 'Aucune raison spécifiée'}
            </div>

            <p class="note">
              <strong>Note :</strong> Le compte a été soft-deleted et peut être restauré depuis la 
              <a href="https://joiedevivre-africa.com/admin/deleted-clients">Corbeille Clients</a> 
              pendant 30 jours.
            </p>
          </div>
          <div class="footer">
            <p>JOIE DE VIVRE - Panneau d'Administration</p>
            <p>Cet email a été envoyé automatiquement. Ne pas répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'JOIE DE VIVRE <onboarding@resend.dev>',
      to: superAdminEmails,
      subject: `🗑️ Compte supprimé : ${deletedUserName}`,
      html: emailHtml
    });
    
    console.log(`📧 Deletion notification sent to ${superAdminEmails.length} super admin(s)`);
  } catch (emailError) {
    console.error('Failed to send deletion notification email:', emailError);
    // Don't throw - email failure should not block the deletion
  }
}

// Function to send push notification to Super Admins when a client is deleted
async function sendDeletionPushNotification(
  supabaseAdmin: ReturnType<typeof createClient>,
  deletedUserName: string,
  deletedUserId: string,
  adminName: string,
  reason: string
) {
  try {
    // Fetch all active super admins
    const { data: superAdmins } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if (!superAdmins || superAdmins.length === 0) {
      console.log('No super admins to send push notification');
      return;
    }

    const superAdminIds = superAdmins.map(admin => admin.user_id);

    // Check if any super admin has active push subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id')
      .in('user_id', superAdminIds)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active push subscriptions for super admins');
      return;
    }

    // Truncate reason for push message
    const truncatedReason = reason.length > 50 ? reason.substring(0, 47) + '...' : reason;

    // Call send-push-notification function
    const { error: pushError } = await supabaseAdmin.functions.invoke('send-push-notification', {
      body: {
        user_ids: superAdminIds,
        title: '🗑️ Compte Client Supprimé',
        message: `${deletedUserName} a été supprimé par ${adminName}. Raison: ${truncatedReason}`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `client-deletion-${deletedUserId}`,
        type: 'default',
        isUrgent: false,
        requireInteraction: true,
        data: {
          type: 'client_deletion',
          deletedUserId: deletedUserId,
          deletedUserName: deletedUserName,
          adminName: adminName,
          reason: reason,
          url: '/admin/deleted-clients'
        }
      }
    });

    if (pushError) {
      console.error('Failed to send push notification:', pushError);
    } else {
      console.log(`📱 Deletion push notification sent to ${superAdminIds.length} super admin(s)`);
    }
  } catch (pushError) {
    console.error('Error sending deletion push notification:', pushError);
    // Don't throw - push failure should not block the deletion
  }
}

interface ManageUserRequest {
  user_id: string
  action: 'suspend' | 'unsuspend' | 'delete' | 'update_role'
  reason?: string
  suspension_end?: string
  new_role?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('Failed to get user:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${user.id} attempting user management action`)

    // SERVER-SIDE ADMIN VALIDATION
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, user_id, role, is_active, permissions')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      console.error(`Admin check failed for user ${user.id}:`, adminError)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check permission for user management
    const permissions = adminUser.permissions as Record<string, boolean> | null
    const canManageUsers = adminUser.role === 'super_admin' || 
      (permissions && permissions.can_manage_users === true)

    if (!canManageUsers) {
      console.error(`User ${user.id} lacks user management permission`)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: ManageUserRequest = await req.json()
    
    if (!body.user_id || !body.action) {
      return new Response(
        JSON.stringify({ error: 'Bad Request - user_id and action required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validActions = ['suspend', 'unsuspend', 'delete', 'update_role']
    if (!validActions.includes(body.action)) {
      return new Response(
        JSON.stringify({ error: `Bad Request - action must be one of: ${validActions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-modification
    if (body.user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot modify your own account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if target is also an admin (only super_admin can manage other admins)
    const { data: targetAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', body.user_id)
      .eq('is_active', true)
      .single()

    if (targetAdmin && adminUser.role !== 'super_admin') {
      console.error(`Non-super-admin ${user.id} attempted to modify admin ${body.user_id}`)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Only super admins can manage other admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get target user profile
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, email')
      .eq('user_id', body.user_id)
      .single()

    if (profileError) {
      console.error('Target user not found:', profileError)
      return new Response(
        JSON.stringify({ error: 'Not Found - User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build full name from first_name and last_name
    const targetFullName = [targetProfile.first_name, targetProfile.last_name]
      .filter(Boolean)
      .join(' ') || 'Unknown User'

    console.log(`Admin ${user.id} performing ${body.action} on user ${body.user_id}`)

    let actionDescription = ''
    let metadata: Record<string, unknown> = {
      target_user_id: body.user_id,
      target_user_name: targetFullName,
      reason: body.reason || null
    }

    // Perform the action
    switch (body.action) {
      case 'suspend': {
        if (!body.reason) {
          return new Response(
            JSON.stringify({ error: 'Bad Request - reason required for suspension' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update profile with suspension info
        const { error: suspendError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_suspended: true,
            suspension_reason: body.reason,
            suspension_date: new Date().toISOString(),
            suspension_end: body.suspension_end || null
          })
          .eq('user_id', body.user_id)

        if (suspendError) {
          console.error('Failed to suspend user:', suspendError)
          return new Response(
            JSON.stringify({ error: 'Internal Server Error - Failed to suspend user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        actionDescription = `Suspended user: ${targetFullName}`
        metadata.suspension_end = body.suspension_end || 'indefinite'
        break
      }

      case 'unsuspend': {
        const { error: unsuspendError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_suspended: false,
            suspension_reason: null,
            suspension_date: null,
            suspension_end: null
          })
          .eq('user_id', body.user_id)

        if (unsuspendError) {
          console.error('Failed to unsuspend user:', unsuspendError)
          return new Response(
            JSON.stringify({ error: 'Internal Server Error - Failed to unsuspend user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        actionDescription = `Unsuspended user: ${targetFullName}`
        break
      }

      case 'delete': {
        // Only super_admin can delete users
        if (adminUser.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Forbidden - Only super admins can delete users' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Soft delete - mark as deleted but keep data
        const { error: deleteError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            deletion_reason: body.reason || 'Admin deletion'
          })
          .eq('user_id', body.user_id)

        if (deleteError) {
          console.error('Failed to delete user:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Internal Server Error - Failed to delete user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        actionDescription = `Deleted user: ${targetFullName}`

        // Send email notification to all Super Admins
        // Get acting admin's profile info
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();
        
        const { data: adminAuthUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
        
        const adminName = [adminProfile?.first_name, adminProfile?.last_name]
          .filter(Boolean).join(' ') || 'Admin';
        const adminEmail = adminAuthUser?.user?.email || 'Email non disponible';
        
        // Get deleted user's email
        const { data: deletedAuthUser } = await supabaseAdmin.auth.admin.getUserById(body.user_id);
        const deletedUserEmail = deletedAuthUser?.user?.email || null;
        
        // Send notification email (async, non-blocking)
        await sendDeletionNotificationEmail(
          supabaseAdmin,
          targetFullName,
          deletedUserEmail,
          body.user_id,
          adminName,
          adminEmail,
          body.reason || 'Aucune raison spécifiée'
        );

        // Send push notification to all Super Admins (async, non-blocking)
        await sendDeletionPushNotification(
          supabaseAdmin,
          targetFullName,
          body.user_id,
          adminName,
          body.reason || 'Aucune raison spécifiée'
        );

        break
      }

      case 'update_role': {
        if (!body.new_role) {
          return new Response(
            JSON.stringify({ error: 'Bad Request - new_role required for update_role action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Only super_admin can change roles
        if (adminUser.role !== 'super_admin') {
          return new Response(
            JSON.stringify({ error: 'Forbidden - Only super admins can update roles' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const validRoles = ['user', 'moderator', 'admin', 'super_admin']
        if (!validRoles.includes(body.new_role)) {
          return new Response(
            JSON.stringify({ error: `Bad Request - new_role must be one of: ${validRoles.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update admin_users table
        if (body.new_role === 'user') {
          // Remove from admin_users
          await supabaseAdmin
            .from('admin_users')
            .update({ is_active: false })
            .eq('user_id', body.user_id)
        } else {
          // Upsert to admin_users
          const { error: roleError } = await supabaseAdmin
            .from('admin_users')
            .upsert({
              user_id: body.user_id,
              role: body.new_role,
              is_active: true,
              assigned_by: user.id,
              assigned_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          if (roleError) {
            console.error('Failed to update role:', roleError)
            return new Response(
              JSON.stringify({ error: 'Internal Server Error - Failed to update role' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        actionDescription = `Updated role for ${targetFullName} to ${body.new_role}`
        metadata.new_role = body.new_role
        break
      }
    }

    // Log the action to audit logs
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_user_id: adminUser.user_id,
        action_type: body.action,
        target_type: 'user',
        target_id: body.user_id,
        description: actionDescription,
        metadata
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    console.log(`Successfully performed ${body.action} on user ${body.user_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: actionDescription,
        user_id: body.user_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
