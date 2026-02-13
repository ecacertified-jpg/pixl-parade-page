import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CountryBadge } from '@/components/CountryBadge';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { Users, Store, Plus, Trash2, Loader2, MoreHorizontal, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SelfAssignModal } from '@/components/admin/SelfAssignModal';

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country_code: string | null;
  birthday: string | null;
  city: string | null;
  bio: string | null;
  created_at: string | null;
  is_suspended: boolean | null;
}

interface BusinessDetail {
  id: string;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  created_at: string | null;
  status: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
}

interface UserAssignment {
  id: string;
  user_id: string;
  created_at: string;
  profile?: UserProfile;
}

interface BusinessAssignment {
  id: string;
  business_account_id: string;
  created_at: string;
  business?: BusinessDetail;
}

function calculateProfileCompletion(p?: UserProfile | null) {
  if (!p) return { percentage: 0, details: [] as { label: string; done: boolean }[] };
  const fields = [
    { label: 'Prénom', done: !!p.first_name, weight: 15 },
    { label: 'Nom', done: !!p.last_name, weight: 15 },
    { label: 'Téléphone', done: !!p.phone, weight: 15 },
    { label: 'Ville', done: !!p.city, weight: 15 },
    { label: 'Anniversaire', done: !!p.birthday, weight: 15 },
    { label: 'Photo', done: !!p.avatar_url, weight: 15 },
    { label: 'Bio', done: !!p.bio, weight: 10 },
  ];
  const percentage = fields.reduce((sum, f) => sum + (f.done ? f.weight : 0), 0);
  return { percentage, details: fields };
}

function getStatusBadge(status: string | null, isActive: boolean | null, isVerified: boolean | null) {
  if (status === 'rejected') return <Badge variant="destructive">Rejeté</Badge>;
  if (!isActive) return <Badge variant="outline" className="text-muted-foreground">Inactif</Badge>;
  if (isVerified) return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">Vérifié</Badge>;
  if (status === 'pending') return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">En attente</Badge>;
  return <Badge variant="secondary">Actif</Badge>;
}

const MyAssignments = () => {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [businessAssignments, setBusinessAssignments] = useState<BusinessAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessProfileModalOpen, setBusinessProfileModalOpen] = useState(false);

  useEffect(() => {
    if (user) loadAdminId();
  }, [user]);

  const loadAdminId = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      setAdminId(data.id);
      loadAssignments(data.id);
    } else {
      setLoading(false);
    }
  };

  const loadAssignments = async (aid: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const baseUrl = `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/admin-manage-assignments`;
      const res = await fetch(`${baseUrl}?admin_id=${aid}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
        },
      });
      const data = await res.json();
      setUserAssignments(data.user_assignments || []);
      setBusinessAssignments(data.business_assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignmentId: string, type: 'user' | 'business') => {
    if (!adminId) return;
    setRemoving(assignmentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const baseUrl = `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/admin-manage-assignments`;
      const res = await fetch(baseUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId, assignment_ids: [assignmentId], type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Erreur serveur');
      }
      toast.success('Affectation retirée');
      loadAssignments(adminId);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setRemoving(null);
    }
  };

  const getInitials = (first?: string | null, last?: string | null) =>
    `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes affectations</h1>
            <p className="text-muted-foreground">Gérez vos utilisateurs et entreprises assignés</p>
          </div>
          <Button onClick={() => setModalOpen(true)} disabled={!adminId}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" /> Utilisateurs ({userAssignments.length})
              </TabsTrigger>
              <TabsTrigger value="businesses" className="gap-2">
                <Store className="h-4 w-4" /> Entreprises ({businessAssignments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mes utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  {userAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun utilisateur assigné. Cliquez sur "Ajouter" pour commencer.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Complétion</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userAssignments.map(a => {
                          const { percentage, details } = calculateProfileCompletion(a.profile);
                          return (
                            <TableRow key={a.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={a.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">{getInitials(a.profile?.first_name, a.profile?.last_name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {a.profile?.first_name || ''} {a.profile?.last_name || ''}
                                    </p>
                                    {a.profile?.is_suspended && (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Suspendu</Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <CountryBadge countryCode={a.profile?.country_code} variant="compact" />
                              </TableCell>
                              <TableCell className="text-sm">
                                {a.profile?.phone || <span className="text-muted-foreground italic">Non renseigné</span>}
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2 min-w-[120px]">
                                        <Progress value={percentage} className="h-2 flex-1" />
                                        <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs space-y-1">
                                      {details.map(d => (
                                        <div key={d.label} className="flex items-center gap-1.5">
                                          <span>{d.done ? '✅' : '❌'}</span>
                                          <span>{d.label}</span>
                                        </div>
                                      ))}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-sm">
                                {a.profile?.created_at
                                  ? new Date(a.profile.created_at).toLocaleDateString('fr-FR')
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedUserId(a.user_id); setUserProfileModalOpen(true); }}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Voir le profil
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      disabled={removing === a.id}
                                      onClick={() => handleRemove(a.id, 'user')}
                                    >
                                      {removing === a.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                      )}
                                      Retirer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="businesses">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mes entreprises</CardTitle>
                </CardHeader>
                <CardContent>
                  {businessAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune entreprise assignée. Cliquez sur "Ajouter" pour commencer.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businessAssignments.map(a => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={a.business?.logo_url || undefined} />
                                  <AvatarFallback className="text-xs">{a.business?.business_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium text-sm">{a.business?.business_name || 'Entreprise'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <CountryBadge countryCode={a.business?.country_code} variant="compact" />
                            </TableCell>
                            <TableCell className="text-sm">
                              {a.business?.business_type || <span className="text-muted-foreground italic">Non spécifié</span>}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="space-y-0.5">
                                {a.business?.email && <p className="truncate max-w-[180px]">{a.business.email}</p>}
                                {a.business?.phone && <p className="text-muted-foreground">{a.business.phone}</p>}
                                {!a.business?.email && !a.business?.phone && (
                                  <span className="text-muted-foreground italic">Non renseigné</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {a.business?.created_at
                                ? new Date(a.business.created_at).toLocaleDateString('fr-FR')
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(a.business?.status ?? null, a.business?.is_active ?? null, a.business?.is_verified ?? null)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedBusinessId(a.business_account_id); setBusinessProfileModalOpen(true); }}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Voir le profil
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    disabled={removing === a.id}
                                    onClick={() => handleRemove(a.id, 'business')}
                                  >
                                    {removing === a.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Retirer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {adminId && (
        <SelfAssignModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          adminId={adminId}
          onSuccess={() => loadAssignments(adminId)}
        />
      )}

      <UserProfileModal userId={selectedUserId} open={userProfileModalOpen} onOpenChange={setUserProfileModalOpen} />
      <BusinessProfileModal businessId={selectedBusinessId} open={businessProfileModalOpen} onOpenChange={setBusinessProfileModalOpen} />
    </AdminLayout>
  );
};

export default MyAssignments;
