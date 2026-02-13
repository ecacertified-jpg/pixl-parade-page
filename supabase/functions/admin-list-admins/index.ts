import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminData {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  is_active: boolean;
  created_at: string;
  assigned_at: string;
  assigned_countries: string[] | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  stats: {
    users: number;
    businesses: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user is super_admin
    const { data: callerAdmin, error: callerError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (callerError) {
      return new Response(
        JSON.stringify({ error: 'Erreur de vérification des droits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!callerAdmin || callerAdmin.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux Super Admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch admin_users + aggregate counts in parallel
    const [adminResult, userCountsResult, bizCountsResult, directUserCounts, directBizCounts] = await Promise.all([
      supabaseAdmin
        .from('admin_users')
        .select('id, user_id, role, permissions, is_active, created_at, assigned_at, assigned_countries')
        .order('assigned_at', { ascending: false }),
      supabaseAdmin.rpc('get_profiles_count_by_country'),
      supabaseAdmin.rpc('get_businesses_count_by_country'),
      supabaseAdmin
        .from('admin_user_assignments')
        .select('admin_user_id'),
      supabaseAdmin
        .from('admin_business_assignments')
        .select('admin_user_id'),
    ]);

    if (adminResult.error) {
      console.error('Error fetching admin_users:', adminResult.error);
      return new Response(
        JSON.stringify({ error: 'Erreur lors du chargement des administrateurs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build country->count maps
    const userCountMap: Record<string, number> = {};
    let totalUsers = 0;
    if (userCountsResult.data) {
      for (const row of userCountsResult.data) {
        userCountMap[row.country_code || '_null'] = Number(row.count);
        totalUsers += Number(row.count);
      }
    }

    const bizCountMap: Record<string, number> = {};
    let totalBusinesses = 0;
    if (bizCountsResult.data) {
      for (const row of bizCountsResult.data) {
        bizCountMap[row.country_code || '_null'] = Number(row.count);
        totalBusinesses += Number(row.count);
      }
    }

    // Build direct assignment count maps
    const directUserCountMap: Record<string, number> = {};
    for (const row of (directUserCounts.data || [])) {
      directUserCountMap[row.admin_user_id] = (directUserCountMap[row.admin_user_id] || 0) + 1;
    }
    const directBizCountMap: Record<string, number> = {};
    for (const row of (directBizCounts.data || [])) {
      directBizCountMap[row.admin_user_id] = (directBizCountMap[row.admin_user_id] || 0) + 1;
    }

    // Build admin list with profiles and stats
    const adminsWithProfiles: AdminData[] = [];

    for (const admin of adminResult.data || []) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', admin.user_id)
        .maybeSingle();

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);

      // Calculate stats based on assigned_countries
      let users = 0;
      let businesses = 0;
      const countries = admin.assigned_countries as string[] | null;

      if (countries === null) {
        // Super admin or no restriction: total global
        users = totalUsers;
        businesses = totalBusinesses;
      } else if (countries.length > 0) {
        for (const cc of countries) {
          users += userCountMap[cc] || 0;
          businesses += bizCountMap[cc] || 0;
        }
      }

      // Add direct assignments
      users += directUserCountMap[admin.id] || 0;
      businesses += directBizCountMap[admin.id] || 0;
      // else: empty array = 0

      adminsWithProfiles.push({
        id: admin.id,
        user_id: admin.user_id,
        role: admin.role,
        permissions: admin.permissions,
        is_active: admin.is_active,
        created_at: admin.created_at,
        assigned_at: admin.assigned_at,
        assigned_countries: countries,
        profiles: {
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          email: authUser?.user?.email || null,
        },
        stats: { users, businesses },
      });
    }

    return new Response(
      JSON.stringify({ data: adminsWithProfiles }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
