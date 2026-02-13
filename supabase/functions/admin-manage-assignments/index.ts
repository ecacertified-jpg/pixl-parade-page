import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifySuperAdmin(supabaseAdmin: any, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data || data.role !== 'super_admin') {
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSuperAdmin = await verifySuperAdmin(supabaseAdmin, user.id);
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Accès réservé aux Super Admins' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);

    // GET: list assignments for an admin
    if (req.method === 'GET') {
      const adminId = url.searchParams.get('admin_id');
      if (!adminId) {
        return new Response(JSON.stringify({ error: 'admin_id requis' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const [userAssignments, businessAssignments] = await Promise.all([
        supabaseAdmin
          .from('admin_user_assignments')
          .select('id, user_id, created_at')
          .eq('admin_user_id', adminId),
        supabaseAdmin
          .from('admin_business_assignments')
          .select('id, business_account_id, created_at')
          .eq('admin_user_id', adminId),
      ]);

      // Fetch profile details for assigned users
      const userIds = (userAssignments.data || []).map((a: any) => a.user_id);
      let userProfiles: any[] = [];
      if (userIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', userIds);
        userProfiles = data || [];
      }

      // Fetch business details
      const bizIds = (businessAssignments.data || []).map((a: any) => a.business_account_id);
      let businessDetails: any[] = [];
      if (bizIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('business_accounts')
          .select('id, business_name, business_type, logo_url')
          .in('id', bizIds);
        businessDetails = data || [];
      }

      return new Response(JSON.stringify({
        user_assignments: (userAssignments.data || []).map((a: any) => {
          const profile = userProfiles.find((p: any) => p.user_id === a.user_id);
          return { ...a, profile };
        }),
        business_assignments: (businessAssignments.data || []).map((a: any) => {
          const business = businessDetails.find((b: any) => b.id === a.business_account_id);
          return { ...a, business };
        }),
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: add assignments
    if (req.method === 'POST') {
      const body = await req.json();
      const { admin_id, user_ids, business_ids } = body;

      if (!admin_id) {
        return new Response(JSON.stringify({ error: 'admin_id requis' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: any = { users_added: 0, businesses_added: 0 };

      if (user_ids && user_ids.length > 0) {
        const rows = user_ids.map((uid: string) => ({
          admin_user_id: admin_id,
          user_id: uid,
          assigned_by: user.id,
        }));
        const { data, error } = await supabaseAdmin
          .from('admin_user_assignments')
          .upsert(rows, { onConflict: 'admin_user_id,user_id', ignoreDuplicates: true })
          .select();
        if (error) {
          console.error('Error adding user assignments:', error);
          return new Response(JSON.stringify({ error: 'Erreur lors de l\'ajout des utilisateurs' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        results.users_added = data?.length || 0;
      }

      if (business_ids && business_ids.length > 0) {
        const rows = business_ids.map((bid: string) => ({
          admin_user_id: admin_id,
          business_account_id: bid,
          assigned_by: user.id,
        }));
        const { data, error } = await supabaseAdmin
          .from('admin_business_assignments')
          .upsert(rows, { onConflict: 'admin_user_id,business_account_id', ignoreDuplicates: true })
          .select();
        if (error) {
          console.error('Error adding business assignments:', error);
          return new Response(JSON.stringify({ error: 'Erreur lors de l\'ajout des entreprises' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        results.businesses_added = data?.length || 0;
      }

      // Audit log
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action_type: 'assign_resources',
        target_type: 'admin_user',
        target_id: admin_id,
        description: `Affectation: ${results.users_added} utilisateur(s), ${results.businesses_added} entreprise(s)`,
        metadata: { user_ids, business_ids, results },
      });

      return new Response(JSON.stringify(results), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: remove assignments
    if (req.method === 'DELETE') {
      const body = await req.json();
      const { admin_id, assignment_ids, type } = body;

      if (!admin_id || !assignment_ids || !type) {
        return new Response(JSON.stringify({ error: 'admin_id, assignment_ids et type requis' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const table = type === 'user' ? 'admin_user_assignments' : 'admin_business_assignments';
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .in('id', assignment_ids)
        .eq('admin_user_id', admin_id);

      if (error) {
        console.error('Error deleting assignments:', error);
        return new Response(JSON.stringify({ error: 'Erreur lors de la suppression' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Audit log
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action_type: 'unassign_resources',
        target_type: 'admin_user',
        target_id: admin_id,
        description: `Retrait de ${assignment_ids.length} ${type === 'user' ? 'utilisateur(s)' : 'entreprise(s)'}`,
        metadata: { assignment_ids, type },
      });

      return new Response(JSON.stringify({ removed: assignment_ids.length }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Méthode non supportée' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne du serveur' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
