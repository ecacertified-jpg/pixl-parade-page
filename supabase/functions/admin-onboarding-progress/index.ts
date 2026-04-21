import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OnboardingUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  country_code: string | null;
  created_at: string;
  onboarding_completed: boolean;
  birthday: string | null;
  selected_tastes: string[] | null;
  furthest_step: number;
  current_step: number; // step user is currently blocked on (1-6, or 6 if completed)
  blocking_step: number | null; // null if completed
  has_birthday: boolean;
  has_tastes: boolean;
  favorites_count: number;
  friends_count: number;
  has_birthday_page: boolean;
  has_birthday_fund: boolean;
  shares_count: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: adminRow } = await supabaseAdmin
      .from('admin_users')
      .select('role, is_active, assigned_countries')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!adminRow || !adminRow.is_active) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSuperAdmin = adminRow.role === 'super_admin';
    const accessibleCountries: string[] | null = isSuperAdmin
      ? null
      : (adminRow.assigned_countries as string[] | null) || null;

    // Fetch profiles
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, display_name, phone, city, country_code, created_at, onboarding_completed, onboarding_furthest_step, birthday, selected_tastes')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (accessibleCountries && accessibleCountries.length > 0) {
      profilesQuery = profilesQuery.in('country_code', accessibleCountries);
    }

    const { data: profiles, error: profErr } = await profilesQuery;
    if (profErr) throw profErr;

    const userIds = (profiles || []).map((p: any) => p.user_id);
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          users: [],
          stats: { total: 0, completed: 0, byStep: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Batch queries
    const [favRes, friendFormsRes, circlesRes, pagesRes, fundsRes, sharesRes] = await Promise.all([
      supabaseAdmin.from('user_favorites').select('user_id').in('user_id', userIds),
      supabaseAdmin
        .from('friend_form_tokens')
        .select('user_id')
        .in('user_id', userIds)
        .eq('status', 'completed'),
      supabaseAdmin.from('friend_circles').select('id, user_id').in('user_id', userIds),
      supabaseAdmin
        .from('birthday_pages')
        .select('user_id')
        .in('user_id', userIds)
        .eq('is_active', true),
      supabaseAdmin
        .from('collective_funds')
        .select('creator_id')
        .in('creator_id', userIds)
        .eq('occasion', 'birthday')
        .eq('status', 'active'),
      supabaseAdmin.from('onboarding_shares').select('user_id').in('user_id', userIds),
    ]);

    // Tally circle members
    const circleIds = (circlesRes.data || []).map((c: any) => c.id);
    const circleToUser: Record<string, string> = {};
    (circlesRes.data || []).forEach((c: any) => { circleToUser[c.id] = c.user_id; });
    const memberCountByUser: Record<string, number> = {};
    if (circleIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from('friend_circle_members')
        .select('circle_id')
        .in('circle_id', circleIds);
      (members || []).forEach((m: any) => {
        const uid = circleToUser[m.circle_id];
        if (uid) memberCountByUser[uid] = (memberCountByUser[uid] || 0) + 1;
      });
    }

    const tally = (rows: any[] | null, key: string): Record<string, number> => {
      const m: Record<string, number> = {};
      (rows || []).forEach((r: any) => {
        const k = r[key];
        if (k) m[k] = (m[k] || 0) + 1;
      });
      return m;
    };

    const favCounts = tally(favRes.data, 'user_id');
    const friendFormCounts = tally(friendFormsRes.data, 'user_id');
    const pageCounts = tally(pagesRes.data, 'user_id');
    const fundCounts = tally(fundsRes.data, 'creator_id');
    const shareCounts = tally(sharesRes.data, 'user_id');

    // Fetch emails via admin auth (batch)
    const emailMap: Record<string, string | null> = {};
    // Use listUsers paged — efficient enough up to ~2000
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) break;
      (data?.users || []).forEach((u: any) => { emailMap[u.id] = u.email || null; });
      if (!data?.users || data.users.length < perPage) break;
      page++;
      if (page > 5) break; // safety cap
    }

    const users: OnboardingUser[] = (profiles || []).map((p: any) => {
      const has_birthday = !!p.birthday;
      const has_tastes = Array.isArray(p.selected_tastes) && p.selected_tastes.length > 0;
      const favorites_count = favCounts[p.user_id] || 0;
      const friend_forms = friendFormCounts[p.user_id] || 0;
      const circle_members = memberCountByUser[p.user_id] || 0;
      const friends_count = Math.max(friend_forms, circle_members);
      const has_birthday_page = (pageCounts[p.user_id] || 0) >= 1;
      const has_birthday_fund = (fundCounts[p.user_id] || 0) >= 1;
      const shares_count = shareCounts[p.user_id] || 0;

      let blocking_step: number | null = null;
      if (!has_birthday) blocking_step = 1;
      else if (!has_tastes) blocking_step = 2;
      else if (favorites_count < 3) blocking_step = 3;
      else if (friends_count < 3) blocking_step = 4;
      else if (!has_birthday_page || !has_birthday_fund || shares_count < 3) blocking_step = 5;
      else blocking_step = null;

      const computedCurrentStep = blocking_step ?? 6;
      const furthest = Math.max(p.onboarding_furthest_step ?? 0, computedCurrentStep);
      const isCompleted = p.onboarding_completed === true || blocking_step === null;

      return {
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        display_name: p.display_name,
        phone: p.phone,
        email: emailMap[p.user_id] ?? null,
        city: p.city,
        country_code: p.country_code,
        created_at: p.created_at,
        onboarding_completed: isCompleted,
        birthday: p.birthday,
        selected_tastes: p.selected_tastes,
        furthest_step: furthest,
        current_step: computedCurrentStep,
        blocking_step: isCompleted ? null : blocking_step,
        has_birthday,
        has_tastes,
        favorites_count,
        friends_count,
        has_birthday_page,
        has_birthday_fund,
        shares_count,
      };
    });

    const byStep: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let completed = 0;
    users.forEach((u) => {
      // furthest_step: step the user has reached
      const reached = Math.min(6, Math.max(1, u.furthest_step || 1));
      for (let s = 1; s <= reached; s++) byStep[s]++;
      if (u.onboarding_completed) completed++;
    });

    return new Response(
      JSON.stringify({
        users,
        stats: { total: users.length, completed, byStep },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('admin-onboarding-progress error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
