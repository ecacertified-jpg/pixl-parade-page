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
      const { error } = await supabase
        .from('business_accounts')
        .update({ is_active: active })
        .eq('id', businessId);

      if (error) throw error;

      toast.success(active ? 'Prestataire activé' : 'Prestataire désactivé');
      fetchBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Erreur lors de la mise à jour');
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
                        {business.is_verified ? (
                          <Badge variant="default">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="mr-1 h-3 w-3" />
                            En attente
                          </Badge>
                        )}
                        {!business.is_active && (
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
                          {!business.is_verified && (
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
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(business.id, !business.is_active)}
                          >
                            {business.is_active ? 'Désactiver' : 'Activer'}
                          </DropdownMenuItem>
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
        
        {/* Modal */}
        <BusinessProfileModal
          businessId={selectedBusinessId}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
        />
      </div>
    </AdminLayout>
  );
}
