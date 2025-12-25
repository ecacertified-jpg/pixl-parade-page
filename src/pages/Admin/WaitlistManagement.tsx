import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Mail, 
  XCircle, 
  Clock, 
  CheckCircle, 
  Users,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Send,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface WaitlistEntry {
  id: string;
  email: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  contact_first_name: string;
  contact_last_name: string;
  city: string | null;
  motivation: string | null;
  position: number;
  status: string;
  invited_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  invited: { label: 'Invité', color: 'bg-blue-100 text-blue-800', icon: Mail },
  converted: { label: 'Converti', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function WaitlistManagement() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('business_waitlist')
        .select('*')
        .order('position', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error('Erreur lors du chargement de la liste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [statusFilter]);

  const filteredEntries = entries.filter(entry => {
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.business_name.toLowerCase().includes(searchLower) ||
      entry.email.toLowerCase().includes(searchLower) ||
      entry.contact_first_name.toLowerCase().includes(searchLower) ||
      entry.contact_last_name.toLowerCase().includes(searchLower)
    );
  });

  const handleInvite = async (entry: WaitlistEntry) => {
    setActionLoading(true);
    try {
      // Generate invitation token
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      // Update waitlist entry
      const { error: updateError } = await supabase
        .from('business_waitlist')
        .update({
          status: 'invited',
          invited_at: new Date().toISOString(),
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          processed_by: user?.id,
        })
        .eq('id', entry.id);

      if (updateError) throw updateError;

      // Send invitation email via edge function
      const { error: emailError } = await supabase.functions.invoke('invite-waitlist-business', {
        body: {
          waitlist_id: entry.id,
          email: entry.email,
          business_name: entry.business_name,
          contact_name: `${entry.contact_first_name} ${entry.contact_last_name}`,
          invitation_token: invitationToken,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success(`Invitation envoyée à ${entry.business_name}`);
      fetchEntries();
    } catch (error) {
      console.error('Error inviting:', error);
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('business_waitlist')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          processed_by: user?.id,
        })
        .eq('id', selectedEntry.id);

      if (error) throw error;

      toast.success('Demande refusée');
      setShowRejectModal(false);
      setSelectedEntry(null);
      setRejectionReason('');
      fetchEntries();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Erreur lors du refus');
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    invited: entries.filter(e => e.status === 'invited').length,
    converted: entries.filter(e => e.status === 'converted').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liste d'attente prestataires</h1>
        <p className="text-muted-foreground">
          Gérez les demandes d'inscription des prestataires
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.invited}</p>
                <p className="text-xs text-muted-foreground">Invités</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.converted}</p>
                <p className="text-xs text-muted-foreground">Convertis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {statusFilter === 'all' ? 'Tous les statuts' : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    Tous les statuts
                  </DropdownMenuItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={fetchEntries} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune entrée trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const status = statusConfig[entry.status];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        #{entry.position}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.business_name}</p>
                          <p className="text-sm text-muted-foreground">{entry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p>{entry.contact_first_name} {entry.contact_last_name}</p>
                        {entry.phone && (
                          <p className="text-sm text-muted-foreground">{entry.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {entry.business_type?.replace('_', ' ') || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedEntry(entry);
                              setShowDetailsModal(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {entry.status === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleInvite(entry)}
                                  disabled={actionLoading}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Envoyer invitation
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedEntry(entry);
                                    setShowRejectModal(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Refuser
                                </DropdownMenuItem>
                              </>
                            )}
                            {entry.status === 'invited' && (
                              <DropdownMenuItem 
                                onClick={() => handleInvite(entry)}
                                disabled={actionLoading}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Renvoyer invitation
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>
              Position #{selectedEntry?.position} dans la file d'attente
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Entreprise</Label>
                  <p className="font-medium">{selectedEntry.business_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="capitalize">{selectedEntry.business_type?.replace('_', ' ') || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p>{selectedEntry.contact_first_name} {selectedEntry.contact_last_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedEntry.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p>{selectedEntry.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ville</Label>
                  <p>{selectedEntry.city || '-'}</p>
                </div>
              </div>
              {selectedEntry.motivation && (
                <div>
                  <Label className="text-muted-foreground">Motivation</Label>
                  <p className="mt-1 text-sm bg-muted/50 rounded-lg p-3">
                    {selectedEntry.motivation}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge className={statusConfig[selectedEntry.status].color}>
                  {statusConfig[selectedEntry.status].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Inscrit le {format(new Date(selectedEntry.created_at), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de refuser la demande de {selectedEntry?.business_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Raison du refus (optionnel)</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du refus..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? 'En cours...' : 'Confirmer le refus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
