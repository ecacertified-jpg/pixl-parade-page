import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Clock, 
  AlertTriangle,
  Package,
  ShoppingCart,
  Loader2,
  Calendar,
  User
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

interface DeletedBusiness {
  id: string;
  business_name: string;
  business_type: string | null;
  user_id: string;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_first_name?: string;
  deleted_by_last_name?: string;
  archived_data?: {
    products: { count: number; ids: string[] };
    categories: { count: number };
    orders: { count: number };
  };
  expires_at?: string;
  days_remaining?: number;
}

export default function DeletedBusinesses() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<DeletedBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [hardDeleting, setHardDeleting] = useState<string | null>(null);
  const [showHardDeleteDialog, setShowHardDeleteDialog] = useState(false);
  const [businessToHardDelete, setBusinessToHardDelete] = useState<DeletedBusiness | null>(null);

  useEffect(() => {
    fetchDeletedBusinesses();
  }, []);

  const fetchDeletedBusinesses = async () => {
    setLoading(true);
    try {
      // Fetch deleted businesses with admin info
      const { data: deletedBusinesses, error } = await supabase
        .from('business_accounts')
        .select(`
          id,
          business_name,
          business_type,
          user_id,
          deleted_at,
          deleted_by
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      // Fetch additional info for each business
      const enrichedBusinesses = await Promise.all(
        (deletedBusinesses || []).map(async (business) => {
          // Get admin who deleted
          let adminInfo = { first_name: null, last_name: null };
          if (business.deleted_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', business.deleted_by)
              .single();
            if (profile) {
              adminInfo = profile;
            }
          }

          // Get archive data
          const { data: archive } = await supabase
            .from('deleted_business_archives')
            .select('archived_data, expires_at')
            .eq('business_id', business.id)
            .single();

          const expiresAt = archive?.expires_at 
            ? new Date(archive.expires_at)
            : new Date(new Date(business.deleted_at).getTime() + 30 * 24 * 60 * 60 * 1000);

          const daysRemaining = Math.max(
            0,
            Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return {
            ...business,
            deleted_by_first_name: adminInfo.first_name,
            deleted_by_last_name: adminInfo.last_name,
            archived_data: archive?.archived_data as DeletedBusiness['archived_data'],
            expires_at: expiresAt.toISOString(),
            days_remaining: daysRemaining,
          };
        })
      );

      setBusinesses(enrichedBusinesses);
    } catch (error) {
      console.error('Error fetching deleted businesses:', error);
      toast.error('Erreur lors du chargement de la corbeille');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (business: DeletedBusiness) => {
    setRestoring(business.id);
    const toastId = toast.loading(`Restauration de "${business.business_name}"...`);

    try {
      // 1. Restore the business account
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({
          deleted_at: null,
          deleted_by: null,
          is_active: true,
          status: 'active'
        })
        .eq('id', business.id);

      if (updateError) throw updateError;

      // 2. Reactivate products
      await supabase
        .from('products')
        .update({ is_active: true })
        .eq('business_account_id', business.id);

      // 3. Delete the archive
      await supabase
        .from('deleted_business_archives')
        .delete()
        .eq('business_id', business.id);

      // 4. Log the action
      if (user) {
        await logAdminAction(
          'restore_business',
          'business',
          business.id,
          `Business "${business.business_name}" restauré depuis la corbeille`,
          { business_name: business.business_name }
        );
      }

      toast.success(`✅ "${business.business_name}" restauré avec succès`, { id: toastId });
      fetchDeletedBusinesses();
    } catch (error) {
      console.error('Error restoring business:', error);
      toast.error('Erreur lors de la restauration', { id: toastId });
    } finally {
      setRestoring(null);
    }
  };

  const handleHardDelete = async () => {
    if (!businessToHardDelete) return;
    
    setHardDeleting(businessToHardDelete.id);
    const toastId = toast.loading(`Suppression définitive de "${businessToHardDelete.business_name}"...`);

    try {
      const businessId = businessToHardDelete.id;
      const businessUserId = businessToHardDelete.user_id;

      // 1. Get product IDs first
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', businessId);

      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);

        // 2. Delete product ratings
        await supabase
          .from('product_ratings')
          .delete()
          .in('product_id', productIds);

        // 3. Delete business_birthday_alerts referencing products
        await supabase
          .from('business_birthday_alerts')
          .delete()
          .in('product_id', productIds);

        // 4. Delete business_collective_funds referencing products
        await supabase
          .from('business_collective_funds')
          .delete()
          .in('product_id', productIds);

        // 5. Set business_product_id to NULL in collective_funds
        await supabase
          .from('collective_funds')
          .update({ business_product_id: null })
          .in('business_product_id', productIds);

        // 6. Delete user_favorites referencing products
        await supabase
          .from('favorites')
          .delete()
          .in('product_id', productIds);
      }

      // 7. Delete products
      await supabase
        .from('products')
        .delete()
        .eq('business_account_id', businessId);

      // 8. Delete categories
      await supabase
        .from('business_categories')
        .delete()
        .eq('business_owner_id', businessUserId);

      // 9. Handle funds - disassociate or delete
      const { data: funds } = await supabase
        .from('collective_funds')
        .select('id, fund_contributions(id)')
        .eq('created_by_business_id', businessId);

      if (funds) {
        const fundsWithContribs = funds.filter(f => 
          Array.isArray(f.fund_contributions) && f.fund_contributions.length > 0
        );
        const fundsWithoutContribs = funds.filter(f => 
          !Array.isArray(f.fund_contributions) || f.fund_contributions.length === 0
        );

        // Disassociate funds with contributions
        if (fundsWithContribs.length > 0) {
          await supabase
            .from('collective_funds')
            .update({ created_by_business_id: null })
            .in('id', fundsWithContribs.map(f => f.id));
        }

        // Delete empty funds
        if (fundsWithoutContribs.length > 0) {
          const fundIds = fundsWithoutContribs.map(f => f.id);
          await supabase.from('fund_comments').delete().in('fund_id', fundIds);
          await supabase.from('fund_activities').delete().in('fund_id', fundIds);
          await supabase.from('collective_funds').delete().in('id', fundIds);
        }
      }

      // 10. Delete orders
      await supabase
        .from('business_orders')
        .delete()
        .eq('business_account_id', businessId);

      // 11. Delete archive
      await supabase
        .from('deleted_business_archives')
        .delete()
        .eq('business_id', businessId);

      // 12. Delete business account
      const { error } = await supabase
        .from('business_accounts')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      // 8. Log the action
      if (user) {
        await logAdminAction(
          'hard_delete_business',
          'business',
          businessId,
          `Business "${businessToHardDelete.business_name}" supprimé définitivement`,
          { business_name: businessToHardDelete.business_name }
        );
      }

      toast.success(`✅ "${businessToHardDelete.business_name}" supprimé définitivement`, { id: toastId });
      setShowHardDeleteDialog(false);
      setBusinessToHardDelete(null);
      fetchDeletedBusinesses();
    } catch (error) {
      console.error('Error hard deleting business:', error);
      toast.error('Erreur lors de la suppression définitive', { id: toastId });
    } finally {
      setHardDeleting(null);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.business_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expiringCount = businesses.filter(b => (b.days_remaining || 0) <= 7).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🗑️ Corbeille Business</h1>
          <p className="text-muted-foreground mt-1">
            Les business supprimés sont conservés 30 jours avant suppression définitive
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total dans la corbeille</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businesses.length}</div>
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
              <CardTitle className="text-sm font-medium">Produits archivés</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {businesses.reduce((sum, b) => sum + (b.archived_data?.products?.count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>Business supprimés</CardTitle>
            <CardDescription>
              Restaurez ou supprimez définitivement les business de la corbeille
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
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
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">La corbeille est vide</p>
                <p className="text-sm">Aucun business supprimé</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Supprimé le</TableHead>
                      <TableHead>Supprimé par</TableHead>
                      <TableHead>Données archivées</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{business.business_name}</p>
                              <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white">
                                <Trash2 className="mr-1 h-3 w-3" />
                                Supprimé
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {business.business_type || 'Non spécifié'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">
                                {format(new Date(business.deleted_at), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(business.deleted_at), { 
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
                              {business.deleted_by_first_name && business.deleted_by_last_name
                                ? `${business.deleted_by_first_name} ${business.deleted_by_last_name}`
                                : 'Inconnu'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {business.archived_data?.products?.count ? (
                              <Badge variant="secondary" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                {business.archived_data.products.count} produits
                              </Badge>
                            ) : null}
                            {business.archived_data?.orders?.count ? (
                              <Badge variant="secondary" className="text-xs">
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                {business.archived_data.orders.count} commandes
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(business.days_remaining || 0) <= 7 ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {business.days_remaining}j
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {business.days_remaining}j restants
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestore(business)}
                              disabled={restoring === business.id}
                            >
                              {restoring === business.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Restaurer
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setBusinessToHardDelete(business);
                                setShowHardDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
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
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer définitivement{' '}
                <strong>"{businessToHardDelete?.business_name}"</strong> ?
                <br /><br />
                Cette action est <strong>IRRÉVERSIBLE</strong>. Toutes les données seront
                perdues à jamais (produits, commandes, catégories...).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={!!hardDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleHardDelete}
                disabled={!!hardDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
