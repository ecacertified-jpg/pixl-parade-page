import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
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
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { RejectBusinessModal } from '@/components/admin/RejectBusinessModal';

interface Business {
  id: string;
  business_name: string;
  business_type: string | null;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export default function BusinessManagement() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [businessToReject, setBusinessToReject] = useState<Business | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, business_name, business_type, email, phone, is_verified, is_active, created_at')
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
        .update({ is_active: active })
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
      // Log rejection action BEFORE deleting
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

      // Delete the business account
      const { error: deleteError } = await supabase
        .from('business_accounts')
        .delete()
        .eq('id', businessToReject.id);

      if (deleteError) throw deleteError;

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
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tous les prestataires ({businesses.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={business.id}>
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
                      <div className="flex gap-2">
                        {!business.is_active && !business.is_verified && (
                          <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                            <Clock className="mr-1 h-3 w-3" />
                            Approbation requise
                          </Badge>
                        )}
                        {business.is_verified ? (
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Vérifié
                          </Badge>
                        ) : business.is_active && (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            Non vérifié
                          </Badge>
                        )}
                        {!business.is_active && business.is_verified && (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactif
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
                          {!business.is_active && (
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
                          {business.is_active && !business.is_verified && (
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
                          {business.is_active && (
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
      </div>
    </AdminLayout>
  );
}
