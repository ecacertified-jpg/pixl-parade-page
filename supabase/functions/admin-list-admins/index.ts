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
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user's JWT for authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client with service role for accessing auth.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check if calling user is super_admin
    const { data: callerAdmin, error: callerError } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (callerError) {
      console.error('Error checking caller admin status:', callerError);
      return new Response(
        JSON.stringify({ error: 'Erreur de vérification des droits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!callerAdmin || callerAdmin.role !== 'super_admin') {
      console.error('Caller is not super_admin:', callerAdmin);
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux Super Admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Caller is super_admin, fetching admin list...');

    // Fetch all admin_users
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, user_id, role, permissions, is_active, created_at, assigned_at')
      .order('assigned_at', { ascending: false });

    if (adminError) {
      console.error('Error fetching admin_users:', adminError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors du chargement des administrateurs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${adminUsers?.length || 0} admin users`);

    // Fetch profiles and emails for each admin
    const adminsWithProfiles: AdminData[] = [];

    for (const admin of adminUsers || []) {
      // Get profile from profiles table
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', admin.user_id)
        .maybeSingle();

      // Get email from auth.users
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);

      adminsWithProfiles.push({
        id: admin.id,
        user_id: admin.user_id,
        role: admin.role,
        permissions: admin.permissions,
        is_active: admin.is_active,
        created_at: admin.created_at,
        assigned_at: admin.assigned_at,
        profiles: {
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          email: authUser?.user?.email || null,
        },
      });
    }

    console.log('Successfully built admin list with profiles');

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
