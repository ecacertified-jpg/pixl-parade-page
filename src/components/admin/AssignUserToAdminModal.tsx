import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Globe, Users as UsersIcon, AlertTriangle, Search, ChevronDown } from 'lucide-react';

interface AssignUserToAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: string[];
  userLabels: string[];
  onSuccess: () => void;
}

interface AdminListItem {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  assigned_countries: string[] | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  stats: {
    users: number;
    businesses: number;
  };
}

const roleLabel = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'regional_admin': return 'Admin Régional';
    case 'moderator': return 'Modérateur';
    default: return role;
  }
};

const roleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
  if (role === 'super_admin') return 'default';
  if (role === 'regional_admin') return 'secondary';
  return 'outline';
};

export function AssignUserToAdminModal({
  open,
  onOpenChange,
  userIds,
  userLabels,
  onSuccess,
}: AssignUserToAdminModalProps) {
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [conflicts, setConflicts] = useState<Array<{ id: string; assigned_to: string }>>([]);
  const [pendingReassign, setPendingReassign] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      loadAdmins();
      setSelectedAdminId('');
      setConflicts([]);
      setPendingReassign(false);
      setSearch('');
    }
  }, [open]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-admins', { method: 'GET' });
      if (error) throw error;
      const list: AdminListItem[] = (data?.data || [])
        .filter((a: AdminListItem) => a.is_active && a.role !== 'super_admin')
        // Sort by load: least-loaded first to balance assignments
        .sort((a: AdminListItem, b: AdminListItem) => (a.stats?.users || 0) - (b.stats?.users || 0));
      setAdmins(list);
    } catch (err) {
      console.error('Error loading admins:', err);
      toast.error('Erreur lors du chargement des admins');
    } finally {
      setLoading(false);
    }
  };

  const adminName = (a: AdminListItem) => {
    const n = `${a.profiles.first_name || ''} ${a.profiles.last_name || ''}`.trim();
    return n || a.profiles.email || 'Admin';
  };

  const initials = (a: AdminListItem) => {
    const f = a.profiles.first_name?.[0]?.toUpperCase() || '';
    const l = a.profiles.last_name?.[0]?.toUpperCase() || '';
    return (f + l) || a.profiles.email?.[0]?.toUpperCase() || '?';
  };

  const performAssign = async (forceReassign = false) => {
    if (!selectedAdminId) {
      toast.error('Sélectionnez un admin');
      return;
    }
    setSaving(true);
    try {
      // If reassigning, first remove existing assignments for these users
      if (forceReassign && conflicts.length > 0) {
        const conflictUserIds = conflicts.map(c => c.id);
        const { data: existingAssignments } = await supabase
          .from('admin_user_assignments')
          .select('id, admin_user_id')
          .in('user_id', conflictUserIds);

        // Group by admin_user_id and delete via function
        const byAdmin = new Map<string, string[]>();
        for (const ea of existingAssignments || []) {
          if (!byAdmin.has(ea.admin_user_id)) byAdmin.set(ea.admin_user_id, []);
          byAdmin.get(ea.admin_user_id)!.push(ea.id);
        }
        for (const [adminId, ids] of byAdmin.entries()) {
          await supabase.functions.invoke('admin-manage-assignments', {
            method: 'DELETE',
            body: { admin_id: adminId, assignment_ids: ids, type: 'user' },
          });
        }
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-assignments', {
        method: 'POST',
        body: { admin_id: selectedAdminId, user_ids: userIds },
      });

      if (error) throw error;

      const newConflicts = (data?.conflicts || []).filter((c: any) => c.type === 'user');
      const added = data?.users_added || 0;

      if (!forceReassign && newConflicts.length > 0 && added < userIds.length) {
        // Show conflict prompt
        setConflicts(newConflicts.map((c: any) => ({ id: c.id, assigned_to: c.assigned_to })));
        setPendingReassign(true);
        setSaving(false);
        return;
      }

      const targetAdmin = admins.find(a => a.id === selectedAdminId);
      const targetName = targetAdmin ? adminName(targetAdmin) : 'l\'admin';
      toast.success(
        `${added} utilisateur(s) affecté(s) à ${targetName}` +
        (forceReassign && conflicts.length ? ` (${conflicts.length} réaffecté(s))` : '')
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error assigning:', err);
      toast.error(err.message || 'Erreur lors de l\'affectation');
    } finally {
      setSaving(false);
    }
  };

  const isBatch = userIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Affecter à un admin
          </DialogTitle>
          <DialogDescription>
            {isBatch ? (
              <>Affecter <strong>{userIds.length} utilisateur(s)</strong> à un administrateur référent.</>
            ) : (
              <>Affecter <strong>{userLabels[0]}</strong> à un administrateur référent.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {pendingReassign && conflicts.length > 0 && (
          <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <strong>{conflicts.length} utilisateur(s)</strong> sont déjà affecté(s) à un autre admin.
              Confirmer pour les réaffecter à l'admin sélectionné.
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : admins.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucun admin éligible (régional ou modérateur) trouvé.
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[420px] -mx-2 px-2">
            <RadioGroup value={selectedAdminId} onValueChange={setSelectedAdminId} className="space-y-2">
              {admins.map((a) => (
                <Label
                  key={a.id}
                  htmlFor={`admin-${a.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAdminId === a.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={a.id} id={`admin-${a.id}`} />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials(a)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{adminName(a)}</span>
                      <Badge variant={roleBadgeVariant(a.role)} className="text-xs">
                        {roleLabel(a.role)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {a.assigned_countries && a.assigned_countries.length > 0
                          ? a.assigned_countries.join(', ')
                          : 'Tous pays'}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-3 w-3" />
                        {a.stats.users} utilisateur(s)
                      </span>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          {pendingReassign ? (
            <Button onClick={() => performAssign(true)} disabled={saving || !selectedAdminId}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmer la réaffectation
            </Button>
          ) : (
            <Button onClick={() => performAssign(false)} disabled={saving || !selectedAdminId || loading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Affecter
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
