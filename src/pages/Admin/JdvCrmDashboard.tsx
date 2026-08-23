import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExportButton } from '@/components/admin/ExportButton';
import { CrmUserSheet } from '@/components/admin/crm/CrmUserSheet';
import { CRM_EXPORT_COLUMNS } from '@/components/admin/crm/crmExportColumns';
import { CrmSegmentAuditPanel } from '@/components/admin/crm/CrmSegmentAuditPanel';
import { exportToCSV, type ExportColumn } from '@/utils/exportUtils';
import { CsvExportPreviewDialog } from '@/components/admin/CsvExportPreviewDialog';


import {
  ACTIVITY_LEVELS, BLOCKERS, DUPLICATE_STATUSES, JOURNEY_STEPS, KPI_DEFINITIONS,
  REACTIVATION_STATUSES, fetchCrmExport,
  useCrmList, useCrmStats,
  type ActivityLevel, type Blocker, type CrmFilters, type JourneyStep,
} from '@/hooks/useJdvCrm';
import { toast } from 'sonner';
import {
  AlertTriangle, Cake, CheckCircle2, ChevronDown, Copy, Gift, Search, Share2,
  SlidersHorizontal, UserX, Users, XCircle,
} from 'lucide-react';


const ALL = '__all__';
const PAGE_SIZE = 50;

const PRIORITY_STYLES: Record<string, string> = {
  'TRÈS HAUTE': 'bg-destructive text-destructive-foreground',
  'HAUTE': 'bg-primary text-primary-foreground',
  'MOYENNE': 'bg-accent text-accent-foreground',
  'BASSE': 'bg-muted text-muted-foreground',
  'À ANALYSER': 'bg-secondary text-secondary-foreground',
};

export default function JdvCrmDashboard() {
  const [filters, setFilters] = useState<CrmFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();


  const { data: stats, isLoading: statsLoading, error: statsError } = useCrmStats();
  const { data: list, isLoading: listLoading } = useCrmList(filters, page, PAGE_SIZE);


  const update = (patch: Partial<CrmFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
    setActiveKpi(null);
  };


  const countries = useMemo(() => Object.keys(stats?.by_country ?? {}).sort(), [stats]);
  const segmentDefs = stats?.segment_defs ?? {};

  /** Description lisible des filtres actifs, écrite en tête du CSV. */
  const describeFilters = (f: CrmFilters): string => {
    const parts: string[] = [];
    if (f.search) parts.push(`Recherche = ${f.search}`);
    if (f.country) parts.push(`Pays = ${f.country}`);
    if (f.city) parts.push(`Ville = ${f.city}`);
    if (f.segment) parts.push(`Segment = ${f.segment}${segmentDefs[f.segment]?.label ? ` (${segmentDefs[f.segment].label})` : ''}`);
    if (f.priority) parts.push(`Priorité = ${f.priority}`);
    if (typeof f.score_min === 'number') parts.push(`Score ≥ ${f.score_min}`);
    if (typeof f.score_max === 'number') parts.push(`Score ≤ ${f.score_max}`);
    if (typeof f.has_page === 'boolean') parts.push(`Page créée = ${f.has_page ? 'Oui' : 'Non'}`);
    if (typeof f.has_fund === 'boolean') parts.push(`Cagnotte créée = ${f.has_fund ? 'Oui' : 'Non'}`);
    if (typeof f.has_shared === 'boolean') parts.push(`Page partagée = ${f.has_shared ? 'Oui' : 'Non'}`);
    if (f.activity) parts.push(`Activité = ${f.activity === 'active' ? 'Actifs ≤ 30 j' : 'Inactifs > 30 j'}`);
    if (f.activity_level) parts.push(`Niveau d'activité = ${f.activity_level}`);
    if (f.journey_step) parts.push(`Étape du parcours = ${f.journey_step}`);
    if (f.blocker) parts.push(`Blocage principal = ${f.blocker}`);
    if (f.statut_reactivation) parts.push(`Statut de réactivation = ${f.statut_reactivation}`);
    if (f.statut_doublon) parts.push(`Statut de doublon = ${f.statut_doublon}`);
    if (f.duplicates_only) parts.push('Doublons potentiels uniquement');
    if (f.signup_from) parts.push(`Inscrit à partir du ${f.signup_from}`);
    if (f.signup_to) parts.push(`Inscrit jusqu'au ${f.signup_to}`);
    if (typeof f.birthday_within_days === 'number') parts.push(`Anniversaire dans ≤ ${f.birthday_within_days} jours`);
    return parts.length ? parts.join(' | ') : 'Aucun filtre — toutes les fiches';
  };

  const slugify = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase();

  const exportFilenameBase = (f: CrmFilters): string => {
    const bits = [
      f.segment,
      f.activity_level,
      f.activity === 'active' ? 'actifs' : f.activity === 'inactive' ? 'inactifs' : undefined,
      f.priority,
      f.country,
      f.blocker,
    ].filter(Boolean) as string[];
    return ['jdv_crm', ...bits.map(slugify)].join('_');
  };

  /** Aperçu avant export : on charge les données, puis on affiche les colonnes. */
  const handleExport = async () => {
    try {
      const res = await fetchCrmExport(filters);
      if (res.records.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }
      setPreview({
        kind: 'crm',
        title: 'Export JDV CRM — Segmentation comportementale',
        filtersLabel: describeFilters(filters),
        rows: res.records,
        columns: CRM_EXPORT_COLUMNS as ExportColumn<any>[],
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'export");
    }
  };

  const COHERENCE_COLUMNS: ExportColumn<any>[] = [
    { key: 'test', header: 'CONTRÔLE — Test' },
    { key: 'controle', header: 'CONTRÔLE — Libellé' },
    { key: 'resultat', header: 'CONTRÔLE — Résultat' },
    { key: 'detail', header: 'CONTRÔLE — Détail' },
  ];

  const handleExportCoherence = () => {
    if (!stats) return;
    const rows = stats.coherence_report.tests.map((t) => ({
      test: t.id,
      controle: t.label,
      resultat: t.passed ? 'Conforme' : 'Anomalie',
      detail: t.detail,
    }));
    setPreview({
      kind: 'coherence',
      title: 'Export JDV CRM — Contrôle de cohérence T1→T12',
      filtersLabel: `Fiches analysées : ${stats.coherence_report.records_analyzed}`,
      rows,
      columns: COHERENCE_COLUMNS,
    });
  };

  /** Téléchargement réel, déclenché depuis l'aperçu. */
  const confirmExport = () => {
    if (!preview) return;
    if (preview.kind === 'crm') {
      exportToCSV(preview.rows, preview.columns, exportFilenameBase(filters), {
        title: preview.title,
        filters: preview.filtersLabel,
      });
      toast.success(`${preview.rows.length} fiches exportées`);
    } else {
      exportToCSV(preview.rows, preview.columns, 'jdv_crm_coherence', {
        title: preview.title,
        extra: { 'Fiches analysées': stats?.coherence_report.records_analyzed ?? 0 },
      });
      toast.success('Rapport de cohérence exporté');
    }
    setPreview(null);
  };




  const totalPages = Math.max(1, Math.ceil((list?.total ?? 0) / PAGE_SIZE));

  const KPI_ICONS: Record<string, typeof Users> = {
    total: Users,
    birthday_soon: Cake,
    no_page: UserX,
    page_no_fund: Gift,
    fund_not_shared: Share2,
    inactive: AlertTriangle,
    duplicates: Copy,
  };

  /** Une carte = un filtre : cliquer applique exactement le filtre qui a produit le chiffre. */
  const applyKpi = (kpi: (typeof KPI_DEFINITIONS)[number]) => {
    setFilters(kpi.key === 'total' ? {} : { ...kpi.filters });
    setSearchInput('');
    setPage(1);
    setActiveKpi(kpi.key);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v !== undefined && v !== null && v !== '',
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <header>
          <h1 className="text-lg font-semibold md:text-title-main">JDV_CRM — Comportement des utilisateurs</h1>
          <p className="text-xs text-muted-foreground md:text-secondary">
            Fiches individuelles, segmentation comportementale et priorités de réactivation.
            Ce module lit les données existantes : il ne modifie jamais les comptes utilisateurs.
          </p>
        </header>

        {statsError && (
          <Card className="border-destructive/40">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Impossible de charger les données CRM : {statsError instanceof Error ? statsError.message : 'erreur inconnue'}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-7">
          {KPI_DEFINITIONS.map((kpi) => {
            const Icon = KPI_ICONS[kpi.key] ?? Users;
            const value = stats?.kpis?.[kpi.key] ?? 0;
            const isActive = activeKpi === kpi.key;
            return (
              <Card
                key={kpi.key}
                role="button"
                tabIndex={0}
                onClick={() => applyKpi(kpi)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && applyKpi(kpi)}
                className={`cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'}`}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
                    <span className="text-[11px] leading-tight md:text-xs">{kpi.label}</span>
                  </div>
                  {statsLoading ? (
                    <Skeleton className="mt-2 h-7 w-16" />
                  ) : statsError ? (
                    <p className="mt-1 text-xl font-semibold text-muted-foreground md:text-2xl">—</p>
                  ) : (
                    <p className="mt-1 text-xl font-semibold md:text-2xl">{value.toLocaleString('fr-FR')}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>


        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Niveau d’activité (définition unique)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ACTIVITY_LEVELS.map((level) => {
                const count = stats?.activity_levels?.[level] ?? 0;
                const isActive = filters.activity_level === level;
                return (
                  <button
                    key={level}
                    onClick={() => { update({ activity_level: isActive ? undefined : level, activity: undefined }); setActiveKpi(null); }}
                    className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors sm:block ${isActive ? 'border-primary bg-primary/10' : 'hover:bg-accent/40'}`}
                  >
                    <p className="text-xs text-muted-foreground">{level}</p>
                    <p className="text-lg font-semibold">{count.toLocaleString('fr-FR')}</p>
                  </button>
                );
              })}

              <p className="col-span-full text-xs text-muted-foreground">
                Activité mesurée uniquement sur des signaux réels : dernière connexion et sessions.
                La date d’inscription n’est jamais utilisée comme activité.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parcours de conversion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(stats?.funnel ?? []).map((step) => {
                const total = stats?.total ?? 0;
                const pct = total > 0 ? Math.round((step.count / total) * 100) : 0;
                return (
                  <div key={step.label}>
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="min-w-0 flex-1 text-muted-foreground">{step.label}</span>
                      <span className="shrink-0 text-right font-medium tabular-nums">{step.count.toLocaleString('fr-FR')} · {pct}%</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full rounded-full bg-muted md:h-2">
                      <div className="h-2.5 rounded-full bg-primary md:h-2" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                );
              })}
              {!stats && <Skeleton className="h-24 w-full" />}
            </CardContent>
          </Card>
        </div>


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Segmentation comportementale</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(segmentDefs).map(([code, def]) => {
              const count = stats?.segments?.[code] ?? 0;
              const isActive = filters.segment === code;
              return (
                <button
                  key={code}
                  onClick={() => update({ segment: isActive ? undefined : code })}
                  className={`min-h-[44px] rounded-lg border p-3 text-left transition-colors ${
                    isActive ? 'border-primary bg-primary/10' : 'hover:bg-accent/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-medium">{code}</span>
                    <Badge className={`${PRIORITY_STYLES[def.priority] ?? ''} text-[10px]`}>{def.priority}</Badge>
                  </div>
                  <p className="text-xs leading-tight text-muted-foreground">{def.label}</p>
                  <p className="mt-1 text-xl font-semibold">{count.toLocaleString('fr-FR')}</p>
                </button>

              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-start gap-2 pb-3 sm:flex-row sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex flex-wrap items-center gap-2 text-sm md:text-base">
                <span>Contrôle de cohérence (T1 → T12)</span>
                {stats && (
                  <Badge
                    variant={stats.coherence_report.failed_count === 0 ? 'secondary' : 'destructive'}
                  >
                    {stats.coherence_report.status}
                  </Badge>
                )}
              </CardTitle>
              {stats && (
                <p className="mt-1 text-xs leading-tight text-muted-foreground">
                  Exécuté automatiquement après chargement — {stats.coherence_report.passed_count}/
                  {stats.coherence_report.tests.length} contrôles conformes ·{' '}
                  {stats.coherence_report.records_analyzed.toLocaleString('fr-FR')} fiches analysées ·{' '}
                  {new Date(stats.coherence_report.generated_at).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
            {stats && <ExportButton onExportCSV={handleExportCoherence} />}
          </CardHeader>
          <CardContent className="space-y-1">
            {!stats && <Skeleton className="h-24 w-full" />}
            {stats && (
              <div
                className={`mb-3 rounded-lg border p-3 text-xs md:text-sm ${
                  stats.coherence_report.failed_count === 0
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-destructive/40 bg-destructive/5'
                }`}
              >
                {stats.coherence_report.summary}
              </div>
            )}
            {stats?.coherence.map((t) => (
              <div key={t.id} className="flex items-start gap-2 border-b py-1.5 text-sm last:border-0 md:border-0 md:py-0">
                {t.passed
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                <div className="min-w-0 flex-1 md:flex md:items-start md:gap-2">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{t.id}</span>
                  <span className="block flex-1 text-xs md:text-sm">{t.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground md:mt-0 md:text-right">{t.detail}</span>
                </div>
              </div>
            ))}

          </CardContent>
        </Card>

        <CrmSegmentAuditPanel report={stats?.segment_audit} />

        <Card>
          <CardHeader className="flex flex-col items-stretch gap-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm md:text-base">Filtres</CardTitle>
            <ExportButton onExportCSV={handleExport} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Recherche (nom, téléphone, email, CRM ID)</Label>
              <div className="flex gap-2">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && update({ search: searchInput || undefined })}
                  placeholder="Rechercher…"
                />
                <Button variant="outline" size="icon" onClick={() => update({ search: searchInput || undefined })}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Collapsible open={!isMobile || filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between md:hidden">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtres avancés
                    {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">


            <div>
              <Label className="text-xs">Pays</Label>
              <Select value={filters.country ?? ALL} onValueChange={(v) => update({ country: v === ALL ? undefined : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les pays</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Priorité</Label>
              <Select value={filters.priority ?? ALL} onValueChange={(v) => update({ priority: v === ALL ? undefined : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toutes</SelectItem>
                  {Object.keys(PRIORITY_STYLES).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Niveau d’activité</Label>
              <Select
                value={filters.activity_level ?? ALL}
                onValueChange={(v) => update({ activity_level: v === ALL ? undefined : (v as ActivityLevel), activity: undefined })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {ACTIVITY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Étape du parcours</Label>
              <Select
                value={filters.journey_step ?? ALL}
                onValueChange={(v) => update({ journey_step: v === ALL ? undefined : (v as JourneyStep) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toutes</SelectItem>
                  {JOURNEY_STEPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Blocage principal</Label>
              <Select
                value={filters.blocker ?? ALL}
                onValueChange={(v) => update({ blocker: v === ALL ? undefined : (v as Blocker) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {BLOCKERS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label className="text-xs">Statut de réactivation</Label>
              <Select
                value={filters.statut_reactivation ?? ALL}
                onValueChange={(v) => update({ statut_reactivation: v === ALL ? undefined : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {REACTIVATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Statut de doublon</Label>
              <Select
                value={filters.statut_doublon ?? ALL}
                onValueChange={(v) => update({ statut_doublon: v === ALL ? undefined : v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {DUPLICATE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Anniversaire dans (jours)</Label>
              <Input
                type="number"
                min={0}
                value={filters.birthday_within_days ?? ''}
                onChange={(e) => update({ birthday_within_days: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="ex. 30"
              />
            </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setFilters({}); setSearchInput(''); setPage(1); setActiveKpi(null); }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm md:text-base">
              Fiches utilisateurs {list ? `(${list.total.toLocaleString('fr-FR')})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            {listLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <>
                {/* Mobile : une carte par fiche */}
                <div className="space-y-2 md:hidden">
                  {(list?.records ?? []).map((r) => (
                    <button
                      key={r.user_id}
                      onClick={() => setSelectedUser(r.user_id)}
                      className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {[r.first_name, r.last_name].filter(Boolean).join(' ') || 'Sans nom'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.phone ?? r.email ?? 'Non disponible'}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {r.crm_id ?? '—'} · {r.country_code ?? '—'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-semibold leading-none">{r.score}</p>
                          <p className="text-[10px] text-muted-foreground">score</p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{r.segment}</Badge>
                        <Badge className={`${PRIORITY_STYLES[r.priority] ?? ''} text-[10px]`}>{r.priority}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{r.niveau_activite}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{r.segment_label}</p>

                      <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
                        {[
                          { l: 'Anniv.', v: r.days_to_birthday !== null ? `J-${r.days_to_birthday}` : '—' },
                          { l: 'Page', v: r.has_birthday_page || r.has_event_page ? 'Oui' : 'Non' },
                          { l: 'Cagnotte', v: r.has_fund ? 'Oui' : 'Non' },
                          { l: 'Partage', v: r.has_shared ? 'Oui' : 'Non' },
                        ].map((item) => (
                          <div key={item.l} className="rounded-md bg-muted/50 py-1">
                            <p className="text-muted-foreground">{item.l}</p>
                            <p className="font-medium">{item.v}</p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
                        <span className="font-medium text-foreground">Blocage :</span> {r.blocage_principal} ·{' '}
                        <span className="font-medium text-foreground">Statut :</span> {r.statut_reactivation}
                      </p>
                    </button>
                  ))}
                  {(list?.records ?? []).length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Aucun utilisateur ne correspond aux filtres.
                    </p>
                  )}
                </div>

                {/* Desktop : tableau complet */}
                <div className="hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CRM ID</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Pays</TableHead>
                        <TableHead>Segment</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead>Anniv.</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Cagnotte</TableHead>
                        <TableHead>Partage</TableHead>
                        <TableHead>Activité</TableHead>
                        <TableHead>Blocage</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(list?.records ?? []).map((r) => (
                        <TableRow
                          key={r.user_id}
                          className="cursor-pointer"
                          onClick={() => setSelectedUser(r.user_id)}
                        >
                          <TableCell className="font-mono text-xs">{r.crm_id ?? '—'}</TableCell>
                          <TableCell>
                            <div className="font-medium">{[r.first_name, r.last_name].filter(Boolean).join(' ') || 'Sans nom'}</div>
                            <div className="text-xs text-muted-foreground">{r.phone ?? r.email ?? 'Non disponible'}</div>
                          </TableCell>
                          <TableCell>{r.country_code ?? '—'}</TableCell>
                          <TableCell>
                            <span className="text-xs font-medium">{r.segment}</span>
                            <div className="text-xs text-muted-foreground">{r.segment_label}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORITY_STYLES[r.priority] ?? ''}>{r.priority}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{r.score}</TableCell>
                          <TableCell>{r.days_to_birthday !== null ? `J-${r.days_to_birthday}` : '—'}</TableCell>
                          <TableCell>{r.has_birthday_page || r.has_event_page ? 'Oui' : 'Non'}</TableCell>
                          <TableCell>{r.has_fund ? 'Oui' : 'Non'}</TableCell>
                          <TableCell>{r.has_shared ? 'Oui' : 'Non'}</TableCell>
                          <TableCell className="text-xs">
                            {r.niveau_activite}
                            <div className="text-muted-foreground">
                              {r.jours_depuis_derniere_activite !== null ? `J+${r.jours_depuis_derniere_activite}` : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{r.blocage_principal}</TableCell>
                          <TableCell className="text-xs">{r.statut_reactivation}</TableCell>
                        </TableRow>
                      ))}
                      {(list?.records ?? []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
                            Aucun utilisateur ne correspond aux filtres.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Précédent
                </Button>
                <span className="order-first text-sm text-muted-foreground sm:order-none">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Suivant
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      <CrmUserSheet userId={selectedUser} onClose={() => setSelectedUser(null)} />
    </AdminLayout>
  );
}
