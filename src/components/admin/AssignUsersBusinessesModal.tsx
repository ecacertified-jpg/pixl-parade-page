import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Users, Building2, Loader2 } from 'lucide-react';

interface AssignUsersBusinessesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string | null;
  adminName: string;
  onSuccess: () => void;
}

interface UserItem {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email?: string;
}

interface BusinessItem {
  id: string;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
}

export function AssignUsersBusinessesModal({ open, onOpenChange, adminId, adminName, onSuccess }: AssignUsersBusinessesModalProps) {
  const [tab, setTab] = useState('users');
  const [userSearch, setUserSearch] = useState('');
  const [bizSearch, setBizSearch] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedBizIds, setSelectedBizIds] = useState<Set<string>>(new Set());
  const [assignedUserIds, setAssignedUserIds] = useState<Set<string>>(new Set());
  const [assignedBizIds, setAssignedBizIds] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBiz, setLoadingBiz] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current assignments when modal opens
  useEffect(() => {
    if (open && adminId) {
      loadAssignments();
    } else {
      setSelectedUserIds(new Set());
      setSelectedBizIds(new Set());
      setAssignedUserIds(new Set());
      setAssignedBizIds(new Set());
      setUserSearch('');
      setBizSearch('');
    }
  }, [open, adminId]);

  // Search users with debounce
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchUsers(), 300);
    return () => clearTimeout(timer);
  }, [userSearch, open]);

  // Search businesses with debounce
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchBusinesses(), 300);
    return () => clearTimeout(timer);
  }, [bizSearch, open]);

  const loadAssignments = async () => {
    if (!adminId) return;
    setLoadingAssignments(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke(
        `admin-manage-assignments?admin_id=${adminId}`,
        { method: 'GET' }
      );

      if (err) throw err;

      const uIds = new Set<string>((result?.user_assignments || []).map((a: any) => a.user_id));
      const bIds = new Set<string>((result?.business_assignments || []).map((a: any) => a.business_account_id));
      setAssignedUserIds(uIds);
      setAssignedBizIds(bIds);
      setSelectedUserIds(new Set(uIds));
      setSelectedBizIds(new Set(bIds));
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const searchUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .order('first_name', { ascending: true })
        .limit(50);

      if (userSearch.trim()) {
        query = query.or(`first_name.ilike.%${userSearch}%,last_name.ilike.%${userSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const searchBusinesses = async () => {
    setLoadingBiz(true);
    try {
      let query = supabase
        .from('business_accounts')
        .select('id, business_name, business_type, logo_url')
        .order('business_name', { ascending: true })
        .limit(50);

      if (bizSearch.trim()) {
        query = query.ilike('business_name', `%${bizSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error searching businesses:', error);
    } finally {
      setLoadingBiz(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleBusiness = (bizId: string) => {
    setSelectedBizIds(prev => {
      const next = new Set(prev);
      if (next.has(bizId)) next.delete(bizId);
      else next.add(bizId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!adminId) return;
    setSaving(true);
    try {
      // Determine users to add and remove
      const usersToAdd = [...selectedUserIds].filter(id => !assignedUserIds.has(id));
      const usersToRemove = [...assignedUserIds].filter(id => !selectedUserIds.has(id));
      const bizToAdd = [...selectedBizIds].filter(id => !assignedBizIds.has(id));
      const bizToRemove = [...assignedBizIds].filter(id => !selectedBizIds.has(id));

      // Add new assignments
      if (usersToAdd.length > 0 || bizToAdd.length > 0) {
        const { error } = await supabase.functions.invoke('admin-manage-assignments', {
          method: 'POST',
          body: {
            admin_id: adminId,
            user_ids: usersToAdd.length > 0 ? usersToAdd : undefined,
            business_ids: bizToAdd.length > 0 ? bizToAdd : undefined,
          },
        });
        if (error) throw error;
      }

      // Remove assignments - need to get assignment IDs first
      if (usersToRemove.length > 0) {
        // Get assignment IDs for users to remove
        const { data: existingAssignments } = await supabase
          .from('admin_user_assignments')
          .select('id')
          .eq('admin_user_id', adminId)
          .in('user_id', usersToRemove);

        if (existingAssignments && existingAssignments.length > 0) {
          await supabase.functions.invoke('admin-manage-assignments', {
            method: 'DELETE',
            body: {
              admin_id: adminId,
              assignment_ids: existingAssignments.map(a => a.id),
              type: 'user',
            },
          });
        }
      }

      if (bizToRemove.length > 0) {
        const { data: existingAssignments } = await supabase
          .from('admin_business_assignments')
          .select('id')
          .eq('admin_user_id', adminId)
          .in('business_account_id', bizToRemove);

        if (existingAssignments && existingAssignments.length > 0) {
          await supabase.functions.invoke('admin-manage-assignments', {
            method: 'DELETE',
            body: {
              admin_id: adminId,
              assignment_ids: existingAssignments.map(a => a.id),
              type: 'business',
            },
          });
        }
      }

      toast.success('Affectations mises à jour avec succès');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Erreur lors de la sauvegarde des affectations');
    } finally {
      setSaving(false);
    }
  };

  const getUserName = (u: UserItem) => {
    if (u.first_name || u.last_name) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return 'Utilisateur';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Affecter à {adminName}</DialogTitle>
          <DialogDescription>
            Sélectionnez les utilisateurs et entreprises à affecter à cet administrateur.
          </DialogDescription>
        </DialogHeader>

        {loadingAssignments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full">
              <TabsTrigger value="users" className="flex-1 gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs
                {selectedUserIds.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{selectedUserIds.size}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="businesses" className="flex-1 gap-2">
                <Building2 className="h-4 w-4" />
                Entreprises
                {selectedBizIds.size > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{selectedBizIds.size}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="flex-1 flex flex-col min-h-0 mt-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[400px]">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur trouvé</p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedUserIds.has(u.user_id)}
                        onCheckedChange={() => toggleUser(u.user_id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(u.first_name?.[0] || '') + (u.last_name?.[0] || '') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{getUserName(u)}</p>
                      </div>
                      {assignedUserIds.has(u.user_id) && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">Assigné</Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="businesses" className="flex-1 flex flex-col min-h-0 mt-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={bizSearch}
                  onChange={(e) => setBizSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[400px]">
                {loadingBiz ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : businesses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Aucune entreprise trouvée</p>
                ) : (
                  businesses.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedBizIds.has(b.id)}
                        onCheckedChange={() => toggleBusiness(b.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={b.logo_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {b.business_name?.slice(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{b.business_name}</p>
                        {b.business_type && (
                          <p className="text-xs text-muted-foreground truncate">{b.business_type}</p>
                        )}
                      </div>
                      {assignedBizIds.has(b.id) && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">Assigné</Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingAssignments}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
