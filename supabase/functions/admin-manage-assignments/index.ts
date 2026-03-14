import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

interface AdminInfo {
  id: string;
  role: string;
  is_active: boolean;
  assigned_countries: string[] | null;
}

async function getAdminInfo(supabaseAdmin: any, userId: string): Promise<AdminInfo | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active, assigned_countries')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function getAdminInfoById(supabaseAdmin: any, adminId: string): Promise<AdminInfo | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, is_active, assigned_countries')
    .eq('id', adminId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function hasSharedCountry(countries1: string[] | null, countries2: string[] | null): boolean {
  if (!countries1 || !countries2 || countries1.length === 0 || countries2.length === 0) return false;
  return countries1.some(c => countries2.includes(c));
}

function canManageAdmin(callerAdmin: AdminInfo, targetAdminId: string): boolean {
  // Super admin can manage anyone
  if (callerAdmin.role === 'super_admin') return true;
  // Other admins can only manage themselves
  return callerAdmin.id === targetAdminId;
}

async function canViewAdmin(supabaseAdmin: any, callerAdmin: AdminInfo, targetAdminId: string): Promise<boolean> {
  // Super admin can view anyone
  if (callerAdmin.role === 'super_admin') return true;
  // Self
  if (callerAdmin.id === targetAdminId) return true;
  // Regional admin can view admins sharing at least one country
  if (callerAdmin.role === 'regional_admin') {
    const targetAdmin = await getAdminInfoById(supabaseAdmin, targetAdminId);
    if (targetAdmin && hasSharedCountry(callerAdmin.assigned_countries, targetAdmin.assigned_countries)) {
      return true;
    }
  }
  return false;
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

    const callerAdmin = await getAdminInfo(supabaseAdmin, user.id);
    if (!callerAdmin) {
      return new Response(JSON.stringify({ error: 'Accès réservé aux administrateurs actifs' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);

    // GET: list assignments for an admin
    if (req.method === 'GET') {
      const adminId = url.searchParams.get('admin_id');
      // Special param to get all assignments for exclusivity check
      const allAssignments = url.searchParams.get('all_assignments') === 'true';

      if (allAssignments) {
        // Return all assignments with admin names for exclusivity display
        const [userAssignments, businessAssignments] = await Promise.all([
          supabaseAdmin
            .from('admin_user_assignments')
            .select('admin_user_id, user_id'),
          supabaseAdmin
            .from('admin_business_assignments')
            .select('admin_user_id, business_account_id'),
        ]);

        // Get admin names
        const adminIds = new Set<string>();
        (userAssignments.data || []).forEach((a: any) => adminIds.add(a.admin_user_id));
        (businessAssignments.data || []).forEach((a: any) => adminIds.add(a.admin_user_id));

        let adminProfiles: any[] = [];
        if (adminIds.size > 0) {
          // Get admin user_ids first
          const { data: admins } = await supabaseAdmin
            .from('admin_users')
            .select('id, user_id')
            .in('id', Array.from(adminIds));
          
          if (admins && admins.length > 0) {
            const userIds = admins.map((a: any) => a.user_id);
            const { data: profiles } = await supabaseAdmin
              .from('profiles')
              .select('user_id, first_name, last_name')
              .in('user_id', userIds);
            
            adminProfiles = (admins || []).map((admin: any) => {
              const profile = (profiles || []).find((p: any) => p.user_id === admin.user_id);
              return {
                admin_id: admin.id,
                name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Admin',
              };
            });
          }
        }

        const getAdminName = (adminId: string) => {
          const found = adminProfiles.find((a: any) => a.admin_id === adminId);
          return found?.name || 'Admin';
        };

        return new Response(JSON.stringify({
          user_assignments: (userAssignments.data || []).map((a: any) => ({
            ...a,
            admin_name: getAdminName(a.admin_user_id),
          })),
          business_assignments: (businessAssignments.data || []).map((a: any) => ({
            ...a,
            admin_name: getAdminName(a.admin_user_id),
          })),
        }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!adminId) {
        return new Response(JSON.stringify({ error: 'admin_id requis' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const canView = await canViewAdmin(supabaseAdmin, callerAdmin, adminId);
      if (!canView) {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Pagination params for user assignments
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page_size') || '50', 10)));
      const offset = (page - 1) * pageSize;

      const [userAssignmentsResult, businessAssignments] = await Promise.all([
        supabaseAdmin
          .from('admin_user_assignments')
          .select('id, user_id, created_at, assigned_via', { count: 'exact' })
          .eq('admin_user_id', adminId)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1),
        supabaseAdmin
          .from('admin_business_assignments')
          .select('id, business_account_id, created_at, assigned_via')
          .eq('admin_user_id', adminId),
      ]);

      const totalUsers = userAssignmentsResult.count || 0;
      const userAssignmentsData = userAssignmentsResult.data || [];

      // Fetch profile details for assigned users (only current page)
      const userIds = userAssignmentsData.map((a: any) => a.user_id);
      let userProfiles: any[] = [];
      if (userIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url, phone, country_code, birthday, city, bio, created_at, is_suspended')
          .in('user_id', userIds);
        userProfiles = data || [];
      }

      // Fetch relationship data from contacts (admin's contacts linked to assigned users)
      // First get the admin's auth user_id
      const { data: adminUserData } = await supabaseAdmin
        .from('admin_users')
        .select('user_id')
        .eq('id', adminId)
        .single();

      let relationshipMap: Record<string, string> = {};
      if (adminUserData && userIds.length > 0) {
        const { data: contactRelations } = await supabaseAdmin
          .from('contacts')
          .select('linked_user_id, relationship')
          .eq('user_id', adminUserData.user_id)
          .in('linked_user_id', userIds)
          .not('relationship', 'is', null);
        if (contactRelations) {
          for (const cr of contactRelations) {
            if (cr.linked_user_id && cr.relationship) {
              relationshipMap[cr.linked_user_id] = cr.relationship;
            }
          }
        }
      }

      // Fetch business details (not paginated - low volume)
      const bizIds = (businessAssignments.data || []).map((a: any) => a.business_account_id);
      let businessDetails: any[] = [];
      if (bizIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('business_accounts')
          .select('id, business_name, business_type, logo_url, email, phone, country_code, created_at, status, is_active, is_verified')
          .in('id', bizIds);
        businessDetails = data || [];
      }

      // Calculate birthday stats across ALL assignments (not just current page)
      const { data: allAssignmentsForStats } = await supabaseAdmin
        .from('admin_user_assignments')
        .select('user_id, assigned_via')
        .eq('admin_user_id', adminId);

      let birthdayStats = {
        via_link: { today: 0, week: 0, month: 0 },
        manual: { today: 0, week: 0, month: 0 },
        total: { today: 0, week: 0, month: 0 },
      };

      if (allAssignmentsForStats && allAssignmentsForStats.length > 0) {
        const allUserIds = allAssignmentsForStats.map((a: any) => a.user_id);
        // Fetch birthdays for all assigned users (batched if needed)
        const batchSize = 500;
        const allBirthdays: any[] = [];
        for (let i = 0; i < allUserIds.length; i += batchSize) {
          const batch = allUserIds.slice(i, i + batchSize);
          const { data: bdays } = await supabaseAdmin
            .from('profiles')
            .select('user_id, birthday')
            .in('user_id', batch)
            .not('birthday', 'is', null);
          if (bdays) allBirthdays.push(...bdays);
        }

        const birthdayMap = new Map(allBirthdays.map((b: any) => [b.user_id, b.birthday]));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const assignment of allAssignmentsForStats) {
          const bday = birthdayMap.get(assignment.user_id);
          if (!bday) continue;

          const parts = bday.split('-');
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);

          const nextBirthday = new Date(today.getFullYear(), month, day);
          nextBirthday.setHours(0, 0, 0, 0);
          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }

          const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const bucket = assignment.assigned_via === 'share_link' ? 'via_link' : 'manual';

          if (daysUntil === 0) {
            birthdayStats[bucket].today++;
            birthdayStats.total.today++;
          }
          if (daysUntil <= 7) {
            birthdayStats[bucket].week++;
            birthdayStats.total.week++;
          }
          if (daysUntil <= 30) {
            birthdayStats[bucket].month++;
            birthdayStats.total.month++;
          }
        }
      }

      return new Response(JSON.stringify({
        user_assignments: userAssignmentsData.map((a: any) => {
          const profile = userProfiles.find((p: any) => p.user_id === a.user_id);
          return { ...a, profile };
        }),
        business_assignments: (businessAssignments.data || []).map((a: any) => {
          const business = businessDetails.find((b: any) => b.id === a.business_account_id);
          return { ...a, business };
        }),
        total_users: totalUsers,
        page,
        page_size: pageSize,
        birthday_stats: birthdayStats,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: add assignments with exclusivity check
    if (req.method === 'POST') {
      const body = await req.json();
      const { admin_id, user_ids, business_ids } = body;

      if (!admin_id) {
        return new Response(JSON.stringify({ error: 'admin_id requis' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!canManageAdmin(callerAdmin, admin_id)) {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const results: any = { users_added: 0, businesses_added: 0, conflicts: [] };

      // Add user assignments with exclusivity check
      if (user_ids && user_ids.length > 0) {
        // Check for existing assignments to other admins
        const { data: existing } = await supabaseAdmin
          .from('admin_user_assignments')
          .select('user_id, admin_user_id')
          .in('user_id', user_ids);

        const conflicts = (existing || []).filter((e: any) => e.admin_user_id !== admin_id);
        if (conflicts.length > 0) {
          results.conflicts.push(...conflicts.map((c: any) => ({
            type: 'user',
            id: c.user_id,
            assigned_to: c.admin_user_id,
          })));
        }

        const availableUserIds = user_ids.filter((uid: string) =>
          !conflicts.some((c: any) => c.user_id === uid)
        );

        if (availableUserIds.length > 0) {
          const rows = availableUserIds.map((uid: string) => ({
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
      }

      // Add business assignments with exclusivity check
      if (business_ids && business_ids.length > 0) {
        const { data: existing } = await supabaseAdmin
          .from('admin_business_assignments')
          .select('business_account_id, admin_user_id')
          .in('business_account_id', business_ids);

        const conflicts = (existing || []).filter((e: any) => e.admin_user_id !== admin_id);
        if (conflicts.length > 0) {
          results.conflicts.push(...conflicts.map((c: any) => ({
            type: 'business',
            id: c.business_account_id,
            assigned_to: c.admin_user_id,
          })));
        }

        const availableBizIds = business_ids.filter((bid: string) =>
          !conflicts.some((c: any) => c.business_account_id === bid)
        );

        if (availableBizIds.length > 0) {
          const rows = availableBizIds.map((bid: string) => ({
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
      }

      // Audit log
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_user_id: user.id,
        action_type: callerAdmin.id === admin_id ? 'self_assign_resources' : 'assign_resources',
        target_type: 'admin_user',
        target_id: admin_id,
        description: `Affectation: ${results.users_added} utilisateur(s), ${results.businesses_added} entreprise(s)${results.conflicts.length > 0 ? ` (${results.conflicts.length} conflit(s))` : ''}`,
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

      if (!canManageAdmin(callerAdmin, admin_id)) {
        return new Response(JSON.stringify({ error: 'Accès non autorisé' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        action_type: callerAdmin.id === admin_id ? 'self_unassign_resources' : 'unassign_resources',
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
