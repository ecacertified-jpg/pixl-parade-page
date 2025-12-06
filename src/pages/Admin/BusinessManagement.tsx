import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreVertical, CheckCircle, XCircle, Clock, CheckCheck, Loader2, Shield, Power, Download } from 'lucide-react';
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

interface Business {
  id: string;
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

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, email, phone, address, description, website_url, is_verified, is_active, status, rejection_reason, corrections_message, created_at, updated_at')
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
      const { error } = await supabase
        .from('business_accounts')
        .update({ is_verified: verify })
        .eq('id', businessId);

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
      // Get business info for notification
      const { data: business } = await supabase
        .from('business_accounts')
        .select('user_id, business_name, email, business_type')
        .eq('id', businessId)
        .single();

      const { error } = await supabase
        .from('business_accounts')
        .update({ 
          is_active: active,
          status: active ? 'active' : 'pending',
        })
        .eq('id', businessId);

      if (error) throw error;

      // If activating (approving), send notification to business owner
      if (active && business) {
        // Log approval action
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('business_registration_logs').insert({
          business_account_id: businessId,
          business_name: business.business_name,
          business_email: business.email,
          business_type: business.business_type,
          action: 'approved',
          admin_user_id: user?.id,
        });

        await supabase.from('scheduled_notifications').insert({
          user_id: business.user_id,
          notification_type: 'business_approved',
          title: 'Compte business approuvé !',
          message: `Félicitations ! Votre compte business "${business.business_name}" a été approuvé. Vous pouvez maintenant accéder à Mon Espace Business et commencer à vendre vos produits.`,
          scheduled_for: new Date().toISOString(),
          delivery_methods: ['push', 'in_app'],
          metadata: {
            business_id: businessId,
            approved_at: new Date().toISOString(),
          }
        });

        // Send approval email
        if (business.email) {
          console.log(`Sending approval email to ${business.email}`);
          const { error: emailError } = await supabase.functions.invoke('send-business-approval-email', {
            body: {
              business_email: business.email,
              business_name: business.business_name,
              business_type: business.business_type || 'Prestataire',
            }
          });

          if (emailError) {
            console.error('Error sending approval email:', emailError);
          } else {
            console.log('Approval email sent successfully');
          }
        }
      }

      toast.success(active ? 'Prestataire approuvé et notifié' : 'Prestataire désactivé');
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleRejectBusiness = async (reason: string) => {
    if (!businessToReject) return;

    try {
      // Log rejection action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('business_registration_logs').insert({
        business_account_id: businessToReject.id,
        business_name: businessToReject.business_name,
        business_email: businessToReject.email,
        business_type: businessToReject.business_type,
        action: 'rejected',
        rejection_reason: reason,
        admin_user_id: user?.id,
      });

      // Mark business as rejected (don't delete, allow resubmission)
      const { error: updateError } = await supabase
        .from('business_accounts')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejection_date: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', businessToReject.id);

      if (updateError) throw updateError;

      // Send rejection email
      if (businessToReject.email) {
        console.log(`Sending rejection email to ${businessToReject.email}`);
        const { error: emailError } = await supabase.functions.invoke('send-business-rejection-email', {
          body: {
            business_email: businessToReject.email,
            business_name: businessToReject.business_name,
            rejection_reason: reason,
          }
        });

        if (emailError) {
          console.error('Error sending rejection email:', emailError);
          toast.error('Compte rejeté mais l\'email n\'a pas pu être envoyé');
        } else {
          console.log('Rejection email sent successfully');
          toast.success('Demande rejetée et email envoyé au prestataire');
        }
      } else {
        toast.success('Demande rejetée (pas d\'email disponible)');
      }

      fetchBusinesses();
    } catch (error) {
      console.error('Error rejecting business:', error);
      toast.error('Erreur lors du rejet de la demande');
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const name = business.business_name?.toLowerCase() || '';
    const type = business.business_type?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || type.includes(query);
  });

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
        <div>
          <h1 className="text-3xl font-bold">Gestion des prestataires</h1>
          <p className="text-muted-foreground mt-2">
            Gérer et valider les comptes business
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <CardTitle>Tous les prestataires ({businesses.length})</CardTitle>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={filteredBusinesses.length === 0}
                  className="order-2 sm:order-1 w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="font-medium">
                  {selectedIds.size} prestataire(s) sélectionné(s)
                </span>
                <div className="flex gap-2">
                  {getSelectedForVerification().length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkAction('verify');
                        setConfirmDialogOpen(true);
                      }}
                      disabled={bulkProcessing}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Vérifier ({getSelectedForVerification().length})
                    </Button>
                  )}
                  {getSelectedForApproval().length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => {
                        setBulkAction('approve');
                        setConfirmDialogOpen(true);
                      }}
                      disabled={bulkProcessing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approuver ({getSelectedForApproval().length})
                    </Button>
                  )}
                  {getSelectedForDeactivation().length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setBulkAction('deactivate');
                        setConfirmDialogOpen(true);
                      }}
                      disabled={bulkProcessing}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      Désactiver ({getSelectedForDeactivation().length})
                    </Button>
                  )}
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
      </div>
    </AdminLayout>
  );
}
