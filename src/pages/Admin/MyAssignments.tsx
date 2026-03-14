import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { CountryBadge } from '@/components/CountryBadge';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { Users, Store, Plus, Trash2, Loader2, MoreHorizontal, FileText, Cake, ArrowUpDown, Heart, AlertTriangle, RefreshCw, Link as LinkIcon, UserPlus } from 'lucide-react';
import { getDaysUntilBirthday } from '@/lib/utils';
import { AdminShareLinkCard } from '@/components/admin/AdminShareLinkCard';
import { useAdminShareCode } from '@/hooks/useAdminShareCode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SelfAssignModal } from '@/components/admin/SelfAssignModal';
import { AdminWishlistModal } from '@/components/admin/AdminWishlistModal';
import { AdminBirthdaysContent } from '@/components/admin/AdminBirthdaysContent';

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
  assigned_via?: string;
  profile?: UserProfile;
}

interface BusinessAssignment {
  id: string;
  business_account_id: string;
  created_at: string;
  assigned_via?: string;
  business?: BusinessDetail;
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

const MyAssignments = () => {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [businessAssignments, setBusinessAssignments] = useState<BusinessAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessProfileModalOpen, setBusinessProfileModalOpen] = useState(false);
  const [sortByBirthday, setSortByBirthday] = useState(false);
  const [wishlistUserId, setWishlistUserId] = useState<string | null>(null);
  const [wishlistUserName, setWishlistUserName] = useState('');
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [completionFilter, setCompletionFilter] = useState<number | null>(null);
  const [birthdayStats, setBirthdayStats] = useState<{ via_link: { today: number; week: number; month: number }; manual: { today: number; week: number; month: number }; total: { today: number; week: number; month: number } } | null>(null);
  const PAGE_SIZE = 50;
  const MAX_RETRIES = 3;

  const { aggregatedStats } = useAdminShareCode();

  const sortedUserAssignments = sortByBirthday
    ? [...userAssignments].sort((a, b) => {
        const dA = a.profile?.birthday ? getDaysUntilBirthday(a.profile.birthday) : 999;
        const dB = b.profile?.birthday ? getDaysUntilBirthday(b.profile.birthday) : 999;
        return dA - dB;
      })
    : userAssignments;

  const filteredUserAssignments = completionFilter !== null
    ? sortedUserAssignments.filter(a => {
        const { percentage } = calculateProfileCompletion(a.profile);
        return percentage === completionFilter;
      })
    : sortedUserAssignments;

  useEffect(() => {
    if (user) loadAdminId();
  }, [user]);

  const loadAdminId = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      setAdminId(data.id);
      loadAssignments(data.id);
    } else {
      setLoading(false);
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
      if (currentRetry >= MAX_RETRIES || currentRetry === 0) {
      }
      setLoading(false);
    }
  };

  const handleManualRetry = () => {
    if (!adminId) return;
    setLoadError(false);
    setRetryCount(0);
    loadAssignments(adminId, userPage, 0);
  };

  useEffect(() => {
    if (adminId) loadAssignments(adminId, userPage);
  }, [userPage]);

  const handleRemove = async (assignmentId: string, type: 'user' | 'business') => {
    if (!adminId) return;
    setRemoving(assignmentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const baseUrl = `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/admin-manage-assignments`;
      const res = await fetch(baseUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId, assignment_ids: [assignmentId], type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Erreur serveur');
      }
      toast.success('Affectation retirée');
      loadAssignments(adminId, userPage);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setRemoving(null);
    }
  };

  const getInitials = (first?: string | null, last?: string | null) =>
    `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes affectations</h1>
            <p className="text-muted-foreground">Gérez vos utilisateurs et entreprises assignés</p>
          </div>
          <Button onClick={() => setModalOpen(true)} disabled={!adminId}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>

        <AdminShareLinkCard />

        {loading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Chargement des affectations...</p>
                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">Tentative {retryCount}/{MAX_RETRIES}...</p>
                )}
              </div>
              <Progress className="w-48 h-1.5" />
            </CardContent>
          </Card>
        ) : loadError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
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
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="users">
            <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl mb-4">
              <TabsTrigger value="users" className="gap-2 rounded-lg text-xs sm:text-sm py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" /> <span className="hidden sm:inline">Utilisateurs</span> ({totalUsers})
              </TabsTrigger>
              <TabsTrigger value="businesses" className="gap-2 rounded-lg text-xs sm:text-sm py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Store className="h-4 w-4" /> <span className="hidden sm:inline">Entreprises</span> ({businessAssignments.length})
              </TabsTrigger>
              <TabsTrigger value="birthdays" className="gap-2 rounded-lg text-xs sm:text-sm py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Cake className="h-4 w-4" /> <span className="hidden sm:inline">Anniversaires</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">Mes utilisateurs</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1.5">
                        <LinkIcon className="h-3 w-3" />
                        {aggregatedStats.total_signups} inscrits via lien
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <UserPlus className="h-3 w-3" />
                        {totalUsers} affectés
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Completion filter */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
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
                        : 'Aucun utilisateur assigné. Cliquez sur "Ajouter" pour commencer.'}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>
                            <Button variant="ghost" size="sm" className="gap-1 -ml-2 h-auto py-1 font-medium text-muted-foreground hover:text-foreground" onClick={() => setSortByBirthday(v => !v)}>
                              <Cake className="h-3.5 w-3.5" /> Anniversaire <ArrowUpDown className={`h-3.5 w-3.5 transition-colors ${sortByBirthday ? 'text-primary' : ''}`} />
                            </Button>
                          </TableHead>
                          <TableHead>Complétion</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                                    {a.assigned_via === 'share_link' && (
                                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0 h-4">Via lien de partage</Badge>
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
                                  const days = getDaysUntilBirthday(a.profile.birthday);
                                  const parts = a.profile.birthday.split('-');
                                  const formatted = `${parts[2]}/${parts[1]}`;
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Cake className="h-4 w-4 text-pink-500" />
                                      <span className="text-sm">{formatted}</span>
                                      {days <= 30 && (
                                        <Badge variant={days === 0 ? 'destructive' : days <= 3 ? 'default' : days <= 7 ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-4">
                                          {days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `${days}j`}
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })() : (
                                  <span className="text-muted-foreground italic text-sm">Non renseigné</span>
                                )}
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedUserId(a.user_id); setUserProfileModalOpen(true); }}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Voir le profil
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setWishlistUserId(a.user_id);
                                      setWishlistUserName(`${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim() || 'Utilisateur');
                                      setWishlistModalOpen(true);
                                    }}>
                                      <Heart className="mr-2 h-4 w-4" />
                                      Voir les souhaits
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      disabled={removing === a.id}
                                      onClick={() => handleRemove(a.id, 'user')}
                                    >
                                      {removing === a.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      )}
                                      Retirer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="businesses">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mes entreprises</CardTitle>
                </CardHeader>
                <CardContent>
                  {businessAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune entreprise assignée. Cliquez sur "Ajouter" pour commencer.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
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
                                    <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0 h-4">Via lien de partage</Badge>
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedBusinessId(a.business_account_id); setBusinessProfileModalOpen(true); }}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Voir le profil
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    disabled={removing === a.id}
                                    onClick={() => handleRemove(a.id, 'business')}
                                  >
                                    {removing === a.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Retirer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="birthdays">
              <AdminBirthdaysContent />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {adminId && (
        <SelfAssignModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          adminId={adminId}
          onSuccess={() => loadAssignments(adminId, userPage)}
        />
      )}

      <UserProfileModal userId={selectedUserId} open={userProfileModalOpen} onOpenChange={setUserProfileModalOpen} />
      <BusinessProfileModal businessId={selectedBusinessId} open={businessProfileModalOpen} onOpenChange={setBusinessProfileModalOpen} />
      {wishlistUserId && (
        <AdminWishlistModal
          isOpen={wishlistModalOpen}
          onClose={() => { setWishlistModalOpen(false); setWishlistUserId(null); }}
          userId={wishlistUserId}
          userName={wishlistUserName}
        />
      )}
    </AdminLayout>
  );
};

export default MyAssignments;
