import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`🔗 Link request for user ${userId}, email: ${userEmail?.substring(0, 5)}...`);

    if (!userEmail) {
      return new Response(
        JSON.stringify({ linked: false, error: 'User has no email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // First check if user already has a linked business account
    const { data: existingByUserId, error: existingError } = await supabaseAdmin
      .from('business_accounts')
      .select('id, status, is_active, user_id, email, business_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) {
      console.error('Error checking existing accounts:', existingError);
    }

    if (existingByUserId && existingByUserId.length > 0) {
      const account = existingByUserId[0];
      console.log(`✅ User already has linked account: ${account.id}, status: ${account.status}`);
      return new Response(
        JSON.stringify({ 
          linked: true, 
          already_linked: true,
          business_account_id: account.id, 
          status: account.status, 
          is_active: account.is_active,
          business_name: account.business_name
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for business accounts by email (case insensitive)
    const { data: accountsByEmail, error: emailSearchError } = await supabaseAdmin
      .from('business_accounts')
      .select('id, status, is_active, user_id, email, business_name')
      .ilike('email', userEmail)
      .order('created_at', { ascending: false });

    if (emailSearchError) {
      console.error('Error searching by email:', emailSearchError);
      return new Response(
        JSON.stringify({ linked: false, error: 'Database error', details: emailSearchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!accountsByEmail || accountsByEmail.length === 0) {
      console.log(`❌ No business account found for email: ${userEmail?.substring(0, 5)}...`);
      return new Response(
        JSON.stringify({ linked: false, no_account: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Choose the best account to link (priority: approved/active > pending/resubmitted > most recent)
    const priorityOrder = ['approved', 'active', 'pending', 'resubmitted', 'rejected'];
    accountsByEmail.sort((a, b) => {
      const priorityA = priorityOrder.indexOf(a.status || 'rejected');
      const priorityB = priorityOrder.indexOf(b.status || 'rejected');
      if (priorityA !== priorityB) return priorityA - priorityB;
      return 0; // Already ordered by created_at desc
    });

    const targetAccount = accountsByEmail[0];
    const oldUserId = targetAccount.user_id;

    console.log(`🔄 Found account ${targetAccount.id} (${targetAccount.business_name}) with user_id ${oldUserId}, linking to ${userId}`);

    // Update the business account with the new user_id
    const { error: updateError } = await supabaseAdmin
      .from('business_accounts')
      .update({ user_id: userId })
      .eq('id', targetAccount.id);

    if (updateError) {
      console.error('Error updating business account:', updateError);
      return new Response(
        JSON.stringify({ linked: false, error: 'Failed to update business account', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Successfully linked business account ${targetAccount.id} to user ${userId}`);

    // Update related tables (products, business_categories) that reference the old user_id
    // Update products.business_owner_id
    const { error: productsError } = await supabaseAdmin
      .from('products')
      .update({ business_owner_id: userId })
      .eq('business_id', targetAccount.id);

    if (productsError) {
      console.warn('Warning: Could not update products.business_owner_id:', productsError);
    } else {
      console.log(`✅ Updated products for business ${targetAccount.id}`);
    }

    // Update business_categories.business_owner_id
    if (oldUserId) {
      const { error: categoriesError } = await supabaseAdmin
        .from('business_categories')
        .update({ business_owner_id: userId })
        .eq('business_owner_id', oldUserId);

      if (categoriesError) {
        console.warn('Warning: Could not update business_categories.business_owner_id:', categoriesError);
      } else {
        console.log(`✅ Updated business_categories for old user ${oldUserId}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        linked: true, 
        business_account_id: targetAccount.id, 
        status: targetAccount.status, 
        is_active: targetAccount.is_active,
        business_name: targetAccount.business_name,
        previous_user_id: oldUserId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
