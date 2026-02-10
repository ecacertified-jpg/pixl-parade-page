import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, MoreVertical, CheckCircle, XCircle, Clock, CheckCheck, Loader2, Shield, Power,
  Download, Filter, X, Calendar, Building2, Pencil, Trash2, RefreshCw, Store, Package, UserPlus, Tag, ShoppingCart, GitMerge
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { RejectBusinessModal } from '@/components/admin/RejectBusinessModal';
import { AddBusinessAccountModal } from '@/components/admin/AddBusinessAccountModal';
import { UnifyBusinessAccountsModal } from '@/components/admin/UnifyBusinessAccountsModal';
import { AdminAddProductModal } from '@/components/admin/AdminAddProductModal';
import { AdminEditBusinessModal } from '@/components/admin/AdminEditBusinessModal';
import { AdminAddBusinessToOwnerModal } from '@/components/admin/AdminAddBusinessToOwnerModal';
import { AdminManageCategoriesModal } from '@/components/admin/AdminManageCategoriesModal';
import { AdminOrdersModal } from '@/components/admin/AdminOrdersModal';
import { CascadeDeleteBusinessModal } from '@/components/CascadeDeleteBusinessModal';
import { AdminProductsModal } from '@/components/admin/AdminProductsModal';
import { useAdmin } from '@/hooks/useAdmin';
import { getCountryConfig, isValidCountryCode } from '@/config/countries';

interface Business {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  website_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  status: string;
  rejection_reason: string | null;
  corrections_message: string | null;
  created_at: string;
  updated_at: string;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function CountryBusinessesPage() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, hasPermission } = useAdmin();

  const country = countryCode && isValidCountryCode(countryCode) ? getCountryConfig(countryCode) : null;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [businessToReject, setBusinessToReject] = useState<Business | null>(null);
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);
  const [unifyBusinessModalOpen, setUnifyBusinessModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [productBusinessId, setProductBusinessId] = useState<string | null>(null);
  const [editBusinessModalOpen, setEditBusinessModalOpen] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState<Business | null>(null);
  const [addBusinessToOwnerModalOpen, setAddBusinessToOwnerModalOpen] = useState(false);
  const [manageCategoriesModalOpen, setManageCategoriesModalOpen] = useState(false);
  const [categoryBusiness, setCategoryBusiness] = useState<Business | null>(null);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersBusiness, setOrdersBusiness] = useState<Business | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [productsBusiness, setProductsBusiness] = useState<Business | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, [countryCode]);

  const fetchBusinesses = async () => {
    if (!countryCode) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, user_id, business_name, business_type, email, phone, address, description, website_url, is_verified, is_active, status, rejection_reason, corrections_message, created_at, updated_at, country_code, latitude, longitude')
        .eq('country_code', countryCode)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Erreur lors du chargement des prestataires');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBusiness = async (businessId: string, verify: boolean) => {
    try {
      const { error } = await supabase.from('business_accounts').update({ is_verified: verify }).eq('id', businessId);
      if (error) throw error;
      toast.success(verify ? 'Prestataire vérifié' : 'Vérification retirée');
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleActive = async (businessId: string, active: boolean) => {
    try {
      const { error } = await supabase.from('business_accounts').update({ is_active: active, status: active ? 'active' : 'inactive' }).eq('id', businessId);
      if (error) throw error;
      toast.success(active ? 'Prestataire activé' : 'Prestataire désactivé');
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleRejectBusiness = async (reason: string) => {
    if (!businessToReject) return;
    try {
      const { error } = await supabase.from('business_accounts').update({ is_active: false, status: 'rejected', rejection_reason: reason, rejection_date: new Date().toISOString() }).eq('id', businessToReject.id);
      if (error) throw error;
      toast.success('Prestataire rejeté');
      setBusinessToReject(null);
      setRejectModalOpen(false);
      fetchBusinesses();
    } catch (error) {
      console.error('Error rejecting business:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const name = business.business_name?.toLowerCase() || '';
    const type = business.business_type?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || type.includes(query);

    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = business.status === 'pending' || business.status === 'resubmitted';
    else if (statusFilter === 'active') matchesStatus = business.status === 'active' && business.is_active;
    else if (statusFilter === 'rejected') matchesStatus = business.status === 'rejected';
    else if (statusFilter === 'verified') matchesStatus = business.is_verified === true;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');

  const getStatusBadge = (business: Business) => {
    if (business.status === 'rejected') return <Badge variant="destructive" className="text-xs"><XCircle className="mr-1 h-3 w-3" />Rejeté</Badge>;
    if (business.status === 'pending' || business.status === 'resubmitted') return <Badge variant="outline" className="text-xs text-orange-600 border-orange-300"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
    if (!business.is_active) return <Badge variant="secondary" className="text-xs"><Power className="mr-1 h-3 w-3" />Inactif</Badge>;
    if (business.is_verified) return <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"><CheckCheck className="mr-1 h-3 w-3" />Vérifié</Badge>;
    return <Badge variant="outline" className="text-xs"><CheckCircle className="mr-1 h-3 w-3" />Actif</Badge>;
  };

  const pendingCount = businesses.filter(b => b.status === 'pending' || b.status === 'resubmitted').length;
  const activeCount = businesses.filter(b => b.is_active).length;
  const verifiedCount = businesses.filter(b => b.is_verified).length;

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
          <p className="text-muted-foreground">Chargement des prestataires...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <AdminPageHeader
          title={`${country.flag} Entreprises - ${country.name}`}
          description={`${businesses.length} entreprise(s) • ${activeCount} actives • ${verifiedCount} vérifiées`}
          backPath={`/admin/countries/${countryCode}`}
          showCountryIndicator={false}
          actions={
            <div className="flex gap-2 flex-wrap">
              {(isSuperAdmin || hasPermission('manage_businesses')) && (
                <Button onClick={() => setAddBusinessModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter</span>
                </Button>
              )}
              <Button variant="outline" onClick={fetchBusinesses}>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-4 pb-3 text-center">
              <Store className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{businesses.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'pending' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('pending')}>
            <CardContent className="pt-4 pb-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('active')}>
            <CardContent className="pt-4 pb-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'verified' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('verified')}>
            <CardContent className="pt-4 pb-3 text-center">
              <Shield className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{verifiedCount}</p>
              <p className="text-xs text-muted-foreground">Vérifiées</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher par nom ou type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">{filteredBusinesses.length} entreprise(s) trouvée(s)</p>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Aucune entreprise trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBusinesses.map((business) => (
                      <TableRow key={business.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedBusinessId(business.id); setProfileModalOpen(true); }}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{business.business_name}</p>
                            <p className="text-xs text-muted-foreground">{business.email || business.phone || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{business.business_type || '—'}</TableCell>
                        <TableCell>{getStatusBadge(business)}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{formatDate(business.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedBusinessId(business.id); setProfileModalOpen(true); }}>
                                <Building2 className="h-4 w-4 mr-2" />Voir le profil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setProductsBusiness(business); setProductsModalOpen(true); }}>
                                <Package className="h-4 w-4 mr-2" />Produits
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setOrdersBusiness(business); setOrdersModalOpen(true); }}>
                                <ShoppingCart className="h-4 w-4 mr-2" />Commandes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setCategoryBusiness(business); setManageCategoriesModalOpen(true); }}>
                                <Tag className="h-4 w-4 mr-2" />Catégories
                              </DropdownMenuItem>
                              {(isSuperAdmin || hasPermission('manage_businesses')) && (
                                <>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setBusinessToEdit(business); setEditBusinessModalOpen(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" />Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleVerifyBusiness(business.id, !business.is_verified); }}>
                                    <Shield className="h-4 w-4 mr-2" />{business.is_verified ? 'Retirer vérification' : 'Vérifier'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleActive(business.id, !business.is_active); }}>
                                    <Power className="h-4 w-4 mr-2" />{business.is_active ? 'Désactiver' : 'Activer'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setBusinessToReject(business); setRejectModalOpen(true); }}>
                                    <XCircle className="h-4 w-4 mr-2" />Rejeter
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isSuperAdmin && (
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setBusinessToDelete(business); setDeleteModalOpen(true); }}>
                                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                </DropdownMenuItem>
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
      {selectedBusinessId && (
        <BusinessProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} businessId={selectedBusinessId} onBusinessUpdated={fetchBusinesses} />
      )}
      <RejectBusinessModal open={rejectModalOpen} onOpenChange={setRejectModalOpen} onConfirm={handleRejectBusiness} businessName={businessToReject?.business_name || ''} />
      <AddBusinessAccountModal open={addBusinessModalOpen} onOpenChange={setAddBusinessModalOpen} onSuccess={fetchBusinesses} />
      <UnifyBusinessAccountsModal open={unifyBusinessModalOpen} onOpenChange={setUnifyBusinessModalOpen} onMergeComplete={fetchBusinesses} />
      {productBusinessId && (
        <AdminAddProductModal open={addProductModalOpen} onOpenChange={setAddProductModalOpen} onProductAdded={fetchBusinesses} preselectedBusinessId={productBusinessId} />
      )}
      {businessToEdit && (
        <AdminEditBusinessModal open={editBusinessModalOpen} onOpenChange={setEditBusinessModalOpen} business={businessToEdit} onBusinessUpdated={fetchBusinesses} />
      )}
      <AdminAddBusinessToOwnerModal open={addBusinessToOwnerModalOpen} onOpenChange={setAddBusinessToOwnerModalOpen} onBusinessAdded={fetchBusinesses} />
      {categoryBusiness && (
        <AdminManageCategoriesModal open={manageCategoriesModalOpen} onOpenChange={setManageCategoriesModalOpen} businessId={categoryBusiness.id} businessOwnerId={categoryBusiness.user_id} businessName={categoryBusiness.business_name} />
      )}
      {ordersBusiness && (
        <AdminOrdersModal open={ordersModalOpen} onOpenChange={setOrdersModalOpen} businessId={ordersBusiness.id} businessName={ordersBusiness.business_name} />
      )}
      {businessToDelete && (
        <CascadeDeleteBusinessModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} business={businessToDelete as any} onDeleted={fetchBusinesses} />
      )}
      {productsBusiness && (
        <AdminProductsModal open={productsModalOpen} onOpenChange={setProductsModalOpen} businessId={productsBusiness.id} businessName={productsBusiness.business_name} />
      )}
    </AdminLayout>
  );
}
