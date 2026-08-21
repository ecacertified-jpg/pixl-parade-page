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
