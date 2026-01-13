import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreVertical, CheckCircle, XCircle, Clock, CheckCheck, Loader2, Shield, Power, Download, Filter, X, Calendar, Building2, Pencil, Trash2 } from 'lucide-react';
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
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { RejectBusinessModal } from '@/components/admin/RejectBusinessModal';
import { BusinessPerformanceAlertsBanner } from '@/components/admin/BusinessPerformanceAlertsBanner';
import { AddBusinessAccountModal } from '@/components/admin/AddBusinessAccountModal';
import { UnifyBusinessAccountsModal } from '@/components/admin/UnifyBusinessAccountsModal';
import { AdminAddProductModal } from '@/components/admin/AdminAddProductModal';
import { AdminEditBusinessModal } from '@/components/admin/AdminEditBusinessModal';
import { AdminAddBusinessToOwnerModal } from '@/components/admin/AdminAddBusinessToOwnerModal';
import { AdminManageCategoriesModal } from '@/components/admin/AdminManageCategoriesModal';
import { AdminOrdersModal } from '@/components/admin/AdminOrdersModal';
import { CascadeDeleteBusinessModal } from '@/components/CascadeDeleteBusinessModal';
import { useAdmin } from '@/hooks/useAdmin';
import { GitMerge, Package, UserPlus, Tag, ShoppingCart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
}

export default function BusinessManagement() {
  const { isSuperAdmin } = useAdmin();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [businessToReject, setBusinessToReject] = useState<Business | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'verify' | 'approve' | 'deactivate' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [addBusinessModalOpen, setAddBusinessModalOpen] = useState(false);
  const [unifyBusinessModalOpen, setUnifyBusinessModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addBusinessToOwnerModalOpen, setAddBusinessToOwnerModalOpen] = useState(false);
  const [editBusinessModalOpen, setEditBusinessModalOpen] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState<Business | null>(null);
  const [productBusinessId, setProductBusinessId] = useState<string | null>(null);
  const [manageCategoriesModalOpen, setManageCategoriesModalOpen] = useState(false);
  const [categoryBusiness, setCategoryBusiness] = useState<Business | null>(null);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [ordersBusiness, setOrdersBusiness] = useState<Business | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Get unique business types for filter
  const businessTypes = [...new Set(businesses.map(b => b.business_type).filter(Boolean))] as string[];

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, user_id, business_name, business_type, email, phone, address, description, website_url, is_verified, is_active, status, rejection_reason, corrections_message, created_at, updated_at')
        .is('deleted_at', null) // Exclure les business supprimés
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
      const business = businesses.find(b => b.id === businessId);
      const { error } = await supabase
        .from('business_accounts')
        .update({ is_verified: verify })
        .eq('id', businessId);

      if (error) throw error;

      toast.success(verify ? 'Prestataire vérifié' : 'Vérification retirée');
      
      // Send notification to super admins
      if (verify && business) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user?.id)
          .single();
        
        const adminName = [adminProfile?.first_name, adminProfile?.last_name].filter(Boolean).join(' ') || 'Admin';
        
        await supabase.functions.invoke('admin-notify-critical', {
          body: {
            type: 'business_verification',
            title: 'Prestataire vérifié',
            message: `${business.business_name} a été vérifié par ${adminName}`,
            adminName,
            entityId: businessId,
            entityType: 'business',
            actionUrl: '/admin/businesses',
            metadata: { business_name: business.business_name, business_type: business.business_type }
          }
        });
      }
      
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleActive = async (businessId: string, active: boolean) => {
    try {
      const business = businesses.find(b => b.id === businessId);
      const { error } = await supabase
        .from('business_accounts')
        .update({ 
          is_active: active,
          status: active ? 'active' : 'inactive',
        })
        .eq('id', businessId);

      if (error) throw error;
      toast.success(active ? 'Prestataire activé' : 'Prestataire désactivé');
      
      // Send notification to super admins
      if (business) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user?.id)
          .single();
        
        const adminName = [adminProfile?.first_name, adminProfile?.last_name].filter(Boolean).join(' ') || 'Admin';
        
        await supabase.functions.invoke('admin-notify-critical', {
          body: {
            type: active ? 'business_approval' : 'business_rejection',
            title: active ? 'Prestataire activé' : 'Prestataire désactivé',
            message: `${business.business_name} a été ${active ? 'activé' : 'désactivé'} par ${adminName}`,
            adminName,
            entityId: businessId,
            entityType: 'business',
            actionUrl: '/admin/businesses',
            metadata: { business_name: business.business_name, business_type: business.business_type }
          }
        });
      }
      
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleRejectBusiness = async (reason: string) => {
    if (!businessToReject) return;

    try {
      const { error } = await supabase
        .from('business_accounts')
        .update({ 
          is_active: false,
          status: 'rejected',
          rejection_reason: reason,
          rejection_date: new Date().toISOString(),
        })
        .eq('id', businessToReject.id);

      if (error) throw error;
      
      // Send notification to super admins
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .single();
      
      const adminName = [adminProfile?.first_name, adminProfile?.last_name].filter(Boolean).join(' ') || 'Admin';
      
      await supabase.functions.invoke('admin-notify-critical', {
        body: {
          type: 'business_rejection',
          title: 'Prestataire rejeté',
          message: `${businessToReject.business_name} a été rejeté par ${adminName}`,
          adminName,
          entityId: businessToReject.id,
          entityType: 'business',
          actionUrl: '/admin/businesses',
          metadata: { 
            business_name: businessToReject.business_name, 
            business_type: businessToReject.business_type,
            reason 
          }
        }
      });
      
      toast.success('Prestataire désactivé');
      setBusinessToReject(null);
      setRejectModalOpen(false);
      fetchBusinesses();
    } catch (error) {
      console.error('Error rejecting business:', error);
      toast.error('Erreur lors de la désactivation');
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    // Text search filter
    const name = business.business_name?.toLowerCase() || '';
    const type = business.business_type?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || type.includes(query);

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        matchesStatus = business.status === 'pending' || business.status === 'resubmitted';
      } else if (statusFilter === 'active') {
        matchesStatus = business.status === 'active' && business.is_active;
      } else if (statusFilter === 'rejected') {
        matchesStatus = business.status === 'rejected';
      } else if (statusFilter === 'verified') {
        matchesStatus = business.is_verified === true;
      } else if (statusFilter === 'unverified') {
        matchesStatus = business.is_verified === false && business.is_active;
      }
    }

    // Type filter
    const matchesType = typeFilter === 'all' || business.business_type === typeFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const createdAt = new Date(business.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (dateFilter === 'today') {
        matchesDate = daysDiff === 0;
      } else if (dateFilter === 'week') {
        matchesDate = daysDiff <= 7;
      } else if (dateFilter === 'month') {
        matchesDate = daysDiff <= 30;
      } else if (dateFilter === '3months') {
        matchesDate = daysDiff <= 90;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Count active filters
  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    dateFilter !== 'all'
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
    setSearchQuery('');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Export CSV function
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nom du business',
      'Type',
      'Email',
      'Téléphone',
      'Adresse',
      'Description',
      'Site web',
      'Vérifié',
      'Actif',
      'Statut',
      'Raison du rejet',
      'Message de correction',
      'Date d\'inscription',
      'Dernière mise à jour'
    ];

    const csvData = filteredBusinesses.map(business => [
      business.id,
      business.business_name || '',
      business.business_type || '',
      business.email || '',
      business.phone || '',
      business.address || '',
      (business.description || '').replace(/[\n\r]/g, ' ').replace(/"/g, '""'),
      business.website_url || '',
      business.is_verified ? 'Oui' : 'Non',
      business.is_active ? 'Oui' : 'Non',
      business.status || '',
      (business.rejection_reason || '').replace(/[\n\r]/g, ' ').replace(/"/g, '""'),
      (business.corrections_message || '').replace(/[\n\r]/g, ' ').replace(/"/g, '""'),
      business.created_at ? formatDate(business.created_at) : '',
      business.updated_at ? formatDate(business.updated_at) : ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    // Add BOM for Excel compatibility with French characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prestataires_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`${filteredBusinesses.length} prestataire(s) exporté(s)`);
  };

  // Bulk selection helpers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBusinesses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBusinesses.map(b => b.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Get counts for bulk actions
  const getSelectedForVerification = () => 
    filteredBusinesses.filter(b => selectedIds.has(b.id) && b.is_active && !b.is_verified);
  const getSelectedForApproval = () => 
    filteredBusinesses.filter(b => selectedIds.has(b.id) && !b.is_active && (b.status === 'pending' || b.status === 'resubmitted'));
  const getSelectedForDeactivation = () => 
    filteredBusinesses.filter(b => selectedIds.has(b.id) && b.is_active);

  // Bulk action handlers
  const handleBulkVerify = async () => {
    const toVerify = getSelectedForVerification();
    if (toVerify.length === 0) return;

    try {
      setBulkProcessing(true);
      const ids = toVerify.map(b => b.id);

      const { error } = await supabase
        .from('business_accounts')
        .update({ is_verified: true })
        .in('id', ids);

      if (error) throw error;

      toast.success(`${ids.length} compte(s) vérifié(s) avec succès`);
      setSelectedIds(new Set());
      fetchBusinesses();
    } catch (error) {
      console.error('Bulk verify error:', error);
      toast.error('Erreur lors de la vérification en masse');
    } finally {
      setBulkProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleBulkApprove = async () => {
    const toApprove = getSelectedForApproval();
    if (toApprove.length === 0) return;

    try {
      setBulkProcessing(true);
      const ids = toApprove.map(b => b.id);

      const { error } = await supabase
        .from('business_accounts')
        .update({ is_active: true, status: 'active' })
        .in('id', ids);

      if (error) throw error;

      // Log approvals
      const { data: { user } } = await supabase.auth.getUser();
      const logs = toApprove.map(b => ({
        business_account_id: b.id,
        business_name: b.business_name,
        business_email: b.email,
        business_type: b.business_type,
        action: 'approved' as const,
        admin_user_id: user?.id,
      }));
      await supabase.from('business_registration_logs').insert(logs);

      toast.success(`${ids.length} compte(s) approuvé(s) avec succès`);
      setSelectedIds(new Set());
      fetchBusinesses();
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast.error('Erreur lors de l\'approbation en masse');
    } finally {
      setBulkProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const handleBulkDeactivate = async () => {
    const toDeactivate = getSelectedForDeactivation();
    if (toDeactivate.length === 0) return;

    try {
      setBulkProcessing(true);
      const ids = toDeactivate.map(b => b.id);

      const { error } = await supabase
        .from('business_accounts')
        .update({ is_active: false, status: 'pending' })
        .in('id', ids);

      if (error) throw error;

      toast.success(`${ids.length} compte(s) désactivé(s)`);
      setSelectedIds(new Set());
      fetchBusinesses();
    } catch (error) {
      console.error('Bulk deactivate error:', error);
      toast.error('Erreur lors de la désactivation en masse');
    } finally {
      setBulkProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  const confirmBulkAction = () => {
    if (bulkAction === 'verify') handleBulkVerify();
    else if (bulkAction === 'approve') handleBulkApprove();
    else if (bulkAction === 'deactivate') handleBulkDeactivate();
  };

  const getBulkActionDescription = () => {
    if (bulkAction === 'verify') {
      return `Vous êtes sur le point de vérifier ${getSelectedForVerification().length} compte(s) prestataire(s).`;
    } else if (bulkAction === 'approve') {
      return `Vous êtes sur le point d'approuver ${getSelectedForApproval().length} compte(s) prestataire(s).`;
    } else if (bulkAction === 'deactivate') {
      return `Vous êtes sur le point de désactiver ${getSelectedForDeactivation().length} compte(s) prestataire(s).`;
    }
    return '';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestion des prestataires</h1>
            <p className="text-muted-foreground mt-2">
              Gérer et valider les comptes business
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => setAddBusinessToOwnerModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ajouter à un prestataire</span>
              </Button>
            )}
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => setUnifyBusinessModalOpen(true)}>
                <GitMerge className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Unifier</span>
              </Button>
            )}
            {isSuperAdmin && (
              <Button onClick={() => setAddBusinessModalOpen(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouveau prestataire</span>
              </Button>
            )}
          </div>
        </div>

        {/* Performance Alerts Banner */}
        <BusinessPerformanceAlertsBanner />

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle>
                  Tous les prestataires ({filteredBusinesses.length}
                  {filteredBusinesses.length !== businesses.length && ` / ${businesses.length}`})
                </CardTitle>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground self-start sm:self-auto"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Effacer les filtres ({activeFiltersCount})
                  </Button>
                )}
              </div>
              
              {/* Search and actions row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:flex-none sm:w-64 order-1 sm:order-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
                <div className="flex gap-2 order-2 sm:order-1">
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 sm:flex-none"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    disabled={filteredBusinesses.length === 0}
                    className="flex-1 sm:flex-none"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Exporter CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 sm:flex-none"
                  >
                    <Link to="/admin/deleted-businesses">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Corbeille</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Statut</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                          <SelectItem value="verified">Vérifié</SelectItem>
                          <SelectItem value="unverified">Non vérifié</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Type de business</label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les types</SelectItem>
                          {businessTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Filter */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-full">
                          <Calendar className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Toutes les dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les dates</SelectItem>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="week">7 derniers jours</SelectItem>
                          <SelectItem value="month">30 derniers jours</SelectItem>
                          <SelectItem value="3months">3 derniers mois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="mb-4 p-3 bg-muted/50 border border-border rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{selectedIds.size}</span>
                    </div>
                    <span className="font-medium text-sm">
                      prestataire{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                      {getSelectedForVerification().length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-background border-primary/30 text-primary hover:bg-primary/10 hover:border-primary whitespace-nowrap"
                          onClick={() => {
                            setBulkAction('verify');
                            setConfirmDialogOpen(true);
                          }}
                          disabled={bulkProcessing}
                        >
                          <Shield className="mr-1.5 h-4 w-4" />
                          Vérifier
                          <Badge variant="secondary" className="ml-1.5 bg-primary/20 text-primary text-xs px-1.5 py-0">
                            {getSelectedForVerification().length}
                          </Badge>
                        </Button>
                      )}
                      {getSelectedForApproval().length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-background border-green-500/30 text-green-600 hover:bg-green-50 hover:border-green-500 whitespace-nowrap dark:hover:bg-green-950"
                          onClick={() => {
                            setBulkAction('approve');
                            setConfirmDialogOpen(true);
                          }}
                          disabled={bulkProcessing}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Approuver
                          <Badge variant="secondary" className="ml-1.5 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 text-xs px-1.5 py-0">
                            {getSelectedForApproval().length}
                          </Badge>
                        </Button>
                      )}
                      {getSelectedForDeactivation().length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-background border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive whitespace-nowrap"
                          onClick={() => {
                            setBulkAction('deactivate');
                            setConfirmDialogOpen(true);
                          }}
                          disabled={bulkProcessing}
                        >
                          <Power className="mr-1.5 h-4 w-4" />
                          Désactiver
                          <Badge variant="secondary" className="ml-1.5 bg-destructive/20 text-destructive text-xs px-1.5 py-0">
                            {getSelectedForDeactivation().length}
                          </Badge>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredBusinesses.length && filteredBusinesses.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nom du business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id} className={selectedIds.has(business.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(business.id)}
                        onCheckedChange={() => toggleSelect(business.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{business.business_name}</TableCell>
                    <TableCell>{business.business_type || 'Non spécifié'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {business.email && <div>{business.email}</div>}
                        {business.phone && <div>{business.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(business.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {business.status === 'deleted' && (
                          <Badge variant="secondary" className="bg-gray-500 hover:bg-gray-600 text-white">
                            <Trash2 className="mr-1 h-3 w-3" />
                            Supprimé
                          </Badge>
                        )}
                        {business.status === 'rejected' && (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Rejeté
                          </Badge>
                        )}
                        {business.status === 'resubmitted' && (
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            <Clock className="mr-1 h-3 w-3" />
                            Réinscrit
                          </Badge>
                        )}
                        {business.status === 'pending' && (
                          <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                            <Clock className="mr-1 h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                        {business.status === 'active' && business.is_verified && (
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Actif & Vérifié
                          </Badge>
                        )}
                        {business.status === 'active' && !business.is_verified && (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Actif (non vérifié)
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {business.status === 'resubmitted' && business.corrections_message && (
                            <DropdownMenuItem
                              onClick={() => {
                                toast.info('Corrections apportées', {
                                  description: business.corrections_message,
                                  duration: 8000,
                                });
                              }}
                              className="text-blue-600 font-medium"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Voir les corrections
                            </DropdownMenuItem>
                          )}
                          {business.status === 'rejected' && business.rejection_reason && (
                            <DropdownMenuItem
                              onClick={() => {
                                toast.info('Raison du rejet', {
                                  description: business.rejection_reason,
                                  duration: 8000,
                                });
                              }}
                              className="text-red-600 font-medium"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Voir la raison du rejet
                            </DropdownMenuItem>
                          )}
                          {(business.status === 'pending' || business.status === 'resubmitted') && !business.is_active && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(business.id, true)}
                                className="text-green-600 font-medium"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approuver le compte
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setBusinessToReject(business);
                                  setRejectModalOpen(true);
                                }}
                                className="text-destructive font-medium"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter la demande
                              </DropdownMenuItem>
                            </>
                          )}
                          {business.status === 'active' && !business.is_verified && (
                            <DropdownMenuItem
                              onClick={() => handleVerifyBusiness(business.id, true)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Vérifier le prestataire
                            </DropdownMenuItem>
                          )}
                          {business.is_verified && (
                            <DropdownMenuItem
                              onClick={() => handleVerifyBusiness(business.id, false)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Retirer la vérification
                            </DropdownMenuItem>
                          )}
                          {business.status === 'active' && business.is_active && (
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(business.id, false)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Désactiver le compte
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedBusinessId(business.id);
                            setProfileModalOpen(true);
                          }}>
                            Voir le profil complet
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setProductBusinessId(business.id);
                                setAddProductModalOpen(true);
                              }}>
                                <Package className="mr-2 h-4 w-4" />
                                Ajouter un produit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setBusinessToEdit(business);
                                setEditBusinessModalOpen(true);
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier le business
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setCategoryBusiness(business);
                                setManageCategoriesModalOpen(true);
                              }}>
                                <Tag className="mr-2 h-4 w-4" />
                                Gérer les catégories
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setOrdersBusiness(business);
                                setOrdersModalOpen(true);
                              }}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Voir les commandes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setBusinessToDelete(business);
                                  setDeleteModalOpen(true);
                                }}
                                className="text-destructive font-medium"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer le business
                              </DropdownMenuItem>
                            </>
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
        <BusinessProfileModal
          businessId={selectedBusinessId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          onBusinessUpdated={fetchBusinesses}
        />
        
        <RejectBusinessModal
          open={rejectModalOpen}
          onOpenChange={setRejectModalOpen}
          businessName={businessToReject?.business_name || ''}
          onConfirm={handleRejectBusiness}
        />

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l'action en masse</AlertDialogTitle>
              <AlertDialogDescription>
                {getBulkActionDescription()}
                <br />
                Cette action ne peut pas être annulée automatiquement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkProcessing}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkAction} disabled={bulkProcessing}>
                {bulkProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Confirmer'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AddBusinessAccountModal
          open={addBusinessModalOpen}
          onOpenChange={setAddBusinessModalOpen}
          onSuccess={fetchBusinesses}
        />

        <UnifyBusinessAccountsModal
          open={unifyBusinessModalOpen}
          onOpenChange={setUnifyBusinessModalOpen}
          onMergeComplete={fetchBusinesses}
        />

        {/* Super Admin Modals */}
        <AdminAddProductModal
          open={addProductModalOpen}
          onOpenChange={setAddProductModalOpen}
          onProductAdded={fetchBusinesses}
          preselectedBusinessId={productBusinessId || undefined}
        />

        <AdminEditBusinessModal
          business={businessToEdit as any}
          open={editBusinessModalOpen}
          onOpenChange={(open) => {
            setEditBusinessModalOpen(open);
            if (!open) setBusinessToEdit(null);
          }}
          onBusinessUpdated={fetchBusinesses}
        />

        <AdminAddBusinessToOwnerModal
          open={addBusinessToOwnerModalOpen}
          onOpenChange={setAddBusinessToOwnerModalOpen}
          onBusinessAdded={fetchBusinesses}
        />

        <AdminManageCategoriesModal
          businessId={categoryBusiness?.id || null}
          businessOwnerId={categoryBusiness?.user_id || null}
          businessName={categoryBusiness?.business_name || ''}
          open={manageCategoriesModalOpen}
          onOpenChange={(open) => {
            setManageCategoriesModalOpen(open);
            if (!open) setCategoryBusiness(null);
          }}
        />

        <AdminOrdersModal
          businessId={ordersBusiness?.id || null}
          businessName={ordersBusiness?.business_name || ''}
          open={ordersModalOpen}
          onOpenChange={(open) => {
            setOrdersModalOpen(open);
            if (!open) setOrdersBusiness(null);
          }}
        />

        {businessToDelete && (
          <CascadeDeleteBusinessModal
            open={deleteModalOpen}
            onOpenChange={(open) => {
              setDeleteModalOpen(open);
              if (!open) setBusinessToDelete(null);
            }}
            business={{
              id: businessToDelete.id,
              business_name: businessToDelete.business_name,
              opening_hours: {},
              delivery_zones: [],
              payment_info: {},
              delivery_settings: { free_delivery_threshold: 0, standard_cost: 0 }
            }}
            onDeleted={() => {
              setDeleteModalOpen(false);
              setBusinessToDelete(null);
              fetchBusinesses();
              toast.success('Business supprimé avec succès');
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
