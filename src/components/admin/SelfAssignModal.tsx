import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Store, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SelfAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
  onSuccess: () => void;
}

interface UserItem {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface BusinessItem {
  id: string;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
}

interface AssignmentMap {
  [id: string]: { admin_user_id: string; admin_name: string };
}

export function SelfAssignModal({ open, onOpenChange, adminId, onSuccess }: SelfAssignModalProps) {
  const [tab, setTab] = useState('users');
  const [userSearch, setUserSearch] = useState('');
  const [bizSearch, setBizSearch] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedBiz, setSelectedBiz] = useState<Set<string>>(new Set());
  const [userAssignments, setUserAssignments] = useState<AssignmentMap>({});
  const [bizAssignments, setBizAssignments] = useState<AssignmentMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load all assignments for exclusivity check
      const assignmentsRes = await supabase.functions.invoke('admin-manage-assignments', {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: undefined,
      });

      // Use fetch for GET with query params
      const baseUrl = `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/admin-manage-assignments`;
      
      const [allAssignRes, myAssignRes] = await Promise.all([
        fetch(`${baseUrl}?all_assignments=true`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          },
        }),
        fetch(`${baseUrl}?admin_id=${adminId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          },
        }),
      ]);

      const allAssign = await allAssignRes.json();
      const myAssign = await myAssignRes.json();

      // Build assignment maps
      const uMap: AssignmentMap = {};
      (allAssign.user_assignments || []).forEach((a: any) => {
        uMap[a.user_id] = { admin_user_id: a.admin_user_id, admin_name: a.admin_name };
      });
      setUserAssignments(uMap);

      const bMap: AssignmentMap = {};
      (allAssign.business_assignments || []).forEach((a: any) => {
        bMap[a.business_account_id] = { admin_user_id: a.admin_user_id, admin_name: a.admin_name };
      });
      setBizAssignments(bMap);

      // Pre-select already assigned to me
      const myUserIds = new Set<string>((myAssign.user_assignments || []).map((a: any) => a.user_id as string));
      setSelectedUsers(myUserIds);
      const myBizIds = new Set<string>((myAssign.business_assignments || []).map((a: any) => a.business_account_id as string));
      setSelectedBiz(myBizIds);

      // Load global lists
      const [usersRes, bizRes] = await Promise.all([
        supabase.from('profiles').select('user_id, first_name, last_name, avatar_url').limit(500),
        supabase.from('business_accounts').select('id, business_name, business_type, logo_url').eq('is_active', true).is('deleted_at', null).limit(500),
      ]);

      setUsers(usersRes.data || []);
      setBusinesses(bizRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const baseUrl = `https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/admin-manage-assignments`;

      // Determine which to add (new selections not already mine)
      const currentMyUsers = new Set(
        Object.entries(userAssignments)
          .filter(([_, v]) => v.admin_user_id === adminId)
          .map(([k]) => k)
      );
      const currentMyBiz = new Set(
        Object.entries(bizAssignments)
          .filter(([_, v]) => v.admin_user_id === adminId)
          .map(([k]) => k)
      );

      const newUserIds = [...selectedUsers].filter(id => !currentMyUsers.has(id));
      const removedUserIds = [...currentMyUsers].filter(id => !selectedUsers.has(id));
      const newBizIds = [...selectedBiz].filter(id => !currentMyBiz.has(id));
      const removedBizIds = [...currentMyBiz].filter(id => !selectedBiz.has(id));

      // Add new assignments
      if (newUserIds.length > 0 || newBizIds.length > 0) {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_id: adminId,
            user_ids: newUserIds.length > 0 ? newUserIds : undefined,
            business_ids: newBizIds.length > 0 ? newBizIds : undefined,
          }),
        });
        const result = await res.json();
        if (result.conflicts && result.conflicts.length > 0) {
          toast.error(`${result.conflicts.length} élément(s) déjà affecté(s) à un autre admin`);
        }
      }

      // Remove deselected assignments - need to get assignment IDs first
      if (removedUserIds.length > 0) {
        // Get assignment IDs for removed users
        const myAssignRes = await fetch(`${baseUrl}?admin_id=${adminId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          },
        });
        const myAssign = await myAssignRes.json();
        const idsToRemove = (myAssign.user_assignments || [])
          .filter((a: any) => removedUserIds.includes(a.user_id))
          .map((a: any) => a.id);
        
        if (idsToRemove.length > 0) {
          await fetch(baseUrl, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ admin_id: adminId, assignment_ids: idsToRemove, type: 'user' }),
          });
        }
      }

      if (removedBizIds.length > 0) {
        const myAssignRes = await fetch(`${baseUrl}?admin_id=${adminId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
          },
        });
        const myAssign = await myAssignRes.json();
        const idsToRemove = (myAssign.business_assignments || [])
          .filter((a: any) => removedBizIds.includes(a.business_account_id))
          .map((a: any) => a.id);
        
        if (idsToRemove.length > 0) {
          await fetch(baseUrl, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ admin_id: adminId, assignment_ids: idsToRemove, type: 'business' }),
          });
        }
      }

      toast.success('Affectations mises à jour');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = (userId: string) => {
    const assignment = userAssignments[userId];
    if (assignment && assignment.admin_user_id !== adminId) return; // Can't toggle if assigned to another
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleBiz = (bizId: string) => {
    const assignment = bizAssignments[bizId];
    if (assignment && assignment.admin_user_id !== adminId) return;
    setSelectedBiz(prev => {
      const next = new Set(prev);
      if (next.has(bizId)) next.delete(bizId);
      else next.add(bizId);
      return next;
    });
  };

  const filteredUsers = users.filter(u => {
    const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    return name.includes(userSearch.toLowerCase());
  });

  const filteredBiz = businesses.filter(b =>
    b.business_name.toLowerCase().includes(bizSearch.toLowerCase())
  );

  const getInitials = (first?: string | null, last?: string | null) =>
    `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter à mes affectations</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="users" className="flex-1 gap-2">
                <Users className="h-4 w-4" /> Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="businesses" className="flex-1 gap-2">
                <Store className="h-4 w-4" /> Entreprises
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredUsers.map(u => {
                  const assignment = userAssignments[u.user_id];
                  const isOther = assignment && assignment.admin_user_id !== adminId;
                  const isChecked = selectedUsers.has(u.user_id);

                  return (
                    <div
                      key={u.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isOther ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'
                      }`}
                      onClick={() => !isOther && toggleUser(u.user_id)}
                    >
                      <Checkbox checked={isChecked} disabled={isOther} />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(u.first_name, u.last_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.first_name || ''} {u.last_name || ''}
                        </p>
                        {isOther && (
                          <Badge variant="secondary" className="text-xs">
                            Affecté à {assignment.admin_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun utilisateur trouvé</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="businesses" className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={bizSearch}
                  onChange={e => setBizSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredBiz.map(b => {
                  const assignment = bizAssignments[b.id];
                  const isOther = assignment && assignment.admin_user_id !== adminId;
                  const isChecked = selectedBiz.has(b.id);

                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isOther ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'
                      }`}
                      onClick={() => !isOther && toggleBiz(b.id)}
                    >
                      <Checkbox checked={isChecked} disabled={isOther} />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={b.logo_url || undefined} />
                        <AvatarFallback className="text-xs">{b.business_name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.business_name}</p>
                        <p className="text-xs text-muted-foreground">{b.business_type || 'Non spécifié'}</p>
                        {isOther && (
                          <Badge variant="secondary" className="text-xs">
                            Affecté à {assignment.admin_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredBiz.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune entreprise trouvée</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
