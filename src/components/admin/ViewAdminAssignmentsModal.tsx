import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { CountryBadge } from '@/components/CountryBadge';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { Users, Store, Loader2, FileText, Link, MousePointerClick, UserPlus, Copy, AlertTriangle, RefreshCw, Cake, Clock, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDaysUntilBirthday } from '@/lib/utils';
import { toast } from 'sonner';

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: 'Famille',
  father: 'Père',
  mother: 'Mère',
  sister: 'Sœur',
  brother: 'Frère',
  friend: 'Ami(e)',
  colleague: 'Collègue',
  spouse: 'Conjoint(e)',
  child: 'Enfant',
  other: 'Autre',
};

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country_code: string | null;
  birthday: string | null;
  city: string | null;
  bio: string | null;
  created_at: string | null;
  is_suspended: boolean | null;
}

interface BusinessDetail {
  id: string;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  created_at: string | null;
  status: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
}

interface UserAssignment {
  id: string;
  user_id: string;
  created_at: string;
  assigned_via?: string | null;
  profile?: UserProfile;
  relationship?: string | null;
}

interface BusinessAssignment {
  id: string;
  business_account_id: string;
  created_at: string;
  assigned_via?: string | null;
  business?: BusinessDetail;
}

interface ShareCodeInfo {
  code: string;
  clicks_count: number;
  signups_count: number;
  assignments_count: number;
}

interface ViewAdminAssignmentsModalProps {
  adminId: string | null;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function calculateProfileCompletion(p?: UserProfile | null) {
  if (!p) return { percentage: 0, details: [] as { label: string; done: boolean }[] };
  const fields = [
    { label: 'Prénom', done: !!p.first_name, weight: 15 },
    { label: 'Nom', done: !!p.last_name, weight: 15 },
    { label: 'Téléphone', done: !!p.phone, weight: 15 },
    { label: 'Ville', done: !!p.city, weight: 15 },
    { label: 'Anniversaire', done: !!p.birthday, weight: 15 },
    { label: 'Photo', done: !!p.avatar_url, weight: 15 },
    { label: 'Bio', done: !!p.bio, weight: 10 },
  ];
  const percentage = fields.reduce((sum, f) => sum + (f.done ? f.weight : 0), 0);
  return { percentage, details: fields };
}

function getStatusBadge(status: string | null, isActive: boolean | null, isVerified: boolean | null) {
  if (status === 'rejected') return <Badge variant="destructive">Rejeté</Badge>;
  if (!isActive) return <Badge variant="outline" className="text-muted-foreground">Inactif</Badge>;
  if (isVerified) return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">Vérifié</Badge>;
  if (status === 'pending') return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">En attente</Badge>;
  return <Badge variant="secondary">Actif</Badge>;
}

const getInitials = (first?: string | null, last?: string | null) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

const COMPLETION_FILTERS = [null, 15, 30, 45, 60, 75, 100] as const;

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [];
  pages.push(1);
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function ViewAdminAssignmentsModal({ adminId, adminName, open, onOpenChange }: ViewAdminAssignmentsModalProps) {
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [businessAssignments, setBusinessAssignments] = useState<BusinessAssignment[]>([]);
  const [shareCode, setShareCode] = useState<ShareCodeInfo | null>(null);
  const [aggregatedStats, setAggregatedStats] = useState({ total_clicks: 0, total_signups: 0, total_assignments: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessProfileModalOpen, setBusinessProfileModalOpen] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [completionFilter, setCompletionFilter] = useState<number | null>(null);
  const [birthdayStats, setBirthdayStats] = useState<{ via_link: { today: number; week: number; month: number }; manual: { today: number; week: number; month: number }; total: { today: number; week: number; month: number } } | null>(null);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (open && adminId) {
      setUserPage(1);
      setCompletionFilter(null);
      loadAssignments(adminId, 1);
      loadShareCodes(adminId);
    }
    if (!open) {
      setUserAssignments([]);
      setBusinessAssignments([]);
      setShareCode(null);
      setAggregatedStats({ total_clicks: 0, total_signups: 0, total_assignments: 0 });
      setTotalUsers(0);
      setLoadError(false);
      setRetryCount(0);
    }
  }, [open, adminId]);

  useEffect(() => {
    if (open && adminId && userPage > 1) {
      loadAssignments(adminId, userPage);
    }
  }, [userPage]);

  const loadShareCodes = async (aid: string) => {
    try {
      const { data } = await supabase
        .from('admin_share_codes')
        .select('code, clicks_count, signups_count, assignments_count')
        .eq('admin_user_id', aid);

      if (data && data.length > 0) {
        const active = data[0];
        setShareCode(active);
        const stats = data.reduce(
          (acc, row) => ({
            total_clicks: acc.total_clicks + (row.clicks_count || 0),
            total_signups: acc.total_signups + (row.signups_count || 0),
            total_assignments: acc.total_assignments + (row.assignments_count || 0),
          }),
          { total_clicks: 0, total_signups: 0, total_assignments: 0 }
        );
        setAggregatedStats(stats);
      }
    } catch (e) {
      console.error('Error loading share codes:', e);
    }
  };

  const loadAssignments = async (aid: string, page = 1, currentRetry = 0) => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const baseUrl = `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/admin-manage-assignments`;
      const res = await fetch(`${baseUrl}?admin_id=${aid}&page=${page}&page_size=${PAGE_SIZE}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
        },
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setUserAssignments(data.user_assignments || []);
      setBusinessAssignments(data.business_assignments || []);
      setTotalUsers(data.total_users ?? (data.user_assignments || []).length);
      if (data.birthday_stats) setBirthdayStats(data.birthday_stats);
      setRetryCount(0);
    } catch (error) {
      console.error('Error loading assignments:', error);
      if (currentRetry < MAX_RETRIES) {
        const delay = Math.pow(2, currentRetry) * 1000;
        setRetryCount(currentRetry + 1);
        setTimeout(() => loadAssignments(aid, page, currentRetry + 1), delay);
        return;
      }
      setLoadError(true);
      setRetryCount(0);
      toast.error('Impossible de charger les affectations après plusieurs tentatives');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRetry = () => {
    if (!adminId) return;
    setLoadError(false);
    setRetryCount(0);
    loadAssignments(adminId, userPage, 0);
  };

  const filteredUserAssignments = completionFilter !== null
    ? userAssignments.filter(a => {
        const { percentage } = calculateProfileCompletion(a.profile);
        return percentage === completionFilter;
      })
    : userAssignments;

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Affectations de {adminName}</DialogTitle>
            <DialogDescription>
              Liste en lecture seule des utilisateurs et entreprises assignés à cet administrateur.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Chargement des affectations...</p>
                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">Tentative {retryCount}/{MAX_RETRIES}...</p>
                )}
              </div>
              <Progress className="w-48 h-1.5" />
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Impossible de charger les affectations</p>
                <p className="text-xs text-muted-foreground">Vérifiez votre connexion et réessayez.</p>
              </div>
              <Button variant="outline" onClick={handleManualRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Share Link Section */}
              {shareCode && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Link className="h-4 w-4 text-primary" />
                      Lien de partage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <p className="text-xs font-mono break-all flex-1">
                        https://joiedevivre-africa.com/join/{shareCode.code}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://joiedevivre-africa.com/join/${shareCode.code}`);
                          toast.success('Lien copié !');
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-secondary/30 rounded-lg">
                        <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{aggregatedStats.total_clicks}</p>
                        <p className="text-xs text-muted-foreground">Clics</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/30 rounded-lg">
                        <UserPlus className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{aggregatedStats.total_signups}</p>
                        <p className="text-xs text-muted-foreground">Inscriptions</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/30 rounded-lg">
                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{totalUsers}</p>
                        <p className="text-xs text-muted-foreground">Affectés</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="users">
                <TabsList>
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="h-4 w-4" /> Utilisateurs ({totalUsers})
                  </TabsTrigger>
                  <TabsTrigger value="businesses" className="gap-2">
                    <Store className="h-4 w-4" /> Entreprises ({businessAssignments.length})
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="users">
                {/* Birthday KPIs */}
                {birthdayStats && (birthdayStats.total.today > 0 || birthdayStats.total.week > 0 || birthdayStats.total.month > 0) && (
                  <div className="grid grid-cols-3 gap-3 mb-4 mt-2">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                      <p className="text-lg font-bold text-destructive">{birthdayStats.total.today}</p>
                      <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {birthdayStats.via_link.today} lien · {birthdayStats.manual.today} manuel
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                      <p className="text-lg font-bold text-primary">{birthdayStats.total.week}</p>
                      <p className="text-xs text-muted-foreground">Cette semaine</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {birthdayStats.via_link.week} lien · {birthdayStats.manual.week} manuel
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50 border text-center">
                      <p className="text-lg font-bold">{birthdayStats.total.month}</p>
                      <p className="text-xs text-muted-foreground">Ce mois</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {birthdayStats.via_link.month} lien · {birthdayStats.manual.month} manuel
                      </p>
                    </div>
                  </div>
                )}

                {/* Completion filter */}
                <div className="flex items-center gap-2 flex-wrap mb-4 mt-2">
                  <span className="text-xs text-muted-foreground font-medium">Complétion :</span>
                  {COMPLETION_FILTERS.map((val) => (
                    <Button
                      key={val ?? 'all'}
                      variant={completionFilter === val ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-2.5"
                      onClick={() => setCompletionFilter(val)}
                    >
                      {val === null ? 'Tous' : `${val}%`}
                    </Button>
                  ))}
                </div>

                {filteredUserAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {completionFilter !== null
                      ? `Aucun utilisateur avec ${completionFilter}% de complétion sur cette page.`
                      : 'Aucun utilisateur assigné à cet administrateur.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Anniversaire</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Relation</TableHead>
                          <TableHead>Complétion</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead className="text-right">Profil</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUserAssignments.map(a => {
                          const { percentage, details } = calculateProfileCompletion(a.profile);
                          return (
                            <TableRow key={a.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={a.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">{getInitials(a.profile?.first_name, a.profile?.last_name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {a.profile?.first_name || ''} {a.profile?.last_name || ''}
                                    </p>
                                    {a.profile?.is_suspended && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Suspendu</Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <CountryBadge countryCode={a.profile?.country_code} variant="compact" />
                              </TableCell>
                              <TableCell className="text-sm">
                                {a.profile?.phone || <span className="text-muted-foreground italic">Non renseigné</span>}
                              </TableCell>
                              <TableCell>
                                {a.profile?.birthday ? (() => {
                                  const parts = a.profile.birthday.split('-');
                                  const formatted = `${parts[2]}/${parts[1]}`;
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Cake className="h-4 w-4 text-pink-500" />
                                      <span className="text-sm">{formatted}</span>
                                    </div>
                                  );
                                })() : (
                                  <span className="text-muted-foreground italic text-sm">Non renseigné</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {a.profile?.birthday ? (() => {
                                  const days = getDaysUntilBirthday(a.profile.birthday);
                                  return (
                                    <Badge variant={days === 0 ? 'destructive' : days <= 3 ? 'default' : days <= 7 ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-4">
                                      {days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `${days}j`}
                                    </Badge>
                                  );
                                })() : (
                                  <span className="text-muted-foreground italic text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={a.assigned_via === 'share_link' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-4">
                                  {a.assigned_via === 'share_link' ? (
                                    <><Link className="h-2.5 w-2.5 mr-0.5" /> Via lien</>
                                  ) : (
                                    <><UserPlus className="h-2.5 w-2.5 mr-0.5" /> Manuel</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 min-w-[120px]">
                                        <Progress value={percentage} className="h-2 flex-1" />
                                        <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs space-y-1">
                                      {details.map(d => (
                                        <div key={d.label} className="flex items-center gap-1.5">
                                          <span>{d.done ? '✅' : '❌'}</span>
                                          <span>{d.label}</span>
                                        </div>
                                      ))}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-sm">
                                {a.profile?.created_at
                                  ? new Date(a.profile.created_at).toLocaleDateString('fr-FR')
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setSelectedUserId(a.user_id); setUserProfileModalOpen(true); }}
                                >
                                  <FileText className="mr-1.5 h-4 w-4" />
                                  Voir
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Numbered Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t mt-4 gap-3">
                    <p className="text-sm text-muted-foreground">
                      Page {userPage} sur {totalPages} — {totalUsers} utilisateur(s)
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => userPage > 1 && setUserPage(p => p - 1)}
                            className={userPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {getPageNumbers(userPage, totalPages).map((p, i) =>
                          p === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${i}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={p}>
                              <PaginationLink
                                isActive={p === userPage}
                                onClick={() => setUserPage(p)}
                                className="cursor-pointer"
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => userPage < totalPages && setUserPage(p => p + 1)}
                            className={userPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="businesses">
                {businessAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune entreprise assignée à cet administrateur.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Profil</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businessAssignments.map(a => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={a.business?.logo_url || undefined} />
                                  <AvatarFallback className="text-xs">{a.business?.business_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{a.business?.business_name || 'Entreprise'}</p>
                                  {a.assigned_via === 'share_link' && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                      <Link className="h-2.5 w-2.5 mr-0.5" /> Via lien
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <CountryBadge countryCode={a.business?.country_code} variant="compact" />
                            </TableCell>
                            <TableCell className="text-sm">
                              {a.business?.business_type || <span className="text-muted-foreground italic">Non spécifié</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="space-y-0.5">
                                {a.business?.email && <p className="truncate max-w-[180px]">{a.business.email}</p>}
                                {a.business?.phone && <p className="text-muted-foreground">{a.business.phone}</p>}
                                {!a.business?.email && !a.business?.phone && (
                                  <span className="text-muted-foreground italic">Non renseigné</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {a.business?.created_at
                                ? new Date(a.business.created_at).toLocaleDateString('fr-FR')
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(a.business?.status ?? null, a.business?.is_active ?? null, a.business?.is_verified ?? null)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedBusinessId(a.business?.id || null); setBusinessProfileModalOpen(true); }}
                              >
                                <FileText className="mr-1.5 h-4 w-4" />
                                Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UserProfileModal
        userId={selectedUserId}
        open={userProfileModalOpen}
        onOpenChange={setUserProfileModalOpen}
      />

      <BusinessProfileModal
        businessId={selectedBusinessId}
        open={businessProfileModalOpen}
        onOpenChange={setBusinessProfileModalOpen}
      />
    </>
  );
}
