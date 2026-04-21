import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { ExportButton } from '@/components/admin/ExportButton';
import { exportToCSV, ExportColumn } from '@/utils/exportUtils';
import { Search, MessageCircle, Eye, RefreshCw, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const STEP_LABELS: Record<number, string> = {
  1: 'Anniversaire',
  2: 'Goûts',
  3: 'Souhaits',
  4: 'Amis',
  5: 'Page & Cagnotte',
  6: 'Partages',
};

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
  furthest_step: number;
  current_step: number;
  blocking_step: number | null;
  favorites_count: number;
  friends_count: number;
  shares_count: number;
  has_birthday_page: boolean;
  has_birthday_fund: boolean;
}

interface ApiResponse {
  users: OnboardingUser[];
  stats: { total: number; completed: number; byStep: Record<number, number> };
}

const fetchProgress = async (): Promise<ApiResponse> => {
  const { data, error } = await supabase.functions.invoke('admin-onboarding-progress');
  if (error) throw error;
  return data as ApiResponse;
};

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

export default function OnboardingProgressDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const stepFilter = searchParams.get('step') || 'all';
  const countryFilter = searchParams.get('country') || 'all';
  const statusFilter = searchParams.get('status') || 'all';

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === 'all' || !v) next.delete(k);
    else next.set(k, v);
    setSearchParams(next);
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-onboarding-progress'],
    queryFn: fetchProgress,
    staleTime: 5 * 60_000,
  });

  const users = data?.users || [];
  const stats = data?.stats || { total: 0, completed: 0, byStep: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } };

  const inProgress = stats.total - stats.completed;
  const abandoned = useMemo(
    () => users.filter((u) => !u.onboarding_completed && daysSince(u.created_at) > 7).length,
    [users],
  );

  const countries = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.country_code && set.add(u.country_code));
    return Array.from(set).sort();
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter === 'completed' && !u.onboarding_completed) return false;
      if (statusFilter === 'in_progress' && u.onboarding_completed) return false;
      if (statusFilter === 'abandoned' && (u.onboarding_completed || daysSince(u.created_at) <= 7)) return false;
      if (stepFilter !== 'all') {
        const stepNum = parseInt(stepFilter, 10);
        if ((u.blocking_step ?? 6) !== stepNum) return false;
      }
      if (countryFilter !== 'all' && u.country_code !== countryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${u.first_name || ''} ${u.last_name || ''} ${u.display_name || ''}`.toLowerCase();
        if (!name.includes(q) && !(u.phone || '').includes(q) && !(u.email || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [users, search, stepFilter, countryFilter, statusFilter]);

  const handleRelance = (u: OnboardingUser) => {
    if (!u.phone) {
      toast.error('Pas de téléphone disponible');
      return;
    }
    const step = u.blocking_step || 1;
    const msg = encodeURIComponent(
      `Bonjour ! Continuez votre inscription Joie de Vivre — étape « ${STEP_LABELS[step]} » à compléter 🎁 https://joiedevivre-africa.com/auth`,
    );
    window.open(`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const handleExport = () => {
    const cols: ExportColumn<OnboardingUser>[] = [
      { key: 'display_name', header: 'Nom', format: (v, r) => v || `${r.first_name || ''} ${r.last_name || ''}`.trim() },
      { key: 'phone', header: 'Téléphone' },
      { key: 'email', header: 'Email' },
      { key: 'city', header: 'Ville' },
      { key: 'country_code', header: 'Pays' },
      { key: 'created_at', header: 'Inscription', format: (v) => new Date(v as string).toLocaleDateString('fr-FR') },
      { key: 'blocking_step', header: 'Bloqué étape', format: (v) => (v ? `${v} - ${STEP_LABELS[v as number]}` : 'Terminé') },
      { key: 'furthest_step', header: 'Étape atteinte' },
    ];
    exportToCSV(filtered, cols, 'onboarding-progress');
    toast.success(`${filtered.length} utilisateur(s) exportés`);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Progression Onboarding"
          description="Voir où chaque utilisateur s'est arrêté dans le parcours d'inscription"
          backPath="/admin"
          showCountryIndicator={false}
          actions={
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className={`cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setParam('status', 'all')}>
            <CardContent className="pt-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer ${statusFilter === 'completed' ? 'ring-2 ring-primary' : ''}`} onClick={() => setParam('status', 'completed')}>
            <CardContent className="pt-4 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Terminés</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer ${statusFilter === 'in_progress' ? 'ring-2 ring-primary' : ''}`} onClick={() => setParam('status', 'in_progress')}>
            <CardContent className="pt-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">{inProgress}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer ${statusFilter === 'abandoned' ? 'ring-2 ring-primary' : ''}`} onClick={() => setParam('status', 'abandoned')}>
            <CardContent className="pt-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-2xl font-bold">{abandoned}</p>
              <p className="text-xs text-muted-foreground">Abandonnés (&gt;7j)</p>
            </CardContent>
          </Card>
        </div>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entonnoir des étapes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((step) => {
              const count = stats.byStep[step] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const blockedHere = users.filter((u) => u.blocking_step === step).length;
              const isActive = stepFilter === String(step);
              return (
                <div
                  key={step}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setParam('step', isActive ? 'all' : String(step))}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      Étape {step} — {STEP_LABELS[step]}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{count} atteints ({pct}%)</span>
                      {blockedHere > 0 && step < 6 && (
                        <Badge variant="destructive" className="text-xs">
                          {blockedHere} bloqués
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher nom, téléphone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={stepFilter} onValueChange={(v) => setParam('step', v)}>
                <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Étape bloquante" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les étapes</SelectItem>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <SelectItem key={s} value={String(s)}>Bloqués étape {s} - {STEP_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={(v) => setParam('country', v)}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Pays" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ExportButton onExportCSV={handleExport} disabled={filtered.length === 0} />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Pays / Ville</TableHead>
                      <TableHead>Inscrit</TableHead>
                      <TableHead>Étape atteinte</TableHead>
                      <TableHead>Bloquant</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((u) => {
                        const name = u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Sans nom';
                        return (
                          <TableRow key={u.user_id}>
                            <TableCell className="font-medium">{name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {u.phone && <div>📞 {u.phone}</div>}
                              {u.email && <div className="truncate max-w-[180px]">✉️ {u.email}</div>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {u.country_code || '—'}{u.city ? ` / ${u.city}` : ''}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(u.created_at)}
                              <div>({daysSince(u.created_at)}j)</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {u.furthest_step}/6 — {STEP_LABELS[u.furthest_step] || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.onboarding_completed ? (
                                <Badge variant="secondary" className="bg-success/10 text-success">
                                  ✓ Terminé
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  Étape {u.blocking_step} : {STEP_LABELS[u.blocking_step!]}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {u.phone && !u.onboarding_completed && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRelance(u)}
                                    title="Relancer WhatsApp"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => navigate(`/admin/users?search=${encodeURIComponent(u.phone || name)}`)}
                                  title="Voir profil"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
