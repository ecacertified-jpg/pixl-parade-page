import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Plus, MoreVertical, ShieldCheck, UserCheck, UserX, Users, Globe, MapPin, Building2, ClipboardList } from 'lucide-react';
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
import { AddAdminModal } from '@/components/admin/AddAdminModal';
import { EditPermissionsModal } from '@/components/admin/EditPermissionsModal';
import { RevokeAdminDialog } from '@/components/admin/RevokeAdminDialog';
import { AssignUsersBusinessesModal } from '@/components/admin/AssignUsersBusinessesModal';
import { ViewAdminAssignmentsModal } from '@/components/admin/ViewAdminAssignmentsModal';
import { COUNTRIES } from '@/config/countries';

interface Admin {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  is_active: boolean;
  created_at: string;
  assigned_at: string;
  assigned_countries: string[] | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  stats?: {
    users: number;
    businesses: number;
  };
}

const getDisplayName = (admin: Admin) => {
  if (admin.profiles?.first_name || admin.profiles?.last_name) {
    return `${admin.profiles.first_name || ''} ${admin.profiles.last_name || ''}`.trim();
  }
  return admin.profiles?.email?.split('@')[0] || 'Admin';
};

const getInitials = (admin: Admin) => {
  if (admin.profiles?.first_name && admin.profiles?.last_name) {
    return `${admin.profiles.first_name[0]}${admin.profiles.last_name[0]}`.toUpperCase();
  }
  if (admin.profiles?.first_name) {
    return admin.profiles.first_name.slice(0, 2).toUpperCase();
  }
  if (admin.profiles?.email) {
    return admin.profiles.email.slice(0, 2).toUpperCase();
  }
  return 'AD';
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedAdminName, setSelectedAdminName] = useState('');
  const [selectedAdminRole, setSelectedAdminRole] = useState<string>('moderator');
  const [currentPermissions, setCurrentPermissions] = useState<any>({});
  const [currentCountries, setCurrentCountries] = useState<string[] | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [viewAssignmentsOpen, setViewAssignmentsOpen] = useState(false);
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-list-admins');

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setAdmins(data?.data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Erreur lors du chargement des administrateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (adminId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: active })
        .eq('id', adminId);

      if (error) throw error;

      toast.success(active ? 'Administrateur activé' : 'Administrateur désactivé');
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const renderAdminActions = (admin: Admin) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleToggleActive(admin.id, !admin.is_active)}
        >
          {admin.is_active ? 'Désactiver' : 'Activer'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setSelectedAdminId(admin.id);
          setSelectedAdminName(getDisplayName(admin));
          setSelectedAdminRole(admin.role);
          setCurrentPermissions(admin.permissions || {});
          setCurrentCountries(admin.assigned_countries);
          setEditPermissionsOpen(true);
        }}>
          Modifier les permissions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setSelectedAdminId(admin.id);
          setSelectedAdminName(getDisplayName(admin));
          setAssignModalOpen(true);
        }}>
          Affecter utilisateurs/entreprises
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setSelectedAdminId(admin.id);
          setSelectedAdminName(getDisplayName(admin));
          setViewAssignmentsOpen(true);
        }}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Voir les affectations
        </DropdownMenuItem>
        {admin.role !== 'super_admin' && (
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => {
              setSelectedAdminId(admin.id);
              setSelectedAdminName(getDisplayName(admin));
              setRevokeDialogOpen(true);
            }}
          >
            Révoquer l'accès admin
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Gestion des administrateurs"
          description="Gérer les accès administrateurs (Super Admin uniquement)"
          showCountryIndicator={false}
          actions={
            <Button onClick={() => setAddAdminOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="sm:hidden">Ajouter</span>
              <span className="hidden sm:inline">Ajouter un administrateur</span>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Tous les administrateurs ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun administrateur</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commencez par ajouter un administrateur à votre équipe.
                </p>
                <Button onClick={() => setAddAdminOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un administrateur
                </Button>
              </div>
            ) : (
              <>
                {/* Vue mobile : cartes */}
                <div className="block md:hidden space-y-4">
                  {admins.map((admin) => (
                    <Card key={admin.id} className="p-4 border bg-card/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className={`flex-shrink-0 ${admin.role === 'super_admin' ? 'ring-2 ring-primary' : ''}`}>
                            <AvatarFallback className={admin.role === 'super_admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                              {getInitials(admin)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{getDisplayName(admin)}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {admin.profiles?.email || 'Email non défini'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {renderAdminActions(admin)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge 
                          variant={admin.role === 'super_admin' ? 'default' : admin.role === 'regional_admin' ? 'default' : 'secondary'}
                          className={`flex items-center gap-1 ${admin.role === 'regional_admin' ? 'bg-blue-500' : ''}`}
                        >
                          {admin.role === 'super_admin' ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : admin.role === 'regional_admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                          {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'regional_admin' ? 'Admin Régional' : 'Modérateur'}
                        </Badge>
                        <Badge 
                          variant={admin.is_active ? 'outline' : 'destructive'}
                          className="flex items-center gap-1"
                        >
                          {admin.is_active ? 'Actif' : <><UserX className="h-3 w-3" /> Inactif</>}
                        </Badge>
                      </div>
                      {/* Countries */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {admin.assigned_countries === null ? (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Tous les pays
                          </Badge>
                        ) : admin.assigned_countries && admin.assigned_countries.length > 0 ? (
                          admin.assigned_countries.map(code => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {COUNTRIES[code]?.flag} {code}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            Aucun pays
                          </Badge>
                        )}
                      </div>
                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {admin.stats?.users ?? '—'} utilisateurs
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {admin.stats?.businesses ?? '—'} entreprises
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Attribué le {formatDate(admin.assigned_at)}
                      </p>
                    </Card>
                  ))}
                </div>

                {/* Vue desktop : tableau */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Administrateur</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Pays</TableHead>
                        <TableHead>Utilisateurs</TableHead>
                        <TableHead>Entreprises</TableHead>
                        <TableHead>Date d'attribution</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className={admin.role === 'super_admin' ? 'ring-2 ring-primary ring-offset-2' : ''}>
                                <AvatarFallback className={admin.role === 'super_admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                                  {getInitials(admin)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{getDisplayName(admin)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {admin.profiles?.email || 'Email non défini'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={admin.role === 'super_admin' ? 'default' : admin.role === 'regional_admin' ? 'default' : 'secondary'}
                              className={`flex items-center gap-1 w-fit ${admin.role === 'regional_admin' ? 'bg-blue-500' : ''}`}
                            >
                              {admin.role === 'super_admin' ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : admin.role === 'regional_admin' ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <UserCheck className="h-3 w-3" />
                              )}
                              {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'regional_admin' ? 'Admin Régional' : 'Modérateur'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {admin.assigned_countries === null ? (
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  Tous
                                </Badge>
                              ) : admin.assigned_countries && admin.assigned_countries.length > 0 ? (
                                admin.assigned_countries.map(code => (
                                  <Badge key={code} variant="secondary" className="text-xs">
                                    {COUNTRIES[code]?.flag} {code}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{admin.stats?.users ?? '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{admin.stats?.businesses ?? '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(admin.assigned_at)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={admin.is_active ? 'outline' : 'destructive'}
                              className={admin.is_active ? 'border-green-500 text-green-600' : ''}
                            >
                              {admin.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {renderAdminActions(admin)}
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
        <AddAdminModal
          open={addAdminOpen}
          onOpenChange={setAddAdminOpen}
          onSuccess={fetchAdmins}
        />
        
        <EditPermissionsModal
          adminId={selectedAdminId}
          adminName={selectedAdminName}
          adminRole={selectedAdminRole}
          currentPermissions={currentPermissions}
          currentCountries={currentCountries}
          open={editPermissionsOpen}
          onOpenChange={setEditPermissionsOpen}
          onSuccess={fetchAdmins}
        />
        
        <RevokeAdminDialog
          adminId={selectedAdminId}
          adminName={selectedAdminName}
          open={revokeDialogOpen}
          onOpenChange={setRevokeDialogOpen}
          onSuccess={fetchAdmins}
        />

        <AssignUsersBusinessesModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          adminId={selectedAdminId}
          adminName={selectedAdminName}
          onSuccess={fetchAdmins}
        />

        <ViewAdminAssignmentsModal
          adminId={selectedAdminId}
          adminName={selectedAdminName}
          open={viewAssignmentsOpen}
          onOpenChange={setViewAssignmentsOpen}
        />
      </div>
    </AdminLayout>
  );
}
