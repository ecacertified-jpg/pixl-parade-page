import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, MoreVertical, Ban, CheckCircle, XCircle, ArrowLeft, RefreshCw, Users,
  Download, UserCheck, AlertTriangle, UserX, TrendingUp, Trophy, Phone, MapPin,
  Calendar, Image, FileText, GitMerge, Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
import { UserPlus, Users2 } from 'lucide-react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { CountryBadge } from '@/components/CountryBadge';


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
  const colorClass = {
    complete: 'text-green-600 dark:text-green-400',
    partial: 'text-yellow-600 dark:text-yellow-400',
    minimal: 'text-red-600 dark:text-red-400'
  }[completion.level];

  const bgClass = {
    complete: 'bg-green-500',
    partial: 'bg-yellow-500',
    minimal: 'bg-red-500'
  }[completion.level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress 
              value={completion.score} 
              className="h-2 flex-1"
              indicatorClassName={bgClass}
            />
            <span className={`text-xs font-medium ${colorClass} w-10 text-right`}>
              {completion.score}%
            </span>
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

export default function UserManagement() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();
  const { selectedCountry } = useAdminCountry();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [missingFieldFilter, setMissingFieldFilter] = useState<MissingFieldFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
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
  }, [selectedCountry]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, city, birthday, avatar_url, bio, created_at, is_suspended, country_code')
        .order('created_at', { ascending: false });

      if (selectedCountry) {
        query = query.eq('country_code', selectedCountry);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Calculate completions for all users
  const usersWithCompletion = useMemo(() => {
    return users.map(user => ({
      ...user,
      completion: calculateProfileCompletion(user)
    }));
  }, [users]);

  // Global statistics
  const stats = useMemo(() => {
    const total = usersWithCompletion.length;
    const complete = usersWithCompletion.filter(u => u.completion.level === 'complete').length;
    const partial = usersWithCompletion.filter(u => u.completion.level === 'partial').length;
    const minimal = usersWithCompletion.filter(u => u.completion.level === 'minimal').length;
    const avgScore = total > 0 
      ? Math.round(usersWithCompletion.reduce((acc, u) => acc + u.completion.score, 0) / total)
      : 0;
    const perfectCount = usersWithCompletion.filter(u => u.completion.score === 100).length;
    const perfectRate = total > 0 ? Math.round((perfectCount / total) * 100) : 0;

    return { total, complete, partial, minimal, avgScore, perfectCount, perfectRate };
  }, [usersWithCompletion]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersWithCompletion.filter(user => {
      // Search filter
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const phone = user.phone?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      if (query && !fullName.includes(query) && !phone.includes(query)) return false;

      // Completion filter
      if (completionFilter !== 'all' && user.completion.level !== completionFilter) return false;

      // Status filter
      if (statusFilter === 'active' && user.is_suspended) return false;
      if (statusFilter === 'suspended' && !user.is_suspended) return false;

      // Missing field filter
      if (missingFieldFilter !== 'all' && !user.completion.missingFields.includes(missingFieldFilter)) return false;

      return true;
    });
  }, [usersWithCompletion, searchQuery, completionFilter, statusFilter, missingFieldFilter]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return 'Utilisateur anonyme';
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const f = firstName?.[0]?.toUpperCase() || '';
    const l = lastName?.[0]?.toUpperCase() || '';
    return f + l || '?';
  };

  const getStatusBadge = (isSuspended: boolean) => (
    isSuspended ? (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="mr-1 h-3 w-3" />
        Suspendu
      </Badge>
    ) : (
      <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="mr-1 h-3 w-3" />
        Actif
      </Badge>
    )
  );

  const handleUserAction = (user: User & { completion: ProfileCompletion }, action: 'profile' | 'transactions' | 'suspend' | 'merge' | 'delete') => {
    setSelectedUserId(user.user_id);
    setSelectedUserName(getUserDisplayName(user));
    setSelectedUserSuspended(user.is_suspended);
    
    if (action === 'profile') setProfileModalOpen(true);
    if (action === 'transactions') setTransactionsModalOpen(true);
    if (action === 'suspend') setSuspendDialogOpen(true);
    if (action === 'merge') {
      setSelectedUserForMerge(user);
      setMergeModalOpen(true);
    }
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

    exportToCSV(incompleteUsers, columns, 'profils-incomplets');
    toast.success(`${incompleteUsers.length} profils incomplets exportés`);
  };

  const handleStatClick = (filter: CompletionFilter) => {
    setCompletionFilter(filter);
    setMissingFieldFilter('all');
    setStatusFilter('all');
  };

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
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="Gestion des utilisateurs"
          description="Gérer tous les comptes utilisateurs"
          actions={
            <div className="flex gap-2 flex-wrap">
              {isSuperAdmin && (
                <Button 
                  onClick={() => setAddClientModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter un client</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              )}
              {isSuperAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => setUnifyClientModalOpen(true)}
                >
                  <Users2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Unifier clients</span>
                </Button>
              )}
              {isSuperAdmin && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedUserForMerge(null);
                    setMergeModalOpen(true);
                  }}
                >
                  <GitMerge className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Fusionner comptes</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={fetchUsers}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          }
        />

        {/* Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleStatClick('all')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Users className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'complete' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => handleStatClick('complete')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <UserCheck className="h-6 w-6 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.complete}</p>
              <p className="text-xs text-muted-foreground">Complets</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'partial' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => handleStatClick('partial')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.partial}</p>
              <p className="text-xs text-muted-foreground">Partiels</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${completionFilter === 'minimal' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => handleStatClick('minimal')}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <UserX className="h-6 w-6 text-red-500 mb-2" />
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.minimal}</p>
              <p className="text-xs text-muted-foreground">Minimaux</p>
            </CardContent>
          </Card>

          <Card className="cursor-default">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <TrendingUp className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.avgScore}%</p>
              <p className="text-xs text-muted-foreground">Moyenne</p>
            </CardContent>
          </Card>

          <Card className="cursor-default">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Trophy className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.perfectRate}%</p>
              <p className="text-xs text-muted-foreground">Taux 100%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  Utilisateurs filtrés
                  <Badge variant="secondary">{filteredUsers.length}</Badge>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportIncomplete}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exporter incomplets</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={completionFilter} onValueChange={(v) => setCompletionFilter(v as CompletionFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Complétion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="complete">✅ Complets (80%+)</SelectItem>
                    <SelectItem value="partial">⚠️ Partiels (40-79%)</SelectItem>
                    <SelectItem value="minimal">❌ Minimaux (&lt;40%)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actifs uniquement</SelectItem>
                    <SelectItem value="suspended">Suspendus uniquement</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={missingFieldFilter} onValueChange={(v) => setMissingFieldFilter(v as MissingFieldFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Champ manquant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les champs</SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" /> Sans téléphone
                      </div>
                    </SelectItem>
                    <SelectItem value="city">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Sans ville
                      </div>
                    </SelectItem>
                    <SelectItem value="birthday">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> Sans date de naissance
                      </div>
                    </SelectItem>
                    <SelectItem value="avatar_url">
                      <div className="flex items-center gap-2">
                        <Image className="h-3 w-3" /> Sans photo
                      </div>
                    </SelectItem>
                    <SelectItem value="bio">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" /> Sans bio
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Aucun utilisateur trouvé
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Essayez de modifier les filtres
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setCompletionFilter('all');
                    setStatusFilter('all');
                    setMissingFieldFilter('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile view */}
                <div className="block md:hidden space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.user_id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-1.5">
                              <CountryBadge countryCode={user.country_code} variant="minimal" />
                              {getUserDisplayName(user)}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.phone || 'Téléphone non renseigné'}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserAction(user, 'profile')}>
                              Voir le profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction(user, 'transactions')}>
                              Historique des transactions
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUserAction(user, 'merge')}>
                                  <GitMerge className="mr-2 h-4 w-4" />
                                  Fusionner avec un autre compte
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleUserAction(user, 'suspend')}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {user.is_suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleUserAction(user, 'delete')}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer le compte
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Completion bar for mobile */}
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Complétion</span>
                          <CompletionBadge completion={user.completion} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.completion.filledFields.slice(0, 3).map(field => (
                            <Badge key={field} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              ✓ {FIELD_LABELS[field]}
                            </Badge>
                          ))}
                          {user.completion.missingFields.slice(0, 2).map(field => (
                            <Badge key={field} variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              ✗ {FIELD_LABELS[field]}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          Inscrit le {formatDate(user.created_at)}
                        </span>
                        {getStatusBadge(user.is_suspended)}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop view */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Pays</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Complétion</TableHead>
                        <TableHead>Date d'inscription</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(user.first_name, user.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {getUserDisplayName(user)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <CountryBadge countryCode={user.country_code} variant="compact" />
                          </TableCell>
                          <TableCell>{user.phone || 'Non renseigné'}</TableCell>
                          <TableCell>
                            <CompletionBadge completion={user.completion} />
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(user.is_suspended)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUserAction(user, 'profile')}>
                                  Voir le profil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUserAction(user, 'transactions')}>
                                  Historique des transactions
                                </DropdownMenuItem>
                                {isSuperAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleUserAction(user, 'merge')}>
                                      <GitMerge className="mr-2 h-4 w-4" />
                                      Fusionner avec un autre compte
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleUserAction(user, 'suspend')}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  {user.is_suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                                </DropdownMenuItem>
                                {isSuperAdmin && (
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleUserAction(user, 'delete')}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer le compte
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Modals */}
        <UserProfileModal 
          userId={selectedUserId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />
        
        <UserTransactionsModal
          userId={selectedUserId}
          userName={selectedUserName}
          open={transactionsModalOpen}
          onOpenChange={setTransactionsModalOpen}
        />
        
        <SuspendUserDialog
          userId={selectedUserId}
          userName={selectedUserName}
          isSuspended={selectedUserSuspended}
          open={suspendDialogOpen}
          onOpenChange={setSuspendDialogOpen}
          onSuccess={fetchUsers}
        />

        {isSuperAdmin && (
          <MergeAccountsModal
            isOpen={mergeModalOpen}
            onClose={() => {
              setMergeModalOpen(false);
              setSelectedUserForMerge(null);
            }}
            initialPrimaryUser={selectedUserForMerge ? {
              user_id: selectedUserForMerge.user_id,
              first_name: selectedUserForMerge.first_name,
              last_name: selectedUserForMerge.last_name,
              phone: selectedUserForMerge.phone,
              avatar_url: selectedUserForMerge.avatar_url,
              created_at: selectedUserForMerge.created_at
            } : null}
            onMergeComplete={fetchUsers}
          />
        )}

        <AddClientModal
          open={addClientModalOpen}
          onOpenChange={setAddClientModalOpen}
          onSuccess={fetchUsers}
        />

        <UnifyClientAccountsModal
          open={unifyClientModalOpen}
          onOpenChange={setUnifyClientModalOpen}
          onMergeComplete={fetchUsers}
        />

        {isSuperAdmin && (
          <DeleteClientModal
            open={deleteClientModalOpen}
            onOpenChange={setDeleteClientModalOpen}
            userId={selectedUserId}
            userName={selectedUserName}
            onDeleted={fetchUsers}
          />
        )}
      </div>
    </AdminLayout>
  );
}
