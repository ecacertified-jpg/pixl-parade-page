import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin_ref, user_id, type } = await req.json();

    if (!admin_ref || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing admin_ref or user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Find the admin by share code
    const { data: shareCode, error: codeError } = await supabaseAdmin
      .from('admin_share_codes')
      .select('id, admin_user_id, code')
      .eq('code', admin_ref)
      .eq('is_active', true)
      .single();

    if (codeError || !shareCode) {
      console.log('Share code not found or inactive:', admin_ref);
      return new Response(JSON.stringify({ success: false, reason: 'invalid_code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get the admin's user_id for assigned_by
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, user_id')
      .eq('id', shareCode.admin_user_id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return new Response(JSON.stringify({ success: false, reason: 'admin_inactive' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Don't assign admin to themselves
    if (adminUser.user_id === user_id) {
      return new Response(JSON.stringify({ success: false, reason: 'self_assignment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const assignmentType = type || 'user';

    if (assignmentType === 'business') {
      // Find the business account for this user
      const { data: business } = await supabaseAdmin
        .from('business_accounts')
        .select('id')
        .eq('user_id', user_id)
        .limit(1)
        .maybeSingle();

      if (!business) {
        return new Response(JSON.stringify({ success: false, reason: 'no_business_account' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check exclusivity - business not already assigned
      const { data: existing } = await supabaseAdmin
        .from('admin_business_assignments')
        .select('id')
        .eq('business_account_id', business.id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: false, reason: 'already_assigned' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create assignment
      await supabaseAdmin.from('admin_business_assignments').insert({
        admin_user_id: adminUser.id,
        business_account_id: business.id,
        assigned_by: adminUser.user_id,
        assigned_via: 'share_link',
      });
    } else {
      // Check exclusivity - user not already assigned
      const { data: existing } = await supabaseAdmin
        .from('admin_user_assignments')
        .select('id')
        .eq('user_id', user_id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: false, reason: 'already_assigned' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create assignment
      await supabaseAdmin.from('admin_user_assignments').insert({
        admin_user_id: adminUser.id,
        user_id: user_id,
        assigned_by: adminUser.user_id,
        assigned_via: 'share_link',
      });
    }

    // 4. Increment stats
    await supabaseAdmin.rpc('increment_share_code_stat', { p_code: admin_ref, p_field: 'signups_count' });
    await supabaseAdmin.rpc('increment_share_code_stat', { p_code: admin_ref, p_field: 'assignments_count' });

    // 5. Create notification for admin
    await supabaseAdmin.from('admin_notifications').insert({
      admin_user_id: adminUser.user_id,
      title: 'Nouvelle affectation via lien de partage',
      message: `Un ${assignmentType === 'business' ? 'compte entreprise' : 'utilisateur'} a été automatiquement affecté via votre lien de partage (${admin_ref}).`,
      type: 'share_assignment',
      severity: 'info',
      action_url: '/admin/my-assignments',
    });

    console.log(`✅ Auto-assigned ${assignmentType} ${user_id} to admin ${adminUser.id} via code ${admin_ref}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-auto-assign:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
