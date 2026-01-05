import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to send web push notifications
async function sendWebPush(subscription: any, payload: any): Promise<boolean> {
  try {
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        console.log('Push subscription expired:', subscription.endpoint);
      } else {
        console.error('Push failed:', response.status, await response.text());
      }
      return false;
    }

    console.log('✅ Push sent successfully to:', subscription.endpoint.substring(0, 50));
    return true;
  } catch (error) {
    console.error('Error in sendWebPush:', error);
    return false;
  }
}

// Helper function to create in-app notification
async function createInAppNotification(
  supabase: any,
  userId: string,
  businessName: string
) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'business_approved',
        title: '🎉 Compte business approuvé !',
        message: `Félicitations ! Votre compte "${businessName}" a été approuvé. Vous pouvez maintenant gérer vos produits et recevoir des commandes.`,
        data: {
          action_url: '/business-account',
        },
        is_read: false,
      });

    if (error) {
      console.error('Error creating in-app notification:', error);
    } else {
      console.log('✅ In-app notification created for business approval');
    }
  } catch (error) {
    console.error('Error in createInAppNotification:', error);
  }
}

interface ApproveBusinessRequest {
  business_id: string
  action: 'approve' | 'reject'
  rejection_reason?: string
  corrections_message?: string
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

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Client with user token for auth verification
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Service role client for privileged operations
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

    console.log(`User ${user.id} attempting admin action`)

    // SERVER-SIDE ADMIN VALIDATION - Critical security check
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

    // Check specific permission for business management
    const permissions = adminUser.permissions as Record<string, boolean> | null
    const canManageBusinesses = adminUser.role === 'super_admin' || 
      (permissions && permissions.can_manage_businesses === true)

    if (!canManageBusinesses) {
      console.error(`User ${user.id} lacks business management permission`)
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse and validate request body
    const body: ApproveBusinessRequest = await req.json()
    
    if (!body.business_id || !body.action) {
      return new Response(
        JSON.stringify({ error: 'Bad Request - business_id and action required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['approve', 'reject'].includes(body.action)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request - action must be approve or reject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.action === 'reject' && !body.rejection_reason) {
      return new Response(
        JSON.stringify({ error: 'Bad Request - rejection_reason required for reject action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Admin ${user.id} performing ${body.action} on business ${body.business_id}`)

    // Get business details before update
    const { data: business, error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .select('id, business_name, email, user_id, status')
      .eq('id', body.business_id)
      .single()

    if (businessError || !business) {
      console.error('Business not found:', businessError)
      return new Response(
        JSON.stringify({ error: 'Not Found - Business account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Perform the action
    let updateData: Record<string, unknown>
    
    if (body.action === 'approve') {
      updateData = {
        status: 'approved',
        is_active: true,
        is_verified: true,
        rejection_reason: null,
        rejection_date: null,
        corrections_message: null
      }
    } else {
      updateData = {
        status: 'rejected',
        is_active: false,
        rejection_reason: body.rejection_reason,
        rejection_date: new Date().toISOString(),
        corrections_message: body.corrections_message || null
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('business_accounts')
      .update(updateData)
      .eq('id', body.business_id)

    if (updateError) {
      console.error('Failed to update business:', updateError)
      return new Response(
        JSON.stringify({ error: 'Internal Server Error - Failed to update business' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the action to audit logs
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_user_id: adminUser.user_id,
        action_type: body.action === 'approve' ? 'approve' : 'reject',
        target_type: 'business',
        target_id: body.business_id,
        description: `${body.action === 'approve' ? 'Approved' : 'Rejected'} business: ${business.business_name}`,
        metadata: {
          business_name: business.business_name,
          business_email: business.email,
          previous_status: business.status,
          new_status: body.action === 'approve' ? 'approved' : 'rejected',
          rejection_reason: body.rejection_reason || null
        }
      })

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the request, just log the error
    }

    // Log to business registration logs
    await supabaseAdmin
      .from('business_registration_logs')
      .insert({
        business_account_id: body.business_id,
        business_name: business.business_name,
        business_email: business.email,
        action: body.action === 'approve' ? 'approved' : 'rejected',
        admin_user_id: adminUser.user_id,
        rejection_reason: body.rejection_reason || null
      })

    // Send notification email
    if (business.email) {
      const emailFunction = body.action === 'approve' 
        ? 'send-business-approval-email' 
        : 'send-business-rejection-email'
      
      try {
        await supabaseAdmin.functions.invoke(emailFunction, {
          body: {
            business_id: body.business_id,
            business_name: business.business_name,
            email: business.email,
            rejection_reason: body.rejection_reason
          }
        })
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError)
      }
    }

    // Send push notification to business owner if approved
    if (body.action === 'approve') {
      try {
        // Get active push subscriptions for the business owner
        const { data: subscriptions } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', business.user_id)
          .eq('is_active', true);

        if (subscriptions && subscriptions.length > 0) {
          const pushPayload = {
            title: '🎉 Félicitations !',
            body: `Votre compte "${business.business_name}" a été approuvé. Accédez à votre espace business.`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `business-approved-${business.id}`,
            data: {
              type: 'business_approved',
              business_id: business.id,
              url: '/business-account',
            },
            requireInteraction: true,
          };

          let pushSent = 0;
          for (const subscription of subscriptions) {
            const success = await sendWebPush(subscription, pushPayload);
            if (success) pushSent++;
          }
          console.log(`📲 Push notifications sent to ${pushSent}/${subscriptions.length} devices`);
        }

        // Create in-app notification
        await createInAppNotification(supabaseAdmin, business.user_id, business.business_name);
      } catch (notifError) {
        console.error('Failed to send push/in-app notification:', notifError);
        // Don't fail the main request
      }
    }

    console.log(`Successfully ${body.action}d business ${body.business_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Business ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`,
        business_id: body.business_id
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
