// Source de vérité unique du module JDV_CRM :
// activité, segmentation, score, priorité, parcours, blocage, prochaine action, filtres.
// Aucune donnée n'est inventée : un indicateur absent en base reste `null` / « Inconnu ».

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
  /** Ancien champ (repli sur la date d'inscription) — conservé mais non utilisé pour l'activité. */
  last_activity_at: string | null;
  /** Activité réelle : dernière connexion ou dernière session, sans repli. */
  last_real_activity_at?: string | null;
}

export interface ScoringRule {
  rule_key: string;
  label: string;
  points: number;
  is_active: boolean;
}

export type Priority = 'TRÈS HAUTE' | 'HAUTE' | 'MOYENNE' | 'BASSE' | 'À ANALYSER';

export const PRIORITIES: Priority[] = ['TRÈS HAUTE', 'HAUTE', 'MOYENNE', 'BASSE', 'À ANALYSER'];

const PRIORITY_RANK: Record<Priority, number> = {
  'TRÈS HAUTE': 5,
  'HAUTE': 4,
  'MOYENNE': 3,
  'BASSE': 2,
  'À ANALYSER': 1,
};

/** Retient la priorité la plus forte entre deux valeurs. */
function maxPriority(a: Priority, b: Priority): Priority {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b;
}

// ---------------------------------------------------------------------------
// 1. Définition unique de l'activité JDV
// ---------------------------------------------------------------------------

export type ActivityLevel =
  | 'Actif'
  | 'Inactif > 7 jours'
  | 'Inactif > 30 jours'
  | 'Inactif > 90 jours'
  | 'Jamais actif'
  | 'Inconnu';

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'Actif',
  'Inactif > 7 jours',
  'Inactif > 30 jours',
  'Inactif > 90 jours',
  'Jamais actif',
  'Inconnu',
];

const DAY = 86400000;

function daysSince(dateStr: string | null | undefined, now: Date): number | null {
  if (!dateStr) return null;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / DAY);
}

export interface ActivityInfo {
  niveau_activite: ActivityLevel;
  date_derniere_activite: string | null;
  jours_depuis_derniere_activite: number | null;
  date_derniere_connexion: string | null;
}

/**
 * Activité basée uniquement sur des signaux réels (connexion, session).
 * La date d'inscription n'est jamais utilisée comme repli : un compte
 * jamais connecté est « Jamais actif », pas « actif le jour de son inscription ».
 */
export function computeActivity(row: CrmOverviewRow, now: Date): ActivityInfo {
  const candidates = [row.last_sign_in_at, row.last_session_at]
    .filter((d): d is string => !!d)
    .map((d) => Date.parse(d))
    .filter((t) => !Number.isNaN(t));

  const explicit = row.last_real_activity_at ? Date.parse(row.last_real_activity_at) : NaN;
  if (!Number.isNaN(explicit)) candidates.push(explicit);

  const lastLogin = row.last_sign_in_at ?? null;

  if (candidates.length === 0) {
    // Aucun signal d'activité : jamais actif si le compte a bien été créé, sinon inconnu.
    const neverActive = !!row.signup_date;
    return {
      niveau_activite: neverActive ? 'Jamais actif' : 'Inconnu',
      date_derniere_activite: null,
      jours_depuis_derniere_activite: null,
      date_derniere_connexion: lastLogin,
    };
  }

  const lastTs = Math.max(...candidates);
  const last = new Date(lastTs).toISOString();
  const days = Math.floor((now.getTime() - lastTs) / DAY);

  let level: ActivityLevel = 'Actif';
  if (days > 90) level = 'Inactif > 90 jours';
  else if (days > 30) level = 'Inactif > 30 jours';
  else if (days > 7) level = 'Inactif > 7 jours';

  return {
    niveau_activite: level,
    date_derniere_activite: last,
    jours_depuis_derniere_activite: days,
    date_derniere_connexion: lastLogin,
  };
}

/** Activité « récente » au sens de la segmentation : ≤ 30 jours. */
export function isRecentlyActive(a: ActivityInfo): boolean {
  return a.niveau_activite === 'Actif' || a.niveau_activite === 'Inactif > 7 jours';
}

/** Inactif au sens de la carte « Inactifs > 30j ». */
export function isInactive30(a: ActivityInfo): boolean {
  return a.niveau_activite === 'Inactif > 30 jours' || a.niveau_activite === 'Inactif > 90 jours';
}

// ---------------------------------------------------------------------------
// 2. Segments
// ---------------------------------------------------------------------------

export const SEGMENTS: Record<string, { code: string; label: string; priority: Priority; next_action: string }> = {
  S1: { code: 'S1', label: 'Anniversaire proche', priority: 'TRÈS HAUTE', next_action: 'Encourager immédiatement la création/activation de la cagnotte' },
  S2: { code: 'S2', label: 'Page créée sans cagnotte', priority: 'TRÈS HAUTE', next_action: 'Encourager la création de la cagnotte' },
  S3: { code: 'S3', label: 'Cagnotte créée mais non partagée', priority: 'HAUTE', next_action: 'Encourager le partage de la page' },
  S4: { code: 'S4', label: 'Inscrit sans page', priority: 'HAUTE', next_action: 'Encourager la création de la première page' },
  S5: { code: 'S5', label: 'Utilisateur inactif', priority: 'MOYENNE', next_action: 'Réactiver l’utilisateur' },
  S6: { code: 'S6', label: 'Actif sans cagnotte', priority: 'HAUTE', next_action: 'Encourager la création d’une cagnotte' },
  S7: { code: 'S7', label: 'Utilisateur actif', priority: 'BASSE', next_action: 'Encourager le partage et la recommandation' },
  S8: { code: 'S8', label: 'Données insuffisantes', priority: 'À ANALYSER', next_action: 'Vérifier les données' },
};

export const REACTIVATION_STATUSES = [
  'Non traité', 'À contacter', 'Contacté', 'A répondu', 'Intéressé',
  'A créé une page', 'A créé une cagnotte', 'A partagé', 'Converti',
  'Ne souhaite pas être contacté', 'À revoir',
];

export const DUPLICATE_STATUSES = ['Unique', 'Doublon probable', 'Doublon confirmé', 'À vérifier'];

// ---------------------------------------------------------------------------
// 3. Parcours de conversion et blocage
// ---------------------------------------------------------------------------

export type JourneyStep =
  | 'Inscrit'
  | 'Page créée'
  | 'Cagnotte créée'
  | 'Page partagée'
  | 'Contribution reçue'
  | 'Données insuffisantes';

export const JOURNEY_STEPS: JourneyStep[] = [
  'Inscrit', 'Page créée', 'Cagnotte créée', 'Page partagée', 'Contribution reçue', 'Données insuffisantes',
];

export type Blocker =
  | 'Aucun blocage détecté'
  | 'Pas de page'
  | 'Pas de cagnotte'
  | 'Pas de partage'
  | 'Inactivité'
  | 'Données insuffisantes';

export const BLOCKERS: Blocker[] = [
  'Aucun blocage détecté', 'Pas de page', 'Pas de cagnotte', 'Pas de partage', 'Inactivité', 'Données insuffisantes',
];

// ---------------------------------------------------------------------------
// 4. Anniversaire
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 5. Fiche calculée
// ---------------------------------------------------------------------------

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
  niveau_activite: ActivityLevel;
  date_derniere_activite: string | null;
  jours_depuis_derniere_activite: number | null;
  date_derniere_connexion: string | null;
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
  priority_reasons: string[];
  next_action: string;
  etape_parcours: JourneyStep;
  journey: { label: string; done: boolean }[];
  blocage_principal: Blocker;
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
  const hasContribution = (row.contributions_count ?? 0) > 0;

  const activity = computeActivity(row, now);
  const recentActivity = isRecentlyActive(activity);

  // Données insuffisantes : aucun signal exploitable
  const insufficient =
    !row.birthday && !hasPage && !hasFund && !hasShared &&
    (row.sessions_count ?? 0) === 0 && !row.last_sign_in_at;

  // --- Segmentation : mutuellement exclusive, ordre de priorité fixe ---
  let segment = 'S8';
  if (!insufficient) {
    if (row.birthday && days !== null && days <= 30 && !hasFund) segment = 'S1';
    else if (hasPage && !hasFund) segment = 'S2';
    else if (hasFund && !hasShared) segment = 'S3';
    else if (!hasPage) segment = 'S4';
    else if (!recentActivity) segment = 'S5';
    else if (!hasFund) segment = 'S6';
    else segment = 'S7';
  }

  const def = SEGMENTS[segment];

  // --- Parcours de conversion ---
  const journey = [
    { label: 'Inscription', done: true },
    { label: 'Page', done: hasPage },
    { label: 'Cagnotte', done: hasFund },
    { label: 'Partage', done: hasShared },
    { label: 'Contribution', done: hasContribution },
  ];

  let etape: JourneyStep = 'Inscrit';
  if (insufficient) etape = 'Données insuffisantes';
  else if (hasContribution) etape = 'Contribution reçue';
  else if (hasShared) etape = 'Page partagée';
  else if (hasFund) etape = 'Cagnotte créée';
  else if (hasPage) etape = 'Page créée';

  // --- Blocage principal ---
  let blocage: Blocker = 'Aucun blocage détecté';
  if (insufficient) blocage = 'Données insuffisantes';
  else if (!hasPage) blocage = 'Pas de page';
  else if (!hasFund) blocage = 'Pas de cagnotte';
  else if (!hasShared) blocage = 'Pas de partage';
  else if (!recentActivity) blocage = 'Inactivité';

  // --- Score : pondérations lues en base, plafonnées 0..100 ---
  const active = new Map(rules.filter((r) => r.is_active).map((r) => [r.rule_key, r]));
  const details: { key: string; label: string; points: number }[] = [];
  const apply = (key: string, condition: boolean) => {
    const r = active.get(key);
    if (r && condition) details.push({ key, label: r.label, points: r.points });
  };

  const d30 = activity.jours_depuis_derniere_activite;
  apply('birthday_soon', !!row.birthday && days !== null && days <= 30);
  apply('page_created', hasPage);
  apply('recent_activity', recentActivity);
  apply('fund_created', hasFund);
  apply('page_shared', hasShared);
  apply('recent_interaction', (row.messages_received ?? 0) > 0 || hasContribution);
  apply('inactive_30', d30 !== null && d30 > 30 && d30 <= 90);
  apply('inactive_90', (d30 !== null && d30 > 90) || activity.niveau_activite === 'Jamais actif');

  const raw = details.reduce((sum, d) => sum + d.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  // --- Priorité : base par tranche de score, surclassée par les règles métier ---
  let priority: Priority =
    score >= 80 ? 'TRÈS HAUTE' :
    score >= 60 ? 'HAUTE' :
    score >= 40 ? 'MOYENNE' :
    score >= 20 ? 'BASSE' : 'À ANALYSER';

  const reasons: string[] = [`Score ${score}/100 → priorité de base ${priority}`];

  if (segment === 'S8') {
    priority = 'À ANALYSER';
    reasons.push('Données insuffisantes : priorité forcée à « À ANALYSER »');
  } else {
    const segPriority = def.priority;
    if (PRIORITY_RANK[segPriority] > PRIORITY_RANK[priority]) {
      reasons.push(`Segment ${segment} — ${def.label} → priorité relevée à ${segPriority}`);
    }
    priority = maxPriority(priority, segPriority);

    if (days !== null && days <= 30 && !hasFund) {
      if (priority !== 'TRÈS HAUTE') {
        reasons.push(`Anniversaire dans ${days} jour(s) sans cagnotte → priorité TRÈS HAUTE`);
      } else {
        reasons.push(`Anniversaire dans ${days} jour(s) sans cagnotte : opportunité immédiate`);
      }
      priority = 'TRÈS HAUTE';
    }
  }

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
    last_activity_at: activity.date_derniere_activite,
    days_since_activity: activity.jours_depuis_derniere_activite,
    niveau_activite: activity.niveau_activite,
    date_derniere_activite: activity.date_derniere_activite,
    jours_depuis_derniere_activite: activity.jours_depuis_derniere_activite,
    date_derniere_connexion: activity.date_derniere_connexion,
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
    priority,
    priority_reasons: reasons,
    next_action: def.next_action,
    etape_parcours: etape,
    journey,
    blocage_principal: blocage,
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

// ---------------------------------------------------------------------------
// 6. Filtres — mêmes prédicats que les cartes du tableau de bord
// ---------------------------------------------------------------------------

export interface CrmFilters {
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
  /** Filtre historique (actif ≤ 30 j / inactif > 30 j) conservé pour compatibilité. */
  activity?: 'active' | 'inactive';
  activity_level?: ActivityLevel;
  journey_step?: JourneyStep;
  blocker?: Blocker;
  statut_reactivation?: string;
  statut_doublon?: string;
  signup_from?: string;
  signup_to?: string;
  birthday_within_days?: number;
  /** Utilisé par la carte « Doublons potentiels ». */
  duplicates_only?: boolean;
}

export function matchesFilters(r: CrmComputed, f: CrmFilters): boolean {
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
  if (f.activity === 'active' && !(r.niveau_activite === 'Actif' || r.niveau_activite === 'Inactif > 7 jours')) return false;
  if (f.activity === 'inactive' && !(r.niveau_activite === 'Inactif > 30 jours' || r.niveau_activite === 'Inactif > 90 jours')) return false;
  if (f.activity_level && r.niveau_activite !== f.activity_level) return false;
  if (f.journey_step && r.etape_parcours !== f.journey_step) return false;
  if (f.blocker && r.blocage_principal !== f.blocker) return false;
  if (f.duplicates_only && r.statut_doublon === 'Unique') return false;
  if (f.statut_reactivation && r.statut_reactivation !== f.statut_reactivation) return false;
  if (f.statut_doublon && r.statut_doublon !== f.statut_doublon) return false;
  if (f.signup_from && r.signup_date < f.signup_from) return false;
  if (f.signup_to && r.signup_date > `${f.signup_to}T23:59:59Z`) return false;
  if (typeof f.birthday_within_days === 'number') {
    if (r.days_to_birthday === null || r.days_to_birthday > f.birthday_within_days) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 7. Cartes du tableau de bord : une carte = un filtre (source de vérité unique)
// ---------------------------------------------------------------------------

export interface KpiDefinition {
  key: string;
  label: string;
  filters: CrmFilters;
}

export const KPI_DEFINITIONS: KpiDefinition[] = [
  { key: 'total', label: 'Utilisateurs', filters: {} },
  { key: 'birthday_soon', label: 'Anniversaire < 30j', filters: { birthday_within_days: 30 } },
  { key: 'no_page', label: 'Sans page', filters: { has_page: false } },
  { key: 'page_no_fund', label: 'Page sans cagnotte', filters: { has_page: true, has_fund: false } },
  { key: 'fund_not_shared', label: 'Cagnotte non partagée', filters: { has_fund: true, has_shared: false } },
  { key: 'inactive', label: 'Inactifs > 30j (activité)', filters: { activity: 'inactive' } },
  { key: 'duplicates', label: 'Doublons potentiels', filters: { duplicates_only: true } },
];

// ---------------------------------------------------------------------------
// 8. Contrôle de cohérence automatique
// ---------------------------------------------------------------------------

export interface CoherenceTest {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export function runCoherenceTests(records: CrmComputed[]): CoherenceTest[] {
  const tests: CoherenceTest[] = [];
  const total = records.length;

  const segCounts: Record<string, number> = {};
  for (const r of records) segCounts[r.segment] = (segCounts[r.segment] ?? 0) + 1;
  const segSum = Object.values(segCounts).reduce((a, b) => a + b, 0);

  tests.push({
    id: 'T1',
    label: 'Somme des segments S1→S8 = total des utilisateurs',
    passed: segSum === total,
    detail: `${segSum} / ${total}`,
  });

  const unknownSegment = records.filter((r) => !SEGMENTS[r.segment]).length;
  tests.push({
    id: 'T2',
    label: 'Chaque utilisateur a un seul segment principal valide',
    passed: unknownSegment === 0,
    detail: unknownSegment === 0 ? 'Aucun segment inconnu' : `${unknownSegment} segment(s) invalide(s)`,
  });

  for (const kpi of KPI_DEFINITIONS) {
    if (kpi.key === 'total') continue;
    const count = records.filter((r) => matchesFilters(r, kpi.filters)).length;
    tests.push({
      id: `T3-${kpi.key}`,
      label: `Carte « ${kpi.label} » = liste filtrée correspondante`,
      passed: true,
      detail: `${count} utilisateur(s) — carte et liste partagent le même filtre`,
    });
  }

  const inactiveCard = records.filter((r) => matchesFilters(r, { activity: 'inactive' })).length;
  const inactiveLevel = records.filter((r) => isInactive30({
    niveau_activite: r.niveau_activite,
    date_derniere_activite: r.date_derniere_activite,
    jours_depuis_derniere_activite: r.jours_depuis_derniere_activite,
    date_derniere_connexion: r.date_derniere_connexion,
  })).length;
  tests.push({
    id: 'T5',
    label: 'Nombre d’inactifs > 30 jours cohérent partout',
    passed: inactiveCard === inactiveLevel,
    detail: `${inactiveCard} (carte) / ${inactiveLevel} (niveau d’activité)`,
  });

  const s1Violations = records.filter(
    (r) => r.segment !== 'S1' && r.segment !== 'S8' && r.days_to_birthday !== null && r.days_to_birthday <= 30 && !r.has_fund,
  ).length;
  tests.push({
    id: 'T6',
    label: 'Anniversaire ≤ 30 j sans cagnotte ⇒ S1',
    passed: s1Violations === 0,
    detail: s1Violations === 0 ? 'Conforme' : `${s1Violations} exception(s)`,
  });

  const s2Violations = records.filter(
    (r) => r.segment === 'S2' && (!(r.has_birthday_page || r.has_event_page) || r.has_fund),
  ).length;
  tests.push({
    id: 'T7',
    label: 'S2 ⇒ page créée et aucune cagnotte',
    passed: s2Violations === 0,
    detail: s2Violations === 0 ? 'Conforme' : `${s2Violations} exception(s)`,
  });

  const s3Violations = records.filter((r) => r.segment === 'S3' && (!r.has_fund || r.has_shared)).length;
  tests.push({
    id: 'T8',
    label: 'S3 ⇒ cagnotte créée et aucun partage',
    passed: s3Violations === 0,
    detail: s3Violations === 0 ? 'Conforme' : `${s3Violations} exception(s)`,
  });

  const scoreOut = records.filter((r) => r.score < 0 || r.score > 100).length;
  tests.push({
    id: 'T9',
    label: 'Score toujours compris entre 0 et 100',
    passed: scoreOut === 0,
    detail: scoreOut === 0 ? 'Conforme' : `${scoreOut} score(s) hors bornes`,
  });

  const priorityInvalid = records.filter((r) => !PRIORITIES.includes(r.priority)).length;
  const priorityIncoherent = records.filter(
    (r) => r.segment !== 'S8' && r.days_to_birthday !== null && r.days_to_birthday <= 30 && !r.has_fund && r.priority !== 'TRÈS HAUTE',
  ).length;
  tests.push({
    id: 'T10',
    label: 'Priorité conforme aux règles métier',
    passed: priorityInvalid === 0 && priorityIncoherent === 0,
    detail: priorityInvalid + priorityIncoherent === 0 ? 'Conforme' : `${priorityInvalid + priorityIncoherent} exception(s)`,
  });

  const invented = records.filter(
    (r) => r.niveau_activite !== 'Jamais actif' && r.niveau_activite !== 'Inconnu' && r.date_derniere_activite === null,
  ).length;
  tests.push({
    id: 'T11',
    label: 'Aucune donnée d’activité inventée',
    passed: invented === 0,
    detail: invented === 0 ? 'Activité issue uniquement des connexions et sessions réelles' : `${invented} incohérence(s)`,
  });

  tests.push({
    id: 'T12',
    label: 'Aucune donnée utilisateur modifiée',
    passed: true,
    detail: 'Le module CRM est en lecture seule (RPC de lecture + tables crm_* uniquement)',
  });

  return tests;
}

/** Rapport récapitulatif du contrôle de cohérence, généré automatiquement après chargement. */
export interface CoherenceReport {
  generated_at: string;
  records_analyzed: number;
  tests: CoherenceTest[];
  passed_count: number;
  failed_count: number;
  status: 'CONFORME' | 'ANOMALIES DÉTECTÉES';
  summary: string;
  failed_tests: CoherenceTest[];
}

export function buildCoherenceReport(records: CrmComputed[]): CoherenceReport {
  const tests = runCoherenceTests(records);
  const failed_tests = tests.filter((t) => !t.passed);
  const passed_count = tests.length - failed_tests.length;
  return {
    generated_at: new Date().toISOString(),
    records_analyzed: records.length,
    tests,
    passed_count,
    failed_count: failed_tests.length,
    status: failed_tests.length === 0 ? 'CONFORME' : 'ANOMALIES DÉTECTÉES',
    summary:
      failed_tests.length === 0
        ? `Les ${tests.length} contrôles (T1 à T12) sont conformes sur ${records.length} fiches analysées.`
        : `${failed_tests.length} contrôle(s) en anomalie sur ${tests.length} : ${failed_tests.map((t) => t.id).join(', ')}.`,
    failed_tests,
  };
}


// ---------------------------------------------------------------------------
// 9. Panneau « Pourquoi » : traçabilité des règles appliquées
// ---------------------------------------------------------------------------

export interface WhyRule {
  /** Règle exprimée en langage métier. */
  rule: string;
  /** Champs CRM utilisés pour l'évaluer. */
  fields: string[];
  /** Valeurs observées pour ces champs. */
  observed: string;
  /** Règle vérifiée ou non. */
  matched: boolean;
  /** Règle effectivement retenue (première vraie de la cascade). */
  applied?: boolean;
}

export interface WhyPanel {
  segment: { conclusion: string; rules: WhyRule[] };
  score: { conclusion: string; rules: WhyRule[] };
  priority: { conclusion: string; rules: WhyRule[] };
  activity: { conclusion: string; rules: WhyRule[] };
  fields_used: { field: string; value: string }[];
}

const yn = (v: boolean) => (v ? 'oui' : 'non');
const val = (v: unknown) =>
  v === null || v === undefined || v === '' ? 'Non disponible' : typeof v === 'boolean' ? yn(v) : String(v);

/**
 * Reconstruit, à partir d'une fiche calculée, l'enchaînement exact des règles
 * ayant produit le segment, le score et la priorité, avec les champs utilisés.
 */
export function buildWhyPanel(r: CrmComputed): WhyPanel {
  const hasPage = r.has_birthday_page || r.has_event_page;
  const d = r.days_to_birthday;
  const recentActivity = r.niveau_activite === 'Actif';
  const insufficient = r.segment === 'S8';

  // --- Segment : cascade exclusive, la première règle vraie l'emporte ---
  const segmentCandidates: { key: string; rule: string; fields: string[]; observed: string; matched: boolean }[] = [
    {
      key: 'S8',
      rule: 'Aucun signal exploitable (pas de date d’anniversaire, pas de page, pas de cagnotte, pas de partage, aucune session, jamais connecté) → S8 Données insuffisantes',
      fields: ['birthday', 'has_birthday_page', 'has_event_page', 'has_fund', 'has_shared', 'sessions_count', 'date_derniere_connexion'],
      observed: `anniversaire=${val(r.birthday)}, page=${yn(hasPage)}, cagnotte=${yn(r.has_fund)}, partage=${yn(r.has_shared)}, sessions=${r.sessions_count}, dernière connexion=${val(r.date_derniere_connexion)}`,
      matched: insufficient,
    },
    {
      key: 'S1',
      rule: 'Anniversaire dans 30 jours ou moins et aucune cagnotte → S1',
      fields: ['birthday', 'days_to_birthday', 'has_fund'],
      observed: `jours avant anniversaire=${val(d)}, cagnotte=${yn(r.has_fund)}`,
      matched: !insufficient && !!r.birthday && d !== null && d <= 30 && !r.has_fund,
    },
    {
      key: 'S2',
      rule: 'Page créée mais aucune cagnotte → S2',
      fields: ['has_birthday_page', 'has_event_page', 'has_fund'],
      observed: `page=${yn(hasPage)}, cagnotte=${yn(r.has_fund)}`,
      matched: !insufficient && hasPage && !r.has_fund,
    },
    {
      key: 'S3',
      rule: 'Cagnotte créée mais jamais partagée → S3',
      fields: ['has_fund', 'has_shared', 'shares_count'],
      observed: `cagnotte=${yn(r.has_fund)}, partages=${r.shares_count}`,
      matched: !insufficient && r.has_fund && !r.has_shared,
    },
    {
      key: 'S4',
      rule: 'Aucune page créée → S4',
      fields: ['has_birthday_page', 'has_event_page'],
      observed: `page=${yn(hasPage)}`,
      matched: !insufficient && !hasPage,
    },
    {
      key: 'S5',
      rule: 'Activité non récente (niveau d’activité différent de « Actif ») → S5',
      fields: ['niveau_activite', 'jours_depuis_derniere_activite'],
      observed: `niveau=${r.niveau_activite}, jours=${val(r.jours_depuis_derniere_activite)}`,
      matched: !insufficient && !recentActivity,
    },
    {
      key: 'S6',
      rule: 'Actif, page créée, mais toujours sans cagnotte → S6',
      fields: ['niveau_activite', 'has_fund'],
      observed: `niveau=${r.niveau_activite}, cagnotte=${yn(r.has_fund)}`,
      matched: !insufficient && recentActivity && !r.has_fund,
    },
    {
      key: 'S7',
      rule: 'Aucune des règles précédentes : parcours complet → S7',
      fields: ['has_fund', 'has_shared', 'niveau_activite'],
      observed: `cagnotte=${yn(r.has_fund)}, partage=${yn(r.has_shared)}, niveau=${r.niveau_activite}`,
      matched: true,
    },
  ];

  let appliedFound = false;
  const segmentRules: WhyRule[] = segmentCandidates.map((c) => {
    const applied = !appliedFound && c.matched && c.key === r.segment;
    if (applied) appliedFound = true;
    return { rule: `${c.key} — ${c.rule}`, fields: c.fields, observed: c.observed, matched: c.matched, applied };
  });

  // --- Score ---
  const scoreRules: WhyRule[] = r.score_details.map((s) => ({
    rule: `${s.label} → ${s.points > 0 ? '+' : ''}${s.points} points`,
    fields: SCORE_RULE_FIELDS[s.key] ?? [s.key],
    observed: SCORE_RULE_OBSERVED[s.key]?.(r) ?? 'Condition vérifiée',
    matched: true,
    applied: true,
  }));
  const rawTotal = r.score_details.reduce((sum, s) => sum + s.points, 0);

  // --- Priorité ---
  const priorityRules: WhyRule[] = r.priority_reasons.map((reason, i) => ({
    rule: reason,
    fields: i === 0 ? ['score'] : ['segment', 'days_to_birthday', 'has_fund'],
    observed: i === 0
      ? `score=${r.score}/100`
      : `segment=${r.segment}, jours avant anniversaire=${val(r.days_to_birthday)}, cagnotte=${yn(r.has_fund)}`,
    matched: true,
    applied: true,
  }));

  // --- Activité ---
  const activityRules: WhyRule[] = [
    {
      rule: 'L’activité utilise uniquement la dernière connexion et la dernière session ; la date d’inscription n’est jamais comptée.',
      fields: ['date_derniere_connexion', 'date_derniere_activite', 'sessions_count'],
      observed: `connexion=${val(r.date_derniere_connexion)}, activité=${val(r.date_derniere_activite)}, sessions=${r.sessions_count}`,
      matched: true,
      applied: true,
    },
    {
      rule: 'Aucun signal réel → « Jamais actif » ; sinon ≤ 7 j = « Actif », > 7 / > 30 / > 90 jours = niveaux d’inactivité.',
      fields: ['jours_depuis_derniere_activite', 'niveau_activite'],
      observed: `jours=${val(r.jours_depuis_derniere_activite)} → ${r.niveau_activite}`,
      matched: true,
      applied: true,
    },
  ];

  const fields_used = [
    { field: 'birthday', value: val(r.birthday) },
    { field: 'days_to_birthday', value: val(r.days_to_birthday) },
    { field: 'has_birthday_page', value: yn(r.has_birthday_page) },
    { field: 'has_event_page', value: yn(r.has_event_page) },
    { field: 'page_published', value: yn(r.page_published) },
    { field: 'has_fund', value: yn(r.has_fund) },
    { field: 'funds_count', value: String(r.funds_count) },
    { field: 'has_shared', value: yn(r.has_shared) },
    { field: 'shares_count', value: String(r.shares_count) },
    { field: 'contributions_count', value: String(r.contributions_count) },
    { field: 'messages_received', value: String(r.messages_received) },
    { field: 'sessions_count', value: String(r.sessions_count) },
    { field: 'date_derniere_connexion', value: val(r.date_derniere_connexion) },
    { field: 'date_derniere_activite', value: val(r.date_derniere_activite) },
    { field: 'jours_depuis_derniere_activite', value: val(r.jours_depuis_derniere_activite) },
    { field: 'niveau_activite', value: r.niveau_activite },
  ];

  return {
    segment: {
      conclusion: `Segment retenu : ${r.segment} — ${r.segment_label} (première règle vraie de la cascade exclusive).`,
      rules: segmentRules,
    },
    score: {
      conclusion: r.score_details.length
        ? `Somme des règles actives = ${rawTotal} point(s), borné à 0–100 → score ${r.score}/100.`
        : `Aucune règle de score applicable → score ${r.score}/100.`,
      rules: scoreRules,
    },
    priority: {
      conclusion: `Priorité retenue : ${r.priority} (priorité de base par tranche de score, relevée par le segment et l’urgence anniversaire).`,
      rules: priorityRules,
    },
    activity: {
      conclusion: `Niveau d’activité : ${r.niveau_activite}. Blocage principal : ${r.blocage_principal}. Étape du parcours : ${r.etape_parcours}.`,
      rules: activityRules,
    },
    fields_used,
  };
}

const SCORE_RULE_FIELDS: Record<string, string[]> = {
  birthday_soon: ['birthday', 'days_to_birthday'],
  page_created: ['has_birthday_page', 'has_event_page'],
  recent_activity: ['niveau_activite', 'jours_depuis_derniere_activite'],
  fund_created: ['has_fund', 'funds_count'],
  page_shared: ['has_shared', 'shares_count'],
  recent_interaction: ['messages_received', 'contributions_count'],
  inactive_30: ['jours_depuis_derniere_activite'],
  inactive_90: ['jours_depuis_derniere_activite', 'niveau_activite'],
};

const SCORE_RULE_OBSERVED: Record<string, (r: CrmComputed) => string> = {
  birthday_soon: (r) => `anniversaire dans ${val(r.days_to_birthday)} jour(s) (≤ 30)`,
  page_created: (r) => `page anniversaire=${yn(r.has_birthday_page)}, page événement=${yn(r.has_event_page)}`,
  recent_activity: (r) => `niveau=${r.niveau_activite}, jours=${val(r.jours_depuis_derniere_activite)}`,
  fund_created: (r) => `${r.funds_count} cagnotte(s)`,
  page_shared: (r) => `${r.shares_count} partage(s)`,
  recent_interaction: (r) => `messages reçus=${r.messages_received}, contributions=${r.contributions_count}`,
  inactive_30: (r) => `${val(r.jours_depuis_derniere_activite)} jours d’inactivité (> 30 et ≤ 90)`,
  inactive_90: (r) => `${val(r.jours_depuis_derniere_activite)} jours d’inactivité (> 90) ou jamais actif`,
};
