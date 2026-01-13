import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
