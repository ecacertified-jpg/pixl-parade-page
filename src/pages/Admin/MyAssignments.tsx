import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Store, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SelfAssignModal } from '@/components/admin/SelfAssignModal';

interface UserAssignment {
  id: string;
  user_id: string;
  created_at: string;
  profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface BusinessAssignment {
  id: string;
  business_account_id: string;
  created_at: string;
  business?: {
    id: string;
    business_name: string;
    business_type: string | null;
    logo_url: string | null;
  };
}

const MyAssignments = () => {
  const { user } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [businessAssignments, setBusinessAssignments] = useState<BusinessAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

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
      await fetch(baseUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId, assignment_ids: [assignmentId], type }),
      });
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
                    <div className="space-y-2">
                      {userAssignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={a.profile?.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(a.profile?.first_name, a.profile?.last_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {a.profile?.first_name || ''} {a.profile?.last_name || ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ajouté le {new Date(a.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(a.id, 'user')}
                            disabled={removing === a.id}
                          >
                            {removing === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
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
                    <div className="space-y-2">
                      {businessAssignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={a.business?.logo_url || undefined} />
                            <AvatarFallback>{a.business?.business_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{a.business?.business_name || 'Entreprise'}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.business?.business_type || 'Non spécifié'} · Ajouté le {new Date(a.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(a.id, 'business')}
                            disabled={removing === a.id}
                          >
                            {removing === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
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
    </AdminLayout>
  );
};

export default MyAssignments;
