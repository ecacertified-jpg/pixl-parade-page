import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/admin/ExportButton';
import { CrmUserSheet } from '@/components/admin/crm/CrmUserSheet';
import { CRM_EXPORT_COLUMNS } from '@/components/admin/crm/crmExportColumns';
import { exportToCSV } from '@/utils/exportUtils';
import {
  DUPLICATE_STATUSES, REACTIVATION_STATUSES, fetchCrmExport,
  useCrmList, useCrmStats, type CrmFilters,
} from '@/hooks/useJdvCrm';
import { toast } from 'sonner';
import {
  AlertTriangle, Cake, Copy, Gift, Search, Share2, UserX, Users,
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

  const { data: stats, isLoading: statsLoading, error: statsError } = useCrmStats();
  const { data: list, isLoading: listLoading } = useCrmList(filters, page, PAGE_SIZE);


  const update = (patch: Partial<CrmFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const countries = useMemo(() => Object.keys(stats?.by_country ?? {}).sort(), [stats]);
  const segmentDefs = stats?.segment_defs ?? {};

  const handleExport = async () => {
    try {
      const res = await fetchCrmExport(filters);
      if (res.records.length === 0) {
        toast.error('Aucune donnée à exporter');
        return;
      }
      exportToCSV(res.records, CRM_EXPORT_COLUMNS, 'jdv_crm');
      toast.success(`${res.records.length} fiches exportées`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'export");
    }
  };

  const totalPages = Math.max(1, Math.ceil((list?.total ?? 0) / PAGE_SIZE));

  const kpis = [
    { label: 'Utilisateurs', value: stats?.total ?? 0, icon: Users },
    { label: 'Anniversaire < 30j', value: stats?.birthday_soon ?? 0, icon: Cake },
    { label: 'Sans page', value: stats?.no_page ?? 0, icon: UserX },
    { label: 'Page sans cagnotte', value: stats?.page_no_fund ?? 0, icon: Gift },
    { label: 'Cagnotte non partagée', value: stats?.fund_not_shared ?? 0, icon: Share2 },
    { label: 'Inactifs > 30j', value: stats?.inactive ?? 0, icon: AlertTriangle },
    { label: 'Doublons potentiels', value: stats?.duplicates ?? 0, icon: Copy },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-title-main">JDV_CRM — Comportement des utilisateurs</h1>
          <p className="text-secondary text-muted-foreground">
            Fiches individuelles, segmentation comportementale et priorités de réactivation.
            Ce module lit les données existantes : il ne modifie jamais les comptes utilisateurs.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="mt-2 h-7 w-16" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold">{value.toLocaleString('fr-FR')}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Segmentation comportementale</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(segmentDefs).map(([code, def]) => {
              const count = stats?.segments?.[code] ?? 0;
              const isActive = filters.segment === code;
              return (
                <button
                  key={code}
                  onClick={() => update({ segment: isActive ? undefined : code })}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    isActive ? 'border-primary bg-primary/10' : 'hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{code}</span>
                    <Badge className={PRIORITY_STYLES[def.priority] ?? ''}>{def.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{def.label}</p>
                  <p className="mt-1 text-xl font-semibold">{count.toLocaleString('fr-FR')}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
            <ExportButton onExportCSV={handleExport} />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
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
              <Label className="text-xs">Activité</Label>
              <Select
                value={filters.activity ?? ALL}
                onValueChange={(v) => update({ activity: v === ALL ? undefined : (v as 'active' | 'inactive') })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Toutes</SelectItem>
                  <SelectItem value="active">Actif (≤ 30 jours)</SelectItem>
                  <SelectItem value="inactive">Inactif (&gt; 30 jours)</SelectItem>
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
                variant="ghost"
                className="w-full"
                onClick={() => { setFilters({}); setSearchInput(''); setPage(1); }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Fiches utilisateurs {list ? `(${list.total.toLocaleString('fr-FR')})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {listLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
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
                      <TableCell className="text-xs">{r.statut_reactivation}</TableCell>
                    </TableRow>
                  ))}
                  {(list?.records ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                        Aucun utilisateur ne correspond aux filtres.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
