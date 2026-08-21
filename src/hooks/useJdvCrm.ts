import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ACTIVITY_LEVELS,
  KPI_DEFINITIONS,
  SEGMENTS,
  computeCrmRecord,
  detectDuplicateGroups,
  matchesFilters,
  buildCoherenceReport,
  auditSegmentation,
  type ActivityLevel,
  type CoherenceTest,
  type CoherenceReport,
  type SegmentAuditReport,
  type CrmComputed,

  type CrmFilters as CoreFilters,
  type CrmOverviewRow,
  type Priority,
  type ScoringRule,
} from '@/lib/crmCore';

export {
  REACTIVATION_STATUSES,
  DUPLICATE_STATUSES,
  ACTIVITY_LEVELS,
  JOURNEY_STEPS,
  BLOCKERS,
  KPI_DEFINITIONS,
  PRIORITIES,
} from '@/lib/crmCore';
export type { ActivityLevel, JourneyStep, Blocker, CoherenceTest, CoherenceReport, KpiDefinition, SegmentAuditRow, SegmentAuditReport } from '@/lib/crmCore';


export type CrmPriority = Priority;
export type CrmRecord = CrmComputed;
export type CrmFilters = CoreFilters;
export type CrmScoreDetail = { key: string; label: string; points: number };

const APP_ORIGIN = 'https://joiedevivre-africa.com';

export interface CrmHistoryEntry {
  id: string;
  user_id: string;
  occurred_at: string;
  canal: string | null;
  campagne: string | null;
  message: string | null;
  statut: string | null;
  reponse: string | null;
  action_suivante: string | null;
  resultat: string | null;
  created_at: string;
}

export interface CrmStats {
  total: number;
  by_country: Record<string, number>;
  duplicates: number;
  birthday_soon: number;
  no_page: number;
  page_no_fund: number;
  fund_not_shared: number;
  inactive: number;
  very_high_priority: number;
  to_contact: number;
  converted: number;
  segments: Record<string, number>;
  segment_defs: typeof SEGMENTS;
  /** Compteur par carte, calculé avec exactement le même filtre que la liste. */
  kpis: Record<string, number>;
  /** Répartition par niveau d'activité (définition unique). */
  activity_levels: Record<ActivityLevel, number>;
  /** Parcours de conversion : nombre d'utilisateurs ayant franchi chaque étape. */
  funnel: { label: string; count: number }[];
  coherence: CoherenceTest[];
  /** Rapport récapitulatif du contrôle de cohérence (exécuté automatiquement). */
  coherence_report: CoherenceReport;
  /** Audit de cohérence des segments S1→S8 (lecture seule, exécuté automatiquement). */
  segment_audit: SegmentAuditReport;

}


const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/** Charge et calcule l'ensemble des fiches CRM (lecture seule, via RPC sécurisée admin). */
function useCrmDataset() {
  return useQuery({
    queryKey: ['crm', 'dataset'],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const [overviewRes, rulesRes] = await Promise.all([
        rpc('crm_get_overview'),
        rpc('crm_get_rules'),
      ]);
      if (overviewRes.error) throw new Error(overviewRes.error.message);
      if (rulesRes.error) throw new Error(rulesRes.error.message);

      const rows = (overviewRes.data ?? []) as (CrmOverviewRow & {
        crm_id: string | null;
        statut_reactivation: string;
        statut_doublon: string;
        admin_notes: string | null;
        last_contacted_at: string | null;
      })[];
      const rules = (rulesRes.data ?? []) as ScoringRule[];

      const now = new Date();
      const records = rows.map((r) =>
        computeCrmRecord(
          r,
          {
            crm_id: r.crm_id,
            statut_reactivation: r.statut_reactivation,
            statut_doublon: r.statut_doublon,
            admin_notes: r.admin_notes,
            last_contacted_at: r.last_contacted_at,
          },
          rules,
          APP_ORIGIN,
          now,
        ),
      );

      const duplicateGroups = detectDuplicateGroups(records);
      for (const r of records) {
        if (duplicateGroups.has(r.user_id) && r.statut_doublon === 'Unique') {
          r.statut_doublon = 'Doublon probable';
        }
      }

      // Provisionne en arrière-plan les fiches CRM manquantes (CRM ID stable).
      if (records.some((r) => !r.crm_id)) {
        try {
          void Promise.resolve(rpc('crm_provision_profiles')).catch(() => undefined);
        } catch {
          // ignore : le provisionnement ne doit jamais bloquer l'affichage
        }
      }


      return { records, duplicateGroups };
    },
  });
}

function sortRecords(records: CrmRecord[], sortBy: string, sortDir: 'asc' | 'desc') {
  return [...records].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sortBy];
    const bv = (b as unknown as Record<string, unknown>)[sortBy];
    const an = typeof av === 'number' ? av : String(av ?? '');
    const bn = typeof bv === 'number' ? bv : String(bv ?? '');
    const cmp = an < bn ? -1 : an > bn ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

export function useCrmStats() {
  const query = useCrmDataset();

  const data = useMemo<CrmStats | undefined>(() => {
    if (!query.data) return undefined;
    const records = query.data.records;

    const segments: Record<string, number> = {};
    for (const key of Object.keys(SEGMENTS)) segments[key] = 0;
    const byCountry: Record<string, number> = {};
    const activityLevels = Object.fromEntries(ACTIVITY_LEVELS.map((l) => [l, 0])) as Record<ActivityLevel, number>;
    let veryHigh = 0, toContact = 0, converted = 0;
    let stepPage = 0, stepFund = 0, stepShare = 0, stepContribution = 0;

    for (const r of records) {
      segments[r.segment] = (segments[r.segment] ?? 0) + 1;
      if (r.country_code) byCountry[r.country_code] = (byCountry[r.country_code] ?? 0) + 1;
      activityLevels[r.niveau_activite] = (activityLevels[r.niveau_activite] ?? 0) + 1;
      if (r.priority === 'TRÈS HAUTE') veryHigh++;
      if (r.statut_reactivation === 'À contacter') toContact++;
      if (r.statut_reactivation === 'Converti') converted++;
      if (r.has_birthday_page || r.has_event_page) stepPage++;
      if (r.has_fund) stepFund++;
      if (r.has_shared) stepShare++;
      if (r.contributions_count > 0) stepContribution++;
    }

    // Chaque carte utilise exactement le même prédicat que la liste filtrée.
    const kpis: Record<string, number> = {};
    for (const kpi of KPI_DEFINITIONS) {
      kpis[kpi.key] = kpi.key === 'total'
        ? records.length
        : records.filter((r) => matchesFilters(r, kpi.filters)).length;
    }

    // Contrôle de cohérence T1→T12 exécuté automatiquement après chargement des données.
    const report = buildCoherenceReport(records);

    // Audit de segmentation S1→S8 : aucune donnée modifiée, aucune correction automatique.
    const segmentAudit = auditSegmentation(records);



    return {
      total: records.length,
      by_country: byCountry,
      duplicates: kpis.duplicates ?? 0,
      birthday_soon: kpis.birthday_soon ?? 0,
      no_page: kpis.no_page ?? 0,
      page_no_fund: kpis.page_no_fund ?? 0,
      fund_not_shared: kpis.fund_not_shared ?? 0,
      inactive: kpis.inactive ?? 0,
      very_high_priority: veryHigh,
      to_contact: toContact,
      converted,
      segments,
      segment_defs: SEGMENTS,
      kpis,
      activity_levels: activityLevels,
      funnel: [
        { label: 'Inscrits', count: records.length },
        { label: 'Page créée', count: stepPage },
        { label: 'Cagnotte créée', count: stepFund },
        { label: 'Page partagée', count: stepShare },
        { label: 'Contribution reçue', count: stepContribution },
      ],
      coherence: report.tests,
      coherence_report: report,
      segment_audit: segmentAudit,

    };
  }, [query.data]);


  return { ...query, data };
}

export function useCrmList(filters: CrmFilters, page: number, pageSize = 50, sortBy = 'score') {
  const query = useCrmDataset();

  const data = useMemo(() => {
    if (!query.data) return undefined;
    const filtered = sortRecords(
      query.data.records.filter((r) => matchesFilters(r, filters)),
      sortBy,
      'desc',
    );
    const start = (Math.max(1, page) - 1) * pageSize;
    return {
      total: filtered.length,
      page,
      page_size: pageSize,
      records: filtered.slice(start, start + pageSize),
    };
  }, [query.data, filters, page, pageSize, sortBy]);

  return { ...query, data };
}

export function useCrmDetail(userId: string | null) {
  const dataset = useCrmDataset();

  return useQuery({
    queryKey: ['crm', 'detail', userId, !!dataset.data],
    enabled: !!userId && !!dataset.data,
    queryFn: async () => {
      const records = dataset.data!.records;
      const record = records.find((r) => r.user_id === userId);
      if (!record) throw new Error('Utilisateur introuvable');

      const { data, error } = await rpc('crm_get_history', { _user_id: userId });
      if (error) throw new Error(error.message);

      const dupIds = dataset.data!.duplicateGroups.get(userId!) ?? [];
      const duplicates = records
        .filter((r) => dupIds.includes(r.user_id))
        .map((r) => ({
          user_id: r.user_id, crm_id: r.crm_id, first_name: r.first_name,
          last_name: r.last_name, phone: r.phone, email: r.email, signup_date: r.signup_date,
        }));

      return {
        record,
        history: ((data ?? []) as CrmHistoryEntry[]),
        duplicates: duplicates as Partial<CrmRecord>[],
      };
    },
  });
}

export async function fetchCrmExport(filters: CrmFilters) {
  const [overviewRes, rulesRes] = await Promise.all([rpc('crm_get_overview'), rpc('crm_get_rules')]);
  if (overviewRes.error) throw new Error(overviewRes.error.message);
  const rows = (overviewRes.data ?? []) as never[];
  const rules = (rulesRes.data ?? []) as ScoringRule[];
  const now = new Date();
  const records = (rows as (CrmOverviewRow & Record<string, never>)[]).map((r) =>
    computeCrmRecord(r, r as never, rules, APP_ORIGIN, now),
  );
  const filtered = sortRecords(records.filter((r) => matchesFilters(r, filters)), 'score', 'desc');
  return { total: filtered.length, records: filtered };
}

export function useCrmMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['crm'] });

  const setStatus = useMutation({
    mutationFn: async (params: {
      user_id: string; statut_reactivation?: string; statut_doublon?: string; admin_notes?: string;
    }) => {
      const { error } = await rpc('crm_set_status', {
        _user_id: params.user_id,
        _statut_reactivation: params.statut_reactivation ?? null,
        _statut_doublon: params.statut_doublon ?? null,
        _admin_notes: params.admin_notes ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success('Fiche CRM mise à jour'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Erreur de mise à jour'),
  });

  const addHistory = useMutation({
    mutationFn: async (params: {
      user_id: string; canal?: string; campagne?: string; message?: string;
      statut?: string; reponse?: string; action_suivante?: string; resultat?: string;
    }) => {
      const { error } = await rpc('crm_add_history', {
        _user_id: params.user_id,
        _canal: params.canal ?? null,
        _campagne: params.campagne ?? null,
        _message: params.message ?? null,
        _statut: params.statut ?? null,
        _reponse: params.reponse ?? null,
        _action_suivante: params.action_suivante ?? null,
        _resultat: params.resultat ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { toast.success('Action enregistrée'); invalidate(); },
    onError: (e: Error) => toast.error(e.message || 'Erreur d’enregistrement'),
  });

  return { setStatus, addHistory };
}
