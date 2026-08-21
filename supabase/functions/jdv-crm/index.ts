import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Logique CRM partagée : segmentation, scoring, priorité, prochaine action.
// Aucune donnée n'est inventée : un indicateur absent en base reste `null`.

export interface CrmOverviewRow {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  country_code: string | null;
  city: string | null;
  signup_date: string;
  birthday: string | null;
  is_suspended: boolean | null;
  is_deleted: boolean | null;
  onboarding_completed: boolean | null;
  onboarding_furthest_step: number | null;
  last_sign_in_at: string | null;
  birthday_page_slug: string | null;
  birthday_page_created_at: string | null;
  birthday_page_published_at: string | null;
  birthday_page_active: boolean | null;
  event_page_slug: string | null;
  event_page_occasion: string | null;
  event_page_date: string | null;
  event_page_created_at: string | null;
  event_page_active: boolean | null;
  funds_count: number;
  active_funds_count: number;
  first_fund_created_at: string | null;
  total_collected: number;
  contributions_count: number;
  shares_count: number;
  last_share_at: string | null;
  share_channels: string[] | null;
  onboarding_shares_count: number;
  messages_received: number;
  page_photo_views: number;
  sessions_count: number;
  last_session_at: string | null;
  last_activity_at: string | null;
}

export interface ScoringRule {
  rule_key: string;
  label: string;
  points: number;
  is_active: boolean;
}

export type Priority = 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'BASSE' | 'À ANALYSER';

export const SEGMENTS: Record<string, { code: string; label: string; priority: Priority; next_action: string }> = {
  S1: { code: 'S1', label: 'Anniversaire proche', priority: 'TRÈS HAUTE', next_action: 'Créer une cagnotte avant l’anniversaire' },
  S2: { code: 'S2', label: 'Page créée sans cagnotte', priority: 'TRÈS HAUTE', next_action: 'Créer une cagnotte' },
  S3: { code: 'S3', label: 'Cagnotte créée mais non partagée', priority: 'HAUTE', next_action: 'Partager la page' },
  S4: { code: 'S4', label: 'Inscrit sans page', priority: 'HAUTE', next_action: 'Créer une page anniversaire' },
  S5: { code: 'S5', label: 'Utilisateur inactif', priority: 'MOYENNE', next_action: 'Réactiver l’utilisateur' },
  S6: { code: 'S6', label: 'Actif sans cagnotte', priority: 'HAUTE', next_action: 'Créer une cagnotte' },
  S7: { code: 'S7', label: 'Utilisateur actif', priority: 'BASSE', next_action: 'Ne pas contacter pour le moment' },
  S8: { code: 'S8', label: 'Données insuffisantes', priority: 'À ANALYSER', next_action: 'Vérifier les informations' },
};

export const REACTIVATION_STATUSES = [
  'Non traité', 'À contacter', 'Contacté', 'A répondu', 'Intéressé',
  'A créé une page', 'A créé une cagnotte', 'A partagé', 'Converti',
  'Ne souhaite pas être contacté', 'À revoir',
];

export const DUPLICATE_STATUSES = ['Unique', 'Doublon probable', 'Doublon confirmé', 'À vérifier'];

const DAY = 86400000;

export function daysUntilNextBirthday(birthday: string | null, now: Date): { next: string | null; days: number | null } {
  if (!birthday) return { next: null, days: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthday);
  if (!m) return { next: null, days: null };
  const month = Number(m[2]);
  const day = Number(m[3]);
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let year = now.getUTCFullYear();
  let next = Date.UTC(year, month - 1, day);
  if (next < todayUTC) {
    year += 1;
    next = Date.UTC(year, month - 1, day);
  }
  const days = Math.round((next - todayUTC) / DAY);
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { next: iso, days };
}

function daysSince(dateStr: string | null, now: Date): number | null {
  if (!dateStr) return null;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / DAY);
}

export interface CrmComputed {
  crm_id: string | null;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  country_code: string | null;
  city: string | null;
  signup_date: string;
  birthday: string | null;
  next_birthday: string | null;
  days_to_birthday: number | null;
  has_birthday_page: boolean;
  has_event_page: boolean;
  page_url: string | null;
  page_status: string | null;
  birthday_page_created_at: string | null;
  event_page_occasion: string | null;
  event_page_date: string | null;
  account_active: boolean;
  last_sign_in_at: string | null;
  last_activity_at: string | null;
  days_since_activity: number | null;
  page_published: boolean;
  page_views: number | null;
  has_fund: boolean;
  first_fund_created_at: string | null;
  fund_active: boolean;
  funds_count: number;
  contributions_count: number;
  total_collected: number;
  has_shared: boolean;
  last_share_at: string | null;
  shares_count: number;
  share_channels: string[] | null;
  sessions_count: number;
  messages_received: number;
  onboarding_furthest_step: number | null;
  onboarding_completed: boolean | null;
  segment: string;
  segment_label: string;
  priority: Priority;
  next_action: string;
  score: number;
  score_details: { key: string; label: string; points: number }[];
  statut_reactivation: string;
  statut_doublon: string;
  admin_notes: string | null;
  last_contacted_at: string | null;
}

export function computeCrmRecord(
  row: CrmOverviewRow,
  crm: { crm_id?: string | null; statut_reactivation?: string; statut_doublon?: string; admin_notes?: string | null; last_contacted_at?: string | null } | undefined,
  rules: ScoringRule[],
  appOrigin: string,
  now: Date = new Date(),
): CrmComputed {
  const { next, days } = daysUntilNextBirthday(row.birthday, now);

  const hasBirthdayPage = !!row.birthday_page_slug;
  const hasEventPage = !!row.event_page_slug;
  const hasPage = hasBirthdayPage || hasEventPage;
  const hasFund = (row.funds_count ?? 0) > 0;
  const hasShared = (row.shares_count ?? 0) > 0 || (row.onboarding_shares_count ?? 0) > 0;

  const daysSinceActivity = daysSince(row.last_activity_at, now);
  const recentActivity = daysSinceActivity !== null && daysSinceActivity <= 30;

  // Données insuffisantes : aucun signal exploitable
  const insufficient =
    !row.birthday && !hasPage && !hasFund && !hasShared &&
    (row.sessions_count ?? 0) === 0 && !row.last_sign_in_at;

  let segment = 'S8';
  if (!insufficient) {
    if (row.birthday && days !== null && days <= 30 && !hasFund) segment = 'S1';
    else if (hasPage && !hasFund) segment = 'S2';
    else if (hasFund && !hasShared) segment = 'S3';
    else if (!hasPage) segment = recentActivity ? 'S6' : 'S4';
    else if (!recentActivity) segment = 'S5';
    else if (!hasFund) segment = 'S6';
    else segment = 'S7';
  }

  const def = SEGMENTS[segment];

  // Score : pondérations lues en base, plafonnées 0..100
  const active = new Map(rules.filter((r) => r.is_active).map((r) => [r.rule_key, r]));
  const details: { key: string; label: string; points: number }[] = [];
  const apply = (key: string, condition: boolean) => {
    const r = active.get(key);
    if (r && condition) details.push({ key, label: r.label, points: r.points });
  };

  apply('birthday_soon', !!row.birthday && days !== null && days <= 30);
  apply('page_created', hasPage);
  apply('recent_activity', recentActivity);
  apply('fund_created', hasFund);
  apply('page_shared', hasShared);
  apply('recent_interaction', (row.messages_received ?? 0) > 0 || (row.contributions_count ?? 0) > 0);
  apply('inactive_30', daysSinceActivity !== null && daysSinceActivity > 30 && daysSinceActivity <= 90);
  apply('inactive_90', daysSinceActivity !== null && daysSinceActivity > 90);

  const raw = details.reduce((sum, d) => sum + d.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  const slug = row.birthday_page_slug ?? row.event_page_slug;
  const pageUrl = slug
    ? `${appOrigin}/${row.birthday_page_slug ? 'birthday' : 'event'}/${slug}`
    : null;
  const pageActive = hasBirthdayPage ? row.birthday_page_active : hasEventPage ? row.event_page_active : null;

  return {
    crm_id: crm?.crm_id ?? null,
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone,
    email: row.email,
    country_code: row.country_code,
    city: row.city,
    signup_date: row.signup_date,
    birthday: row.birthday,
    next_birthday: next,
    days_to_birthday: days,
    has_birthday_page: hasBirthdayPage,
    has_event_page: hasEventPage,
    page_url: pageUrl,
    page_status: hasPage ? (pageActive ? 'Active' : 'Inactive') : null,
    birthday_page_created_at: row.birthday_page_created_at ?? row.event_page_created_at,
    event_page_occasion: row.event_page_occasion,
    event_page_date: row.event_page_date,
    account_active: !row.is_suspended && !row.is_deleted,
    last_sign_in_at: row.last_sign_in_at,
    last_activity_at: row.last_activity_at,
    days_since_activity: daysSinceActivity,
    page_published: !!row.birthday_page_published_at,
    page_views: hasPage ? (row.page_photo_views ?? 0) : null,
    has_fund: hasFund,
    first_fund_created_at: row.first_fund_created_at,
    fund_active: (row.active_funds_count ?? 0) > 0,
    funds_count: row.funds_count ?? 0,
    contributions_count: row.contributions_count ?? 0,
    total_collected: Number(row.total_collected ?? 0),
    has_shared: hasShared,
    last_share_at: row.last_share_at,
    shares_count: (row.shares_count ?? 0) + (row.onboarding_shares_count ?? 0),
    share_channels: row.share_channels,
    sessions_count: row.sessions_count ?? 0,
    messages_received: row.messages_received ?? 0,
    onboarding_furthest_step: row.onboarding_furthest_step,
    onboarding_completed: row.onboarding_completed,
    segment,
    segment_label: def.label,
    priority: def.priority,
    next_action: def.next_action,
    score,
    score_details: details,
    statut_reactivation: crm?.statut_reactivation ?? 'Non traité',
    statut_doublon: crm?.statut_doublon ?? 'Unique',
    admin_notes: crm?.admin_notes ?? null,
    last_contacted_at: crm?.last_contacted_at ?? null,
  };
}

export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return digits.slice(-8);
}

/** Détection en lecture seule des doublons potentiels (téléphone, email, nom+prénom). */
export function detectDuplicateGroups(records: CrmComputed[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>();
  const push = (key: string, id: string) => {
    const arr = buckets.get(key) ?? [];
    arr.push(id);
    buckets.set(key, arr);
  };

  for (const r of records) {
    const p = normalizePhone(r.phone);
    if (p) push(`phone:${p}`, r.user_id);
    if (r.email) push(`email:${r.email.trim().toLowerCase()}`, r.user_id);
    const name = `${(r.first_name ?? '').trim().toLowerCase()} ${(r.last_name ?? '').trim().toLowerCase()}`.trim();
    if (name.length > 3) push(`name:${name}`, r.user_id);
  }

  const matches = new Map<string, string[]>();
  for (const [, ids] of buckets) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      const others = ids.filter((x) => x !== id);
      const existing = matches.get(id) ?? [];
      matches.set(id, Array.from(new Set([...existing, ...others])));
    }
  }
  return matches;
}



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
