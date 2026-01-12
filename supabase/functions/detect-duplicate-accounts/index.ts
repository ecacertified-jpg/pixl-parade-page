import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectDuplicatesRequest {
  type: 'client' | 'business';
  // For clients
  first_name?: string;
  birthday?: string;
  // For businesses
  business_name?: string;
  business_phone?: string;
}

interface AccountData {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  birthday: string | null;
  avatar_url: string | null;
  created_at: string;
  is_suspended: boolean;
  auth_provider?: string;
  email?: string;
}

interface BusinessData {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_verified: boolean;
  status: string | null;
  created_at: string;
}

interface DataCount {
  contacts: number;
  funds: number;
  contributions: number;
  posts: number;
  orders: number;
  products: number;
}

interface DuplicateAccount {
  user_id: string;
  profile: AccountData;
  business?: BusinessData;
  auth_methods: string[];
  data_count: DataCount;
  created_at: string;
  last_active: string | null;
}

interface DuplicateGroup {
  confidence: 'high' | 'medium';
  match_criteria: string[];
  accounts: DuplicateAccount[];
  recommended_primary: string;
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

    // Verify admin status
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('role, permissions, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only super_admin can detect duplicates
    if (adminUser.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Super admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: DetectDuplicatesRequest = await req.json();

    if (body.type === 'client') {
      // Search for client duplicates by first_name + birthday
      if (!body.first_name || !body.birthday) {
        return new Response(
          JSON.stringify({ error: 'first_name and birthday are required for client search' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find all profiles matching first_name (case-insensitive) and birthday
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('first_name', body.first_name)
        .eq('birthday', body.birthday)
        .eq('is_suspended', false);

      if (profilesError) {
        throw profilesError;
      }

      if (!profiles || profiles.length < 2) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: profiles?.length === 1 
              ? 'Un seul compte trouvé, pas de doublon' 
              : 'Aucun compte correspondant trouvé',
            duplicates: [] 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Enrich accounts with auth methods and data counts
      const enrichedAccounts: DuplicateAccount[] = [];

      for (const profile of profiles) {
        // Get auth user info
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
        
        const authMethods: string[] = [];
        if (authUser?.user?.phone) authMethods.push('phone');
        if (authUser?.user?.email) {
          const provider = authUser.user.app_metadata?.provider || 'email';
          authMethods.push(provider === 'google' ? 'google' : 'email');
        }

        // Get data counts
        const [contactsRes, fundsRes, contributionsRes, postsRes, ordersRes] = await Promise.all([
          supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
          supabaseAdmin.from('collective_funds').select('id', { count: 'exact', head: true }).eq('creator_id', profile.user_id),
          supabaseAdmin.from('fund_contributions').select('id', { count: 'exact', head: true }).eq('contributor_id', profile.user_id),
          supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profile.user_id),
          supabaseAdmin.from('business_orders').select('id', { count: 'exact', head: true }).eq('customer_id', profile.user_id),
        ]);

        // Get last activity (most recent post or contribution)
        const { data: lastPost } = await supabaseAdmin
          .from('posts')
          .select('created_at')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        enrichedAccounts.push({
          user_id: profile.user_id,
          profile: {
            ...profile,
            email: authUser?.user?.email || null,
            auth_provider: authUser?.user?.app_metadata?.provider || null,
          },
          auth_methods: authMethods,
          data_count: {
            contacts: contactsRes.count || 0,
            funds: fundsRes.count || 0,
            contributions: contributionsRes.count || 0,
            posts: postsRes.count || 0,
            orders: ordersRes.count || 0,
            products: 0,
          },
          created_at: profile.created_at,
          last_active: lastPost?.created_at || null,
        });
      }

      // Sort by data richness and age
      enrichedAccounts.sort((a, b) => {
        const aScore = a.data_count.contacts + a.data_count.funds * 2 + a.data_count.posts;
        const bScore = b.data_count.contacts + b.data_count.funds * 2 + b.data_count.posts;
        if (bScore !== aScore) return bScore - aScore;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const duplicateGroup: DuplicateGroup = {
        confidence: 'high',
        match_criteria: ['first_name', 'birthday'],
        accounts: enrichedAccounts,
        recommended_primary: enrichedAccounts[0].user_id,
      };

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${enrichedAccounts.length} comptes en double trouvés`,
          duplicates: [duplicateGroup] 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (body.type === 'business') {
      // Search for business duplicates by business_name and/or phone
      if (!body.business_name && !body.business_phone) {
        return new Response(
          JSON.stringify({ error: 'business_name or business_phone required for business search' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabaseAdmin.from('business_accounts').select('*');
      
      const matchCriteria: string[] = [];
      
      // Build the query based on provided criteria
      if (body.business_name && body.business_phone) {
        // Normalize phone
        const normalizedPhone = body.business_phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        query = query.or(`business_name.ilike.%${body.business_name}%,phone.ilike.%${normalizedPhone}%`);
        matchCriteria.push('business_name', 'phone');
      } else if (body.business_name) {
        query = query.ilike('business_name', `%${body.business_name}%`);
        matchCriteria.push('business_name');
      } else if (body.business_phone) {
        const normalizedPhone = body.business_phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
        query = query.ilike('phone', `%${normalizedPhone}%`);
        matchCriteria.push('phone');
      }

      const { data: businesses, error: businessesError } = await query;

      if (businessesError) {
        throw businessesError;
      }

      if (!businesses || businesses.length < 2) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: businesses?.length === 1 
              ? 'Un seul compte business trouvé, pas de doublon' 
              : 'Aucun compte business correspondant trouvé',
            duplicates: [] 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Enrich business accounts with owner info and data counts
      const enrichedAccounts: DuplicateAccount[] = [];

      for (const business of businesses) {
        // Get owner profile
        const { data: ownerProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', business.user_id)
          .single();

        // Get auth user info
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(business.user_id);
        
        const authMethods: string[] = [];
        if (authUser?.user?.phone) authMethods.push('phone');
        if (authUser?.user?.email) {
          const provider = authUser.user.app_metadata?.provider || 'email';
          authMethods.push(provider === 'google' ? 'google' : 'email');
        }

        // Get data counts
        const [productsRes, ordersRes, fundsRes] = await Promise.all([
          supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('business_owner_id', business.user_id),
          supabaseAdmin.from('business_orders').select('id', { count: 'exact', head: true }).eq('business_account_id', business.id),
          supabaseAdmin.from('collective_funds').select('id', { count: 'exact', head: true }).eq('created_by_business_id', business.id),
        ]);

        enrichedAccounts.push({
          user_id: business.user_id,
          profile: {
            user_id: business.user_id,
            first_name: ownerProfile?.first_name || null,
            last_name: ownerProfile?.last_name || null,
            phone: ownerProfile?.phone || null,
            city: ownerProfile?.city || null,
            birthday: ownerProfile?.birthday || null,
            avatar_url: ownerProfile?.avatar_url || null,
            created_at: ownerProfile?.created_at || business.created_at,
            is_suspended: ownerProfile?.is_suspended || false,
            email: authUser?.user?.email || null,
            auth_provider: authUser?.user?.app_metadata?.provider || null,
          },
          business: business,
          auth_methods: authMethods,
          data_count: {
            contacts: 0,
            funds: fundsRes.count || 0,
            contributions: 0,
            posts: 0,
            orders: ordersRes.count || 0,
            products: productsRes.count || 0,
          },
          created_at: business.created_at,
          last_active: null,
        });
      }

      // Sort by verification status, then by data richness
      enrichedAccounts.sort((a, b) => {
        // Prefer verified business
        if (a.business?.is_verified && !b.business?.is_verified) return -1;
        if (!a.business?.is_verified && b.business?.is_verified) return 1;
        
        // Then by data richness
        const aScore = a.data_count.products * 2 + a.data_count.orders;
        const bScore = b.data_count.products * 2 + b.data_count.orders;
        if (bScore !== aScore) return bScore - aScore;
        
        // Then by age
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const duplicateGroup: DuplicateGroup = {
        confidence: 'high',
        match_criteria: matchCriteria,
        accounts: enrichedAccounts,
        recommended_primary: enrichedAccounts[0].user_id,
      };

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${enrichedAccounts.length} comptes business en double trouvés`,
          duplicates: [duplicateGroup] 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type. Must be "client" or "business"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Detect duplicates error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
