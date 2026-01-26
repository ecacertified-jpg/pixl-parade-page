import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Clock, 
  AlertTriangle,
  Loader2,
  Calendar,
  User,
  Users,
  Gift,
  Heart,
  Bell,
  FileText
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logAdminAction } from '@/utils/auditLogger';
import { useAuth } from '@/contexts/AuthContext';

interface DeletedClient {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_first_name?: string | null;
  deleted_by_last_name?: string | null;
  deletion_reason: string | null;
  archived_data?: {
    contacts: number;
    funds_created: number;
    contributions: number;
    posts: number;
    favorites: number;
  };
  expires_at?: string;
  days_remaining?: number;
}

export default function DeletedClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<DeletedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [hardDeleting, setHardDeleting] = useState<string | null>(null);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [clientToHardDelete, setClientToHardDelete] = useState<DeletedClient | null>(null);

  useEffect(() => {
    fetchDeletedClients();
  }, []);

  const fetchDeletedClients = async () => {
    setLoading(true);
    try {
      // Fetch deleted profiles
      const { data: deletedProfiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          deleted_at,
          deleted_by,
          deletion_reason
        `)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      if (!deletedProfiles || deletedProfiles.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Enrich with additional info
      const enrichedClients = await Promise.all(
        (deletedProfiles || []).map(async (profile) => {
          // Get admin who deleted
          let adminInfo = { first_name: null, last_name: null };
          if (profile.deleted_by) {
            const { data: adminProfile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', profile.deleted_by)
              .single();
            if (adminProfile) {
              adminInfo = adminProfile;
            }
          }

          // Get archive data
          const { data: archive } = await supabase
            .from('deleted_client_archives')
            .select('archived_data, expires_at')
            .eq('profile_id', profile.id)
            .single();

          // Calculate expiration (30 days from deletion)
          const expiresAt = archive?.expires_at 
            ? new Date(archive.expires_at)
            : profile.deleted_at 
              ? new Date(new Date(profile.deleted_at).getTime() + 30 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const daysRemaining = Math.max(
            0,
            Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return {
            ...profile,
            deleted_by_first_name: adminInfo.first_name,
            deleted_by_last_name: adminInfo.last_name,
            archived_data: archive?.archived_data as DeletedClient['archived_data'],
            expires_at: expiresAt.toISOString(),
            days_remaining: daysRemaining,
          };
        })
      );

      setClients(enrichedClients);
    } catch (error) {
      console.error('Error fetching deleted clients:', error);
      toast.error('Erreur lors du chargement de la corbeille');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (client: DeletedClient) => {
    if (client.first_name || client.last_name) {
      return [client.first_name, client.last_name].filter(Boolean).join(' ');
    }
    return 'Utilisateur inconnu';
  };

  const handleRestore = async (client: DeletedClient) => {
    setRestoring(client.id);
    const clientName = getClientName(client);
    const toastId = toast.loading(`Restauration de "${clientName}"...`);

    try {
      // 1. Restore the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null
        })
        .eq('id', client.id);

      if (updateError) throw updateError;

      // 2. Delete the archive if exists
      await supabase
        .from('deleted_client_archives')
        .delete()
        .eq('profile_id', client.id);

      // 3. Log the action
      if (user) {
        await logAdminAction(
          'restore_client',
          'user',
          client.user_id,
          `Client "${clientName}" restauré depuis la corbeille`,
          { client_name: clientName }
        );
      }

      toast.success(`✅ "${clientName}" restauré avec succès`, { id: toastId });
      fetchDeletedClients();
    } catch (error) {
      console.error('Error restoring client:', error);
      toast.error('Erreur lors de la restauration', { id: toastId });
    } finally {
      setRestoring(null);
    }
  };

  const handleHardDelete = async () => {
    if (!clientToHardDelete) return;
    
    setHardDeleting(clientToHardDelete.id);
    const clientName = getClientName(clientToHardDelete);
    const toastId = toast.loading(`Suppression définitive de "${clientName}"...`);

    try {
      const profileId = clientToHardDelete.id;
      const userId = clientToHardDelete.user_id;

      // 1. Delete notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      // 2. Delete favorites
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      // 3. Delete posts
      await supabase
        .from('posts')
        .delete()
        .eq('user_id', userId);

      // 4. Delete contacts
      await supabase
        .from('contacts')
        .delete()
        .eq('user_id', userId);

      // 5. Orphan contributions (keep for fund integrity)
      // Fund contributions are kept with contributor_id for historical purposes

      // 6. Orphan created funds
      await supabase
        .from('collective_funds')
        .update({ creator_id: null })
        .eq('creator_id', userId);

      // 7. Delete archive
      await supabase
        .from('deleted_client_archives')
        .delete()
        .eq('profile_id', profileId);

      // 8. Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      // 9. Log the action
      if (user) {
        await logAdminAction(
          'hard_delete_client',
          'user',
          userId,
          `Client "${clientName}" supprimé définitivement`,
          { client_name: clientName }
        );
      }

      toast.success(`✅ "${clientName}" supprimé définitivement`, { id: toastId });
      setShowHardDeleteDialog(false);
      setClientToHardDelete(null);
      fetchDeletedClients();
    } catch (error) {
      console.error('Error hard deleting client:', error);
      toast.error('Erreur lors de la suppression définitive', { id: toastId });
    } finally {
      setHardDeleting(null);
    }
  };

  const filteredClients = clients.filter(c => {
    const name = getClientName(c).toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query);
  });

  const expiringCount = clients.filter(c => (c.days_remaining || 0) <= 7).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="🗑️ Corbeille Clients"
          description="Les clients supprimés sont conservés 30 jours avant suppression définitive"
          showCountryIndicator={false}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total dans la corbeille</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card className={expiringCount > 0 ? 'border-amber-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirent bientôt (&lt;7j)</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{expiringCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Données archivées</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.reduce((sum, c) => sum + (c.archived_data?.contacts || 0), 0)} contacts
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Clients supprimés</CardTitle>
            <CardDescription>
              Restaurez ou supprimez définitivement les clients de la corbeille
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">La corbeille est vide</p>
                <p className="text-sm">Aucun client supprimé</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Supprimé le</TableHead>
                      <TableHead>Supprimé par</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Données</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{getClientName(client)}</p>
                              <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white">
                                <Trash2 className="mr-1 h-3 w-3" />
                                Supprimé
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ID: {client.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">
                                {client.deleted_at && format(new Date(client.deleted_at), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {client.deleted_at && formatDistanceToNow(new Date(client.deleted_at), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {client.deleted_by_first_name && client.deleted_by_last_name
                                ? `${client.deleted_by_first_name} ${client.deleted_by_last_name}`
                                : 'Inconnu'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-[200px] truncate" title={client.deletion_reason || ''}>
                            {client.deletion_reason || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {client.archived_data?.contacts ? (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {client.archived_data.contacts}
                              </Badge>
                            ) : null}
                            {client.archived_data?.funds_created ? (
                              <Badge variant="secondary" className="text-xs">
                                <Gift className="h-3 w-3 mr-1" />
                                {client.archived_data.funds_created}
                              </Badge>
                            ) : null}
                            {client.archived_data?.posts ? (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {client.archived_data.posts}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(client.days_remaining || 0) <= 7 ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {client.days_remaining}j
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {client.days_remaining}j restants
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(client)}
                              disabled={restoring === client.id}
                            >
                              {restoring === client.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restaurer
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setClientToHardDelete(client);
                                setShowHardDeleteDialog(true);
                              }}
                              disabled={hardDeleting === client.id}
                            >
                              {hardDeleting === client.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hard Delete Confirmation Dialog */}
        <AlertDialog open={showHardDeleteDialog} onOpenChange={setShowHardDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Suppression définitive
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Êtes-vous sûr de vouloir supprimer définitivement 
                  <strong className="text-foreground"> {clientToHardDelete && getClientName(clientToHardDelete)}</strong> ?
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm space-y-2">
                  <p className="font-semibold text-destructive">⚠️ Cette action est irréversible !</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Le profil sera supprimé définitivement</li>
                    <li>Les contacts associés seront supprimés</li>
                    <li>Les favoris et notifications seront supprimés</li>
                    <li>Les publications seront supprimées</li>
                    <li>Les cagnottes créées seront orphelinées</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!hardDeleting}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleHardDelete}
                disabled={!!hardDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {hardDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
