import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Plus, MoreVertical } from 'lucide-react';
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

interface Admin {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  is_active: boolean;
  created_at: string;
  assigned_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedAdminName, setSelectedAdminName] = useState('');
  const [selectedAdminRole, setSelectedAdminRole] = useState<'super_admin' | 'moderator'>('moderator');
  const [currentPermissions, setCurrentPermissions] = useState<any>({});

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des administrateurs</h1>
            <p className="text-muted-foreground mt-2">
              Gérer les accès administrateurs (Super Admin uniquement)
            </p>
          </div>
          <Button onClick={() => setAddAdminOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un administrateur
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tous les administrateurs ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date d'attribution</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.profiles?.first_name && admin.profiles?.last_name
                        ? `${admin.profiles.first_name} ${admin.profiles.last_name}`
                        : 'Nom non défini'}
                    </TableCell>
                    <TableCell>{admin.profiles?.email || 'Email non défini'}</TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Modérateur'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(admin.assigned_at)}</TableCell>
                    <TableCell>
                      <Badge variant={admin.is_active ? 'default' : 'destructive'}>
                        {admin.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                            setSelectedAdminName(`${admin.profiles?.first_name || ''} ${admin.profiles?.last_name || ''}`.trim() || 'Admin');
                            setSelectedAdminRole(admin.role as 'super_admin' | 'moderator');
                            setCurrentPermissions(admin.permissions || {});
                            setEditPermissionsOpen(true);
                          }}>
                            Modifier les permissions
                          </DropdownMenuItem>
                          {admin.role !== 'super_admin' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedAdminId(admin.id);
                                setSelectedAdminName(`${admin.profiles?.first_name || ''} ${admin.profiles?.last_name || ''}`.trim() || 'Admin');
                                setRevokeDialogOpen(true);
                              }}
                            >
                              Révoquer l'accès admin
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      </div>
    </AdminLayout>
  );
}
