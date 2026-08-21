import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  computeCrmRecord,
  detectDuplicateGroups,
  DUPLICATE_STATUSES,
  REACTIVATION_STATUSES,
  SEGMENTS,
  type CrmComputed,
  type CrmOverviewRow,
  type ScoringRule,
} from './crm-core.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const APP_ORIGIN = 'https://joiedevivre-africa.com';

interface Filters {
  search?: string;
  country?: string;
  city?: string;
  segment?: string;
  priority?: string;
  score_min?: number;
  score_max?: number;
  has_page?: boolean;
  has_fund?: boolean;
  has_shared?: boolean;
  activity?: 'active' | 'inactive';
  statut_reactivation?: string;
  statut_doublon?: string;
  signup_from?: string;
  signup_to?: string;
  birthday_within_days?: number;
}

function matches(r: CrmComputed, f: Filters): boolean {
  if (f.search) {
    const q = f.search.trim().toLowerCase();
    const hay = [r.first_name, r.last_name, r.phone, r.email, r.crm_id, r.user_id]
      .filter(Boolean).join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.country && r.country_code !== f.country) return false;
  if (f.city && (r.city ?? '').toLowerCase() !== f.city.toLowerCase()) return false;
  if (f.segment && r.segment !== f.segment) return false;
  if (f.priority && r.priority !== f.priority) return false;
  if (typeof f.score_min === 'number' && r.score < f.score_min) return false;
  if (typeof f.score_max === 'number' && r.score > f.score_max) return false;
  if (typeof f.has_page === 'boolean' && (r.has_birthday_page || r.has_event_page) !== f.has_page) return false;
  if (typeof f.has_fund === 'boolean' && r.has_fund !== f.has_fund) return false;
  if (typeof f.has_shared === 'boolean' && r.has_shared !== f.has_shared) return false;
  if (f.activity === 'active' && !(r.days_since_activity !== null && r.days_since_activity <= 30)) return false;
  if (f.activity === 'inactive' && !(r.days_since_activity === null || r.days_since_activity > 30)) return false;
  if (f.statut_reactivation && r.statut_reactivation !== f.statut_reactivation) return false;
  if (f.statut_doublon && r.statut_doublon !== f.statut_doublon) return false;
  if (f.signup_from && r.signup_date < f.signup_from) return false;
  if (f.signup_to && r.signup_date > `${f.signup_to}T23:59:59Z`) return false;
  if (typeof f.birthday_within_days === 'number') {
    if (r.days_to_birthday === null || r.days_to_birthday > f.birthday_within_days) return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await createClient(supabaseUrl, anonKey).auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'Invalid auth' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: adminRow } = await admin
      .from('admin_users')
      .select('role, is_active, assigned_countries')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!adminRow || !adminRow.is_active) return json({ error: 'Accès refusé' }, 403);

    const isSuperAdmin = adminRow.role === 'super_admin';
    const allowedCountries: string[] | null =
      isSuperAdmin || !adminRow.assigned_countries || (adminRow.assigned_countries as string[]).length === 0
        ? null
        : (adminRow.assigned_countries as string[]);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const action: string = body.action ?? 'list';

    // ---- Mutations -----------------------------------------------------
    if (action === 'set_status') {
      const { user_id, statut_reactivation, statut_doublon, admin_notes } = body;
      if (!user_id || typeof user_id !== 'string') return json({ error: 'user_id requis' }, 400);
      if (statut_reactivation && !REACTIVATION_STATUSES.includes(statut_reactivation)) {
        return json({ error: 'Statut de réactivation invalide' }, 400);
      }
      if (statut_doublon && !DUPLICATE_STATUSES.includes(statut_doublon)) {
        return json({ error: 'Statut de doublon invalide' }, 400);
      }
      const patch: Record<string, unknown> = { user_id };
      if (statut_reactivation) patch.statut_reactivation = statut_reactivation;
      if (statut_doublon) patch.statut_doublon = statut_doublon;
      if (typeof admin_notes === 'string') patch.admin_notes = admin_notes.slice(0, 5000);

      const { data, error } = await admin
        .from('crm_profiles')
        .upsert(patch, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ profile: data });
    }

    if (action === 'add_history') {
      const { user_id, canal, campagne, message, statut, reponse, action_suivante, resultat, occurred_at } = body;
      if (!user_id || typeof user_id !== 'string') return json({ error: 'user_id requis' }, 400);

      const { data: crmProfile } = await admin
        .from('crm_profiles')
        .upsert({ user_id }, { onConflict: 'user_id' })
        .select('id')
        .maybeSingle();

      const { data, error } = await admin
        .from('crm_reactivation_history')
        .insert({
          user_id,
          crm_profile_id: crmProfile?.id ?? null,
          occurred_at: occurred_at || new Date().toISOString(),
          canal: canal ?? null,
          campagne: campagne ?? null,
          message: message ? String(message).slice(0, 5000) : null,
          statut: statut ?? null,
          reponse: reponse ? String(reponse).slice(0, 5000) : null,
          action_suivante: action_suivante ?? null,
          resultat: resultat ?? null,
          created_by: userData.user.id,
        })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);

      if (statut && REACTIVATION_STATUSES.includes(statut)) {
        await admin.from('crm_profiles')
          .update({ statut_reactivation: statut, last_contacted_at: new Date().toISOString() })
          .eq('user_id', user_id);
      }
      return json({ entry: data });
    }

    // ---- Read paths ----------------------------------------------------
    const { data: rules } = await admin
      .from('crm_scoring_rules')
      .select('rule_key, label, points, is_active');

    let query = admin.from('crm_user_overview').select('*').limit(20000);
    if (allowedCountries) query = query.in('country_code', allowedCountries);
    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) return json({ error: rowsErr.message }, 500);

    const overview = (rows ?? []) as CrmOverviewRow[];

    // Provision des fiches CRM manquantes (CRM ID stable), sans toucher aux données sources
    const { data: crmRows } = await admin
      .from('crm_profiles')
      .select('user_id, crm_id, statut_reactivation, statut_doublon, admin_notes, last_contacted_at')
      .limit(20000);

    const crmMap = new Map((crmRows ?? []).map((c) => [c.user_id as string, c]));
    const missing = overview.filter((r) => !crmMap.has(r.user_id)).map((r) => ({ user_id: r.user_id }));
    if (missing.length > 0) {
      for (let i = 0; i < missing.length; i += 500) {
        const { data: inserted } = await admin
          .from('crm_profiles')
          .upsert(missing.slice(i, i + 500), { onConflict: 'user_id', ignoreDuplicates: true })
          .select('user_id, crm_id, statut_reactivation, statut_doublon, admin_notes, last_contacted_at');
        for (const c of inserted ?? []) crmMap.set(c.user_id as string, c);
      }
    }

    const now = new Date();
    const records = overview.map((r) =>
      computeCrmRecord(r, crmMap.get(r.user_id) as never, (rules ?? []) as ScoringRule[], APP_ORIGIN, now),
    );

    const duplicateGroups = detectDuplicateGroups(records);
    for (const r of records) {
      if (duplicateGroups.has(r.user_id) && r.statut_doublon === 'Unique') {
        r.statut_doublon = 'Doublon probable';
      }
    }

    if (action === 'stats') {
      const countBySegment: Record<string, number> = {};
      for (const key of Object.keys(SEGMENTS)) countBySegment[key] = 0;
      const byCountry: Record<string, number> = {};
      let duplicates = 0, birthdaySoon = 0, noPage = 0, pageNoFund = 0, fundNotShared = 0,
        inactive = 0, veryHigh = 0, toContact = 0, converted = 0;

      for (const r of records) {
        countBySegment[r.segment] = (countBySegment[r.segment] ?? 0) + 1;
        if (r.country_code) byCountry[r.country_code] = (byCountry[r.country_code] ?? 0) + 1;
        if (r.statut_doublon !== 'Unique') duplicates++;
        if (r.days_to_birthday !== null && r.days_to_birthday <= 30) birthdaySoon++;
        if (!r.has_birthday_page && !r.has_event_page) noPage++;
        if ((r.has_birthday_page || r.has_event_page) && !r.has_fund) pageNoFund++;
        if (r.has_fund && !r.has_shared) fundNotShared++;
        if (r.days_since_activity === null || r.days_since_activity > 30) inactive++;
        if (r.priority === 'TRÈS HAUTE') veryHigh++;
        if (r.statut_reactivation === 'À contacter') toContact++;
        if (r.statut_reactivation === 'Converti') converted++;
      }

      return json({
        total: records.length,
        by_country: byCountry,
        duplicates,
        birthday_soon: birthdaySoon,
        no_page: noPage,
        page_no_fund: pageNoFund,
        fund_not_shared: fundNotShared,
        inactive,
        very_high_priority: veryHigh,
        to_contact: toContact,
        converted,
        segments: countBySegment,
        segment_defs: SEGMENTS,
      });
    }

    if (action === 'detail') {
      const userId: string = body.user_id;
      if (!userId) return json({ error: 'user_id requis' }, 400);
      const record = records.find((r) => r.user_id === userId);
      if (!record) return json({ error: 'Utilisateur introuvable' }, 404);

      const { data: history } = await admin
        .from('crm_reactivation_history')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false });

      const dupIds = duplicateGroups.get(userId) ?? [];
      const duplicatesDetail = records
        .filter((r) => dupIds.includes(r.user_id))
        .map((r) => ({
          user_id: r.user_id, crm_id: r.crm_id, first_name: r.first_name,
          last_name: r.last_name, phone: r.phone, email: r.email, signup_date: r.signup_date,
        }));

      return json({ record, history: history ?? [], duplicates: duplicatesDetail });
    }

    // action === 'list' | 'export'
    const filters: Filters = body.filters ?? {};
    const filtered = records.filter((r) => matches(r, filters));

    const sortBy: string = body.sort_by ?? 'score';
    const sortDir: string = body.sort_dir ?? 'desc';
    filtered.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortBy];
      const bv = (b as unknown as Record<string, unknown>)[sortBy];
      const an = typeof av === 'number' ? av : String(av ?? '');
      const bn = typeof bv === 'number' ? bv : String(bv ?? '');
      const cmp = an < bn ? -1 : an > bn ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    if (action === 'export') {
      return json({ total: filtered.length, records: filtered });
    }

    const page = Math.max(1, Number(body.page ?? 1));
    const pageSize = Math.min(200, Math.max(10, Number(body.page_size ?? 50)));
    const start = (page - 1) * pageSize;

    return json({
      total: filtered.length,
      page,
      page_size: pageSize,
      records: filtered.slice(start, start + pageSize),
    });
  } catch (e) {
    console.error('[admin-crm] error', e);
    return json({ error: e instanceof Error ? e.message : 'Erreur inconnue' }, 500);
  }
});
