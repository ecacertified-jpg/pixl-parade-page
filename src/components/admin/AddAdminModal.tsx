import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

interface AddAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  user_id: string;
}

const PERMISSIONS = [
  { key: 'manage_users', label: 'Gérer les utilisateurs' },
  { key: 'manage_admins', label: 'Gérer les administrateurs' },
  { key: 'manage_content', label: 'Modérer le contenu' },
  { key: 'manage_finances', label: 'Gérer les finances' },
  { key: 'view_analytics', label: 'Voir les analytics' },
  { key: 'manage_settings', label: 'Gérer les paramètres' },
];

export function AddAdminModal({ open, onOpenChange, onSuccess }: AddAdminModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [role, setRole] = useState<'super_admin' | 'moderator'>('moderator');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, user_id')
        .order('first_name');

      if (error) throw error;

      // Filter out users who are already admins
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id');

      const adminUserIds = new Set(admins?.map(a => a.user_id) || []);
      const availableUsers = data?.filter(u => !adminUserIds.has(u.user_id)) || [];
      
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Erreur lors du chargement des utilisateurs");
    }
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Veuillez sélectionner un utilisateur");
      return;
    }

    if (role === 'moderator' && Object.keys(permissions).length === 0) {
      toast.error("Veuillez sélectionner au moins une permission");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: selectedUserId,
          role: role,
          permissions: role === 'super_admin' ? {} : permissions,
          assigned_by: user?.id,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Administrateur ajouté avec succès");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || "Erreur lors de l'ajout de l'administrateur");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUserId("");
    setRole('moderator');
    setPermissions({});
    setSearchQuery("");
  };

  const togglePermission = (key: string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un administrateur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User search */}
          <div className="space-y-2">
            <Label>Rechercher un utilisateur</Label>
            <Input
              placeholder="Nom de l'utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {filteredUsers.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">Modérateur</SelectItem>
                <SelectItem value="super_admin">Super Administrateur</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'super_admin' 
                ? 'Accès complet à toutes les fonctionnalités'
                : 'Accès limité selon les permissions'}
            </p>
          </div>

          {/* Permissions (only for moderators) */}
          {role === 'moderator' && (
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 border rounded-lg p-3">
                {PERMISSIONS.map(perm => (
                  <div key={perm.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={perm.key}
                      checked={permissions[perm.key] || false}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    <label
                      htmlFor={perm.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "En cours..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
