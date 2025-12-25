import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreVertical, Ban, CheckCircle, XCircle, ArrowLeft, RefreshCw, Users } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { UserTransactionsModal } from '@/components/admin/UserTransactionsModal';
import { SuspendUserDialog } from '@/components/admin/SuspendUserDialog';

interface User {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  bio: string | null;
  is_suspended: boolean;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedUserSuspended, setSelectedUserSuspended] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, created_at, bio, is_suspended')
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

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const phone = user.phone?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || phone.includes(query);
  });

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

  const handleUserAction = (user: User, action: 'profile' | 'transactions' | 'suspend') => {
    setSelectedUserId(user.user_id);
    setSelectedUserName(getUserDisplayName(user));
    setSelectedUserSuspended(user.is_suspended);
    
    if (action === 'profile') setProfileModalOpen(true);
    if (action === 'transactions') setTransactionsModalOpen(true);
    if (action === 'suspend') setSuspendDialogOpen(true);
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
        {/* Header responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/admin')}
              className="mt-0.5 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Gestion des utilisateurs
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gérer tous les comptes utilisateurs
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={fetchUsers}
            className="self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  Tous les utilisateurs
                  <Badge variant="secondary">{users.length}</Badge>
                </CardTitle>
              </div>
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
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
                  {searchQuery 
                    ? "Essayez avec un autre terme de recherche" 
                    : "Aucun utilisateur inscrit pour le moment"}
                </p>
              </div>
            ) : (
              <>
                {/* Vue mobile : cartes */}
                <div className="block md:hidden space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.user_id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(user.first_name, user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
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
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleUserAction(user, 'suspend')}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              {user.is_suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

                {/* Vue desktop : tableau */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Téléphone</TableHead>
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
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(user.first_name, user.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {getUserDisplayName(user)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{user.phone || 'Non renseigné'}</TableCell>
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
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleUserAction(user, 'suspend')}
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  {user.is_suspended ? 'Réactiver le compte' : 'Suspendre le compte'}
                                </DropdownMenuItem>
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
      </div>
    </AdminLayout>
  );
}
