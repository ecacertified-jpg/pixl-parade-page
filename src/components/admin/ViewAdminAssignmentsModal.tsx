import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CountryBadge } from '@/components/CountryBadge';
import { UserProfileModal } from '@/components/admin/UserProfileModal';
import { BusinessProfileModal } from '@/components/admin/BusinessProfileModal';
import { Users, Store, Loader2, FileText, Link, MousePointerClick, UserPlus, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  assigned_via?: string | null;
  profile?: UserProfile;
}

interface BusinessAssignment {
  id: string;
  business_account_id: string;
  created_at: string;
  assigned_via?: string | null;
  business?: BusinessDetail;
}

interface ShareCodeInfo {
  code: string;
  clicks_count: number;
  signups_count: number;
  assignments_count: number;
}

interface ViewAdminAssignmentsModalProps {
  adminId: string | null;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const getInitials = (first?: string | null, last?: string | null) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

export function ViewAdminAssignmentsModal({ adminId, adminName, open, onOpenChange }: ViewAdminAssignmentsModalProps) {
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [businessAssignments, setBusinessAssignments] = useState<BusinessAssignment[]>([]);
  const [shareCode, setShareCode] = useState<ShareCodeInfo | null>(null);
  const [aggregatedStats, setAggregatedStats] = useState({ total_clicks: 0, total_signups: 0, total_assignments: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessProfileModalOpen, setBusinessProfileModalOpen] = useState(false);

  useEffect(() => {
    if (open && adminId) {
      loadAssignments(adminId);
      loadShareCodes(adminId);
    }
    if (!open) {
      setUserAssignments([]);
      setBusinessAssignments([]);
      setShareCode(null);
      setAggregatedStats({ total_clicks: 0, total_signups: 0, total_assignments: 0 });
    }
  }, [open, adminId]);

  const loadShareCodes = async (aid: string) => {
    try {
      const { data } = await supabase
        .from('admin_share_codes')
        .select('code, clicks_count, signups_count, assignments_count')
        .eq('admin_user_id', aid);

      if (data && data.length > 0) {
        const active = data[0];
        setShareCode(active);
        const stats = data.reduce(
          (acc, row) => ({
            total_clicks: acc.total_clicks + (row.clicks_count || 0),
            total_signups: acc.total_signups + (row.signups_count || 0),
            total_assignments: acc.total_assignments + (row.assignments_count || 0),
          }),
          { total_clicks: 0, total_signups: 0, total_assignments: 0 }
        );
        setAggregatedStats(stats);
      }
    } catch (e) {
      console.error('Error loading share codes:', e);
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
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setUserAssignments(data.user_assignments || []);
      setBusinessAssignments(data.business_assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Erreur lors du chargement des affectations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Affectations de {adminName}</DialogTitle>
            <DialogDescription>
              Liste en lecture seule des utilisateurs et entreprises assignés à cet administrateur.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Share Link Section */}
              {shareCode && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Link className="h-4 w-4 text-primary" />
                      Lien de partage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <p className="text-xs font-mono break-all flex-1">
                        https://joiedevivre-africa.com/join/{shareCode.code}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://joiedevivre-africa.com/join/${shareCode.code}`);
                          toast.success('Lien copié !');
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-secondary/30 rounded-lg">
                        <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{aggregatedStats.total_clicks}</p>
                        <p className="text-xs text-muted-foreground">Clics</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/30 rounded-lg">
                        <UserPlus className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{aggregatedStats.total_signups}</p>
                        <p className="text-xs text-muted-foreground">Inscriptions</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/30 rounded-lg">
                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-semibold">{aggregatedStats.total_assignments}</p>
                        <p className="text-xs text-muted-foreground">Affectations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                {userAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun utilisateur assigné à cet administrateur.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Complétion</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead className="text-right">Profil</TableHead>
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
                                    {a.assigned_via === 'share_link' && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                        <Link className="h-2.5 w-2.5 mr-0.5" /> Via lien
                                      </Badge>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setSelectedUserId(a.user_id); setUserProfileModalOpen(true); }}
                                >
                                  <FileText className="mr-1.5 h-4 w-4" />
                                  Voir
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="businesses">
                {businessAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune entreprise assignée à cet administrateur.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date d'inscription</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Profil</TableHead>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedBusinessId(a.business?.id || null); setBusinessProfileModalOpen(true); }}
                              >
                                <FileText className="mr-1.5 h-4 w-4" />
                                Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UserProfileModal
        userId={selectedUserId}
        open={userProfileModalOpen}
        onOpenChange={setUserProfileModalOpen}
      />

      <BusinessProfileModal
        businessId={selectedBusinessId}
        open={businessProfileModalOpen}
        onOpenChange={setBusinessProfileModalOpen}
      />
    </>
  );
}
