import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MergeRequest {
  primary_user_id: string;
  secondary_user_id: string;
}

interface TransferLog {
  table: string;
  count: number;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin status with country restrictions
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, permissions, is_active, assigned_countries')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only super_admin can merge accounts
    if (adminUser.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Super admin privileges required for account merging' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Helper function for country access validation
    const canAccessCountry = (targetCountryCode: string | null): boolean => {
      // Super admins can access all countries (already verified above)
      if (adminUser.role === 'super_admin') return true;
      // If target has no country, allow access
      if (!targetCountryCode) return true;
      // If admin has no country restrictions, allow all
      const assignedCountries = adminUser.assigned_countries as string[] | null;
      if (!assignedCountries || assignedCountries.length === 0) return true;
      return assignedCountries.includes(targetCountryCode);
    };

    const { primary_user_id, secondary_user_id }: MergeRequest = await req.json();

    if (!primary_user_id || !secondary_user_id) {
      return new Response(
        JSON.stringify({ error: 'primary_user_id and secondary_user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (primary_user_id === secondary_user_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot merge an account with itself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify both users exist and get their country codes
    const { data: primaryProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, country_code')
      .eq('user_id', primary_user_id)
      .single();

    const { data: secondaryProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, country_code')
      .eq('user_id', secondary_user_id)
      .single();

    if (!primaryProfile || !secondaryProfile) {
      return new Response(
        JSON.stringify({ error: 'One or both user profiles not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // COUNTRY ACCESS VALIDATION - Admin must have access to both users' countries
    const primaryCountryAccess = canAccessCountry(primaryProfile.country_code);
    const secondaryCountryAccess = canAccessCountry(secondaryProfile.country_code);
    
    if (!primaryCountryAccess || !secondaryCountryAccess) {
      const blockedCountry = !primaryCountryAccess ? primaryProfile.country_code : secondaryProfile.country_code;
      const assignedCountries = adminUser.assigned_countries as string[] | null;
      
      console.error(`Admin ${user.id} attempted merge with user from restricted country: ${blockedCountry}`);
      
      // Log unauthorized attempt
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action_type: 'unauthorized_country_access',
        target_type: 'user',
        target_id: !primaryCountryAccess ? primary_user_id : secondary_user_id,
        description: `Attempted account merge involving user from restricted country: ${blockedCountry}`,
        metadata: {
          attempted_action: 'merge_accounts',
          primary_user_id,
          secondary_user_id,
          primary_country: primaryProfile.country_code,
          secondary_country: secondaryProfile.country_code,
          admin_assigned_countries: assignedCountries,
          blocked: true
        }
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Forbidden - Access denied for country: ${blockedCountry}` 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transferLogs: TransferLog[] = [];

    // Transfer contacts
    const { data: contactsData, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'contacts',
      count: contactsData?.length ?? 0,
      success: !contactsError,
      error: contactsError?.message
    });

    // Transfer collective_funds (as creator)
    const { data: fundsData, error: fundsError } = await supabaseAdmin
      .from('collective_funds')
      .update({ creator_id: primary_user_id })
      .eq('creator_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'collective_funds',
      count: fundsData?.length ?? 0,
      success: !fundsError,
      error: fundsError?.message
    });

    // Transfer fund_contributions
    const { data: contributionsData, error: contributionsError } = await supabaseAdmin
      .from('fund_contributions')
      .update({ contributor_id: primary_user_id })
      .eq('contributor_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'fund_contributions',
      count: contributionsData?.length ?? 0,
      success: !contributionsError,
      error: contributionsError?.message
    });

    // Transfer posts
    const { data: postsData, error: postsError } = await supabaseAdmin
      .from('posts')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'posts',
      count: postsData?.length ?? 0,
      success: !postsError,
      error: postsError?.message
    });

    // Transfer post_comments
    const { data: commentsData, error: commentsError } = await supabaseAdmin
      .from('post_comments')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'post_comments',
      count: commentsData?.length ?? 0,
      success: !commentsError,
      error: commentsError?.message
    });

    // Transfer post_reactions
    const { data: reactionsData, error: reactionsError } = await supabaseAdmin
      .from('post_reactions')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'post_reactions',
      count: reactionsData?.length ?? 0,
      success: !reactionsError,
      error: reactionsError?.message
    });

    // Transfer fund_comments
    const { data: fundCommentsData, error: fundCommentsError } = await supabaseAdmin
      .from('fund_comments')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'fund_comments',
      count: fundCommentsData?.length ?? 0,
      success: !fundCommentsError,
      error: fundCommentsError?.message
    });

    // Transfer notifications
    const { data: notificationsData, error: notificationsError } = await supabaseAdmin
      .from('notifications')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'notifications',
      count: notificationsData?.length ?? 0,
      success: !notificationsError,
      error: notificationsError?.message
    });

    // Transfer user_favorites
    const { data: favoritesData, error: favoritesError } = await supabaseAdmin
      .from('user_favorites')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'user_favorites',
      count: favoritesData?.length ?? 0,
      success: !favoritesError,
      error: favoritesError?.message
    });

    // Transfer user_badges
    const { data: badgesData, error: badgesError } = await supabaseAdmin
      .from('user_badges')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'user_badges',
      count: badgesData?.length ?? 0,
      success: !badgesError,
      error: badgesError?.message
    });

    // Transfer business_accounts
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('business_accounts')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'business_accounts',
      count: businessData?.length ?? 0,
      success: !businessError,
      error: businessError?.message
    });

    // Transfer business_orders (customer_id)
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('business_orders')
      .update({ customer_id: primary_user_id })
      .eq('customer_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'business_orders',
      count: ordersData?.length ?? 0,
      success: !ordersError,
      error: ordersError?.message
    });

    // Transfer reciprocity_scores
    const { data: reciprocityData, error: reciprocityError } = await supabaseAdmin
      .from('reciprocity_scores')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'reciprocity_scores',
      count: reciprocityData?.length ?? 0,
      success: !reciprocityError,
      error: reciprocityError?.message
    });

    // Transfer community_scores
    const { data: communityData, error: communityError } = await supabaseAdmin
      .from('community_scores')
      .update({ user_id: primary_user_id })
      .eq('user_id', secondary_user_id)
      .select();

    transferLogs.push({
      table: 'community_scores',
      count: communityData?.length ?? 0,
      success: !communityError,
      error: communityError?.message
    });

    // Mark secondary profile as merged
    const { error: updateSecondaryError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_suspended: true,
        bio: `[MERGED] Account merged into ${primary_user_id} on ${new Date().toISOString()}`
      })
      .eq('user_id', secondary_user_id);

    // Log the merge operation
    const { error: logError } = await supabaseAdmin
      .from('user_account_merges')
      .insert({
        primary_user_id,
        secondary_user_id,
        merged_by: user.id,
        data_transferred: transferLogs,
        primary_name: `${primaryProfile.first_name} ${primaryProfile.last_name}`,
        secondary_name: `${secondaryProfile.first_name} ${secondaryProfile.last_name}`
      });

    // Log admin action
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_user_id: user.id,
        action_type: 'merge_accounts',
        target_type: 'user',
        target_id: primary_user_id,
        description: `Merged account ${secondary_user_id} into ${primary_user_id}`,
        metadata: {
          secondary_user_id,
          primary_name: `${primaryProfile.first_name} ${primaryProfile.last_name}`,
          secondary_name: `${secondaryProfile.first_name} ${secondaryProfile.last_name}`,
          transfer_logs: transferLogs
        }
      });

    const totalTransferred = transferLogs.reduce((sum, log) => sum + (log.success ? log.count : 0), 0);
    const hasErrors = transferLogs.some(log => !log.success);

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message: hasErrors 
          ? 'Merge completed with some errors' 
          : 'Accounts merged successfully',
        primary_user: {
          id: primary_user_id,
          name: `${primaryProfile.first_name} ${primaryProfile.last_name}`
        },
        secondary_user: {
          id: secondary_user_id,
          name: `${secondaryProfile.first_name} ${secondaryProfile.last_name}`
        },
        total_items_transferred: totalTransferred,
        transfer_details: transferLogs
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Merge error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
