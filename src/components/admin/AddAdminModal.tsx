import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { AdminCountryAssignment } from "./AdminCountryAssignment";
import { ShieldCheck, Shield, UserCheck } from "lucide-react";

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

type AdminRoleType = 'super_admin' | 'regional_admin' | 'moderator';

const PERMISSIONS = [
  { key: 'manage_users', label: 'Gérer les utilisateurs' },
  { key: 'manage_admins', label: 'Gérer les administrateurs' },
  { key: 'manage_businesses', label: 'Gérer les prestataires' },
  { key: 'manage_content', label: 'Modérer le contenu' },
  { key: 'manage_finances', label: 'Gérer les finances' },
  { key: 'view_analytics', label: 'Voir les analytics' },
  { key: 'manage_settings', label: 'Gérer les paramètres' },
];

const ROLE_INFO = {
  super_admin: {
    label: 'Super Administrateur',
    description: 'Accès complet à tous les pays et toutes les fonctionnalités',
    icon: ShieldCheck,
    color: 'text-primary',
  },
  regional_admin: {
    label: 'Administrateur Régional',
    description: 'Accès complet limité à certains pays',
    icon: Shield,
    color: 'text-blue-500',
  },
  moderator: {
    label: 'Modérateur',
    description: 'Permissions spécifiques sur certains pays',
    icon: UserCheck,
    color: 'text-muted-foreground',
  },
};

export function AddAdminModal({ open, onOpenChange, onSuccess }: AddAdminModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [role, setRole] = useState<AdminRoleType>('moderator');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [assignedCountries, setAssignedCountries] = useState<string[]>([]);
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

    // Validate permissions for moderator
    if (role === 'moderator' && Object.values(permissions).every(v => !v)) {
      toast.error("Veuillez sélectionner au moins une permission");
      return;
    }

    // Validate countries for regional_admin and moderator
    if ((role === 'regional_admin' || role === 'moderator') && assignedCountries.length === 0) {
      toast.error("Veuillez sélectionner au moins un pays");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: selectedUserId,
          role: role,
          permissions: role === 'super_admin' || role === 'regional_admin' 
            ? { manage_users: true, manage_content: true, view_analytics: true, manage_finances: true } 
            : permissions,
          assigned_countries: role === 'super_admin' ? null : assignedCountries,
          assigned_by: user?.id,
          is_active: true,
        });

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user?.id,
        action_type: 'create_admin',
        target_type: 'admin_user',
        target_id: selectedUserId,
        description: `Nouvel admin créé: ${role}${role !== 'super_admin' ? ` (pays: ${assignedCountries.join(', ')})` : ''}`,
        metadata: { role, assigned_countries: assignedCountries }
      });

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
    setAssignedCountries([]);
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

  const currentRoleInfo = ROLE_INFO[role];
  const RoleIcon = currentRoleInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un administrateur</DialogTitle>
          <DialogDescription>
            Sélectionnez un utilisateur et définissez son rôle et périmètre
          </DialogDescription>
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
            <Select value={role} onValueChange={(v: AdminRoleType) => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Modérateur
                  </div>
                </SelectItem>
                <SelectItem value="regional_admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Administrateur Régional
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Super Administrateur
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <RoleIcon className={`h-4 w-4 ${currentRoleInfo.color}`} />
              <p className="text-xs text-muted-foreground">
                {currentRoleInfo.description}
              </p>
            </div>
          </div>

          {/* Country assignment (for regional_admin and moderator) */}
          {role !== 'super_admin' && (
            <AdminCountryAssignment
              selectedCountries={assignedCountries}
              onChange={setAssignedCountries}
            />
          )}

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
