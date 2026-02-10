import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, MoreVertical, Ban, CheckCircle, XCircle, RefreshCw, Users,
  Download, UserCheck, AlertTriangle, UserX, TrendingUp, Trophy, Phone, MapPin,
  Calendar, Image, FileText, GitMerge, Trash2, UserPlus, Users2
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { UserTransactionsModal } from '@/components/admin/UserTransactionsModal';
import { SuspendUserDialog } from '@/components/admin/SuspendUserDialog';
import { MergeAccountsModal } from '@/components/admin/MergeAccountsModal';
import { exportToCSV, ExportColumn } from '@/utils/exportUtils';
import { useAdmin } from '@/hooks/useAdmin';
import { AddClientModal } from '@/components/admin/AddClientModal';
import { UnifyClientAccountsModal } from '@/components/admin/UnifyClientAccountsModal';
import { DeleteClientModal } from '@/components/admin/DeleteClientModal';
import { getCountryConfig, isValidCountryCode } from '@/config/countries';

interface User {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  birthday: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_suspended: boolean;
  country_code: string | null;
}

interface ProfileCompletion {
  score: number;
  level: 'complete' | 'partial' | 'minimal';
  missingFields: string[];
  filledFields: string[];
}

type CompletionFilter = 'all' | 'complete' | 'partial' | 'minimal';
type StatusFilter = 'all' | 'active' | 'suspended';
type MissingFieldFilter = 'all' | 'phone' | 'city' | 'birthday' | 'avatar_url' | 'bio';

const FIELD_LABELS: Record<string, string> = {
  first_name: 'Prénom',
  last_name: 'Nom',
  phone: 'Téléphone',
  city: 'Ville',
  birthday: 'Date de naissance',
  avatar_url: 'Photo',
  bio: 'Bio'
};

const calculateProfileCompletion = (user: User): ProfileCompletion => {
  const fields = [
    { key: 'first_name', weight: 15, filled: !!user.first_name },
    { key: 'last_name', weight: 15, filled: !!user.last_name },
    { key: 'phone', weight: 15, filled: !!user.phone },
    { key: 'city', weight: 15, filled: !!user.city },
    { key: 'birthday', weight: 15, filled: !!user.birthday },
    { key: 'avatar_url', weight: 15, filled: !!user.avatar_url },
    { key: 'bio', weight: 10, filled: !!user.bio },
  ];

  const score = fields.reduce((acc, f) => acc + (f.filled ? f.weight : 0), 0);
  const missingFields = fields.filter(f => !f.filled).map(f => f.key);
  const filledFields = fields.filter(f => f.filled).map(f => f.key);

  let level: 'complete' | 'partial' | 'minimal';
  if (score >= 80) level = 'complete';
  else if (score >= 40) level = 'partial';
  else level = 'minimal';

  return { score, level, missingFields, filledFields };
};

const CompletionBadge = ({ completion }: { completion: ProfileCompletion }) => {
  const bgClass = {
    complete: 'bg-green-500',
    partial: 'bg-yellow-500',
    minimal: 'bg-red-500'
  }[completion.level];

  const colorClass = {
    complete: 'text-green-600 dark:text-green-400',
    partial: 'text-yellow-600 dark:text-yellow-400',
    minimal: 'text-red-600 dark:text-red-400'
  }[completion.level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={completion.score} className="h-2 flex-1" indicatorClassName={bgClass} />
            <span className={`text-xs font-medium ${colorClass} w-10 text-right`}>{completion.score}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Champs remplis :</p>
            <div className="flex flex-wrap gap-1">
              {completion.filledFields.map(field => (
                <Badge key={field} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✓ {FIELD_LABELS[field]}
                </Badge>
              ))}
            </div>
            {completion.missingFields.length > 0 && (
              <>
                <p className="font-medium mt-2">Champs manquants :</p>
                <div className="flex flex-wrap gap-1">
                  {completion.missingFields.map(field => (
                    <Badge key={field} variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      ✗ {FIELD_LABELS[field]}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function CountryUsersPage() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();

  const country = countryCode && isValidCountryCode(countryCode) ? getCountryConfig(countryCode) : null;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [missingFieldFilter, setMissingFieldFilter] = useState<MissingFieldFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserSuspended, setSelectedUserSuspended] = useState(false);
  const [selectedUserForMerge, setSelectedUserForMerge] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [unifyClientModalOpen, setUnifyClientModalOpen] = useState(false);
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [countryCode]);

  const fetchUsers = async () => {
    if (!countryCode) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, city, birthday, avatar_url, bio, created_at, is_suspended, country_code')
        .eq('country_code', countryCode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const usersWithCompletion = useMemo(() => {
    return users.map(user => ({ ...user, completion: calculateProfileCompletion(user) }));
  }, [users]);

  const stats = useMemo(() => {
    const total = usersWithCompletion.length;
    const complete = usersWithCompletion.filter(u => u.completion.level === 'complete').length;
    const partial = usersWithCompletion.filter(u => u.completion.level === 'partial').length;
    const minimal = usersWithCompletion.filter(u => u.completion.level === 'minimal').length;
    const avgScore = total > 0 ? Math.round(usersWithCompletion.reduce((acc, u) => acc + u.completion.score, 0) / total) : 0;
    return { total, complete, partial, minimal, avgScore };
  }, [usersWithCompletion]);

  const filteredUsers = useMemo(() => {
    return usersWithCompletion.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const phone = user.phone?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      if (query && !fullName.includes(query) && !phone.includes(query)) return false;
      if (completionFilter !== 'all' && user.completion.level !== completionFilter) return false;
      if (statusFilter === 'active' && user.is_suspended) return false;
      if (statusFilter === 'suspended' && !user.is_suspended) return false;
      if (missingFieldFilter !== 'all' && !user.completion.missingFields.includes(missingFieldFilter)) return false;
      return true;
    });
  }, [usersWithCompletion, searchQuery, completionFilter, statusFilter, missingFieldFilter]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');
  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return 'Utilisateur anonyme';
  };
  const getInitials = (firstName: string | null, lastName: string | null) => {
    const f = firstName?.[0]?.toUpperCase() || '';
    const l = lastName?.[0]?.toUpperCase() || '';
    return f + l || '?';
  };

  const handleUserAction = (user: User & { completion: ProfileCompletion }, action: 'profile' | 'transactions' | 'suspend' | 'merge' | 'delete') => {
    setSelectedUserId(user.user_id);
    setSelectedUserName(getUserDisplayName(user));
    setSelectedUserSuspended(user.is_suspended);
    if (action === 'profile') setProfileModalOpen(true);
    if (action === 'transactions') setTransactionsModalOpen(true);
    if (action === 'suspend') setSuspendDialogOpen(true);
    if (action === 'merge') { setSelectedUserForMerge(user); setMergeModalOpen(true); }
    if (action === 'delete') setDeleteClientModalOpen(true);
  };

  const handleExportIncomplete = () => {
    const incompleteUsers = usersWithCompletion.filter(u => u.completion.score < 100);
    const columns: ExportColumn<typeof incompleteUsers[0]>[] = [
      { key: 'first_name', header: 'Prénom' },
      { key: 'last_name', header: 'Nom' },
      { key: 'phone', header: 'Téléphone' },
      { key: 'city', header: 'Ville' },
      { key: 'completion', header: 'Complétion %', format: (v) => `${(v as ProfileCompletion).score}%` },
      { key: 'completion', header: 'Champs manquants', format: (v) => (v as ProfileCompletion).missingFields.map(f => FIELD_LABELS[f]).join(', ') },
      { key: 'created_at', header: 'Date inscription', format: (v) => formatDate(v as string) },
    ];
    exportToCSV(incompleteUsers, columns, `profils-incomplets-${countryCode}`);
    toast.success(`${incompleteUsers.length} profils incomplets exportés`);
  };

  if (!country) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">Pays non trouvé</p>
          <Button onClick={() => navigate('/admin/countries')}>Retour</Button>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <AdminPageHeader
          title={`${country.flag} Utilisateurs - ${country.name}`}
          description={`${stats.total} utilisateur(s) enregistré(s)`}
          backPath={`/admin/countries/${countryCode}`}
          showCountryIndicator={false}
          actions={
            <div className="flex gap-2 flex-wrap">
              {isSuperAdmin && (
                <Button onClick={() => setAddClientModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter un client</span>
                </Button>
              )}
              {isSuperAdmin && (
                <Button variant="outline" onClick={() => setUnifyClientModalOpen(true)}>
                  <Users2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Unifier clients</span>
                </Button>
              )}
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          }
        />

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setCompletionFilter('all')}>
            <CardContent className="pt-4 pb-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'complete' ? 'ring-2 ring-primary' : ''}`} onClick={() => setCompletionFilter('complete')}>
            <CardContent className="pt-4 pb-3 text-center">
              <UserCheck className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{stats.complete}</p>
              <p className="text-xs text-muted-foreground">Complets</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'partial' ? 'ring-2 ring-primary' : ''}`} onClick={() => setCompletionFilter('partial')}>
            <CardContent className="pt-4 pb-3 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{stats.partial}</p>
              <p className="text-xs text-muted-foreground">Partiels</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'minimal' ? 'ring-2 ring-primary' : ''}`} onClick={() => setCompletionFilter('minimal')}>
            <CardContent className="pt-4 pb-3 text-center">
              <UserX className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{stats.minimal}</p>
              <p className="text-xs text-muted-foreground">Minimaux</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher par nom ou téléphone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="suspended">Suspendus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={missingFieldFilter} onValueChange={(v) => setMissingFieldFilter(v as MissingFieldFilter)}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Champ manquant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les champs</SelectItem>
                  <SelectItem value="phone">Sans téléphone</SelectItem>
                  <SelectItem value="city">Sans ville</SelectItem>
                  <SelectItem value="birthday">Sans anniversaire</SelectItem>
                  <SelectItem value="avatar_url">Sans photo</SelectItem>
                  <SelectItem value="bio">Sans bio</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportIncomplete}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">{filteredUsers.length} utilisateur(s) trouvé(s)</p>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden md:table-cell">Ville</TableHead>
                    <TableHead>Complétion</TableHead>
                    <TableHead className="hidden sm:table-cell">Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleUserAction(user, 'profile')}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback className="text-xs">{getInitials(user.first_name, user.last_name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium truncate max-w-[150px]">{getUserDisplayName(user)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{user.phone || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{user.city || '—'}</TableCell>
                        <TableCell><CompletionBadge completion={user.completion} /></TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {user.is_suspended ? (
                            <Badge variant="destructive" className="text-xs"><XCircle className="mr-1 h-3 w-3" />Suspendu</Badge>
                          ) : (
                            <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="mr-1 h-3 w-3" />Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'profile'); }}>
                                <FileText className="h-4 w-4 mr-2" />Voir le profil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'transactions'); }}>
                                <TrendingUp className="h-4 w-4 mr-2" />Transactions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'suspend'); }}>
                                <Ban className="h-4 w-4 mr-2" />{user.is_suspended ? 'Réactiver' : 'Suspendre'}
                              </DropdownMenuItem>
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'merge'); }}>
                                    <GitMerge className="h-4 w-4 mr-2" />Fusionner
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleUserAction(user, 'delete'); }}>
                                    <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {selectedUserId && (
        <>
          <UserProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} userId={selectedUserId} />
          <UserTransactionsModal open={transactionsModalOpen} onOpenChange={setTransactionsModalOpen} userId={selectedUserId} userName={selectedUserName} />
          <SuspendUserDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen} userId={selectedUserId} userName={selectedUserName} isSuspended={selectedUserSuspended} onSuccess={fetchUsers} />
          <DeleteClientModal open={deleteClientModalOpen} onOpenChange={setDeleteClientModalOpen} userId={selectedUserId} userName={selectedUserName} onDeleted={fetchUsers} />
        </>
      )}
      <MergeAccountsModal isOpen={mergeModalOpen} onClose={() => setMergeModalOpen(false)} initialPrimaryUser={selectedUserForMerge ? { id: selectedUserForMerge.user_id, first_name: selectedUserForMerge.first_name, last_name: selectedUserForMerge.last_name, phone: selectedUserForMerge.phone, avatar_url: selectedUserForMerge.avatar_url, created_at: selectedUserForMerge.created_at } as any : null} onMergeComplete={fetchUsers} />
      <AddClientModal open={addClientModalOpen} onOpenChange={setAddClientModalOpen} onSuccess={fetchUsers} />
      <UnifyClientAccountsModal open={unifyClientModalOpen} onOpenChange={setUnifyClientModalOpen} onMergeComplete={fetchUsers} />
    </AdminLayout>
  );
}
