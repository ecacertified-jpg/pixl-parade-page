import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { AdminCountryAssignment } from "./AdminCountryAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { COUNTRIES } from "@/config/countries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Shield, UserCheck, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AdminRoleType = 'super_admin' | 'regional_admin' | 'moderator';

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

interface EditPermissionsModalProps {
  adminId: string | null;
  adminName: string;
  adminRole: string;
  currentPermissions: Record<string, boolean>;
  currentCountries?: string[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PERMISSIONS = [
  { key: 'manage_users', label: 'Gérer les utilisateurs' },
  { key: 'manage_admins', label: 'Gérer les administrateurs' },
  { key: 'manage_businesses', label: 'Gérer les prestataires' },
  { key: 'manage_content', label: 'Modérer le contenu' },
  { key: 'manage_finances', label: 'Gérer les finances' },
  { key: 'view_analytics', label: 'Voir les analytics' },
  { key: 'manage_settings', label: 'Gérer les paramètres' },
];

export function EditPermissionsModal({ 
  adminId, 
  adminName,
  adminRole,
  currentPermissions,
  currentCountries,
  open, 
  onOpenChange,
  onSuccess 
}: EditPermissionsModalProps) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [assignedCountries, setAssignedCountries] = useState<string[]>([]);
  const [newRole, setNewRole] = useState<AdminRoleType>(adminRole as AdminRoleType);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPermissions(currentPermissions || {});
      setAssignedCountries(currentCountries || []);
      setNewRole(adminRole as AdminRoleType);
    }
  }, [open, currentPermissions, currentCountries, adminRole]);

  const handleSubmit = async () => {
    if (!adminId) return;

    // Validate permissions for moderator
    if (newRole === 'moderator' && Object.values(permissions).every(v => !v)) {
      toast.error("Un modérateur doit avoir au moins une permission");
      return;
    }

    // Validate countries for non-super_admin
    if (newRole !== 'super_admin' && assignedCountries.length === 0) {
      toast.error("Veuillez sélectionner au moins un pays");
      return;
    }

    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        role: newRole,
        assigned_countries: newRole === 'super_admin' ? null : assignedCountries,
        permissions: newRole === 'moderator' 
          ? permissions 
          : { manage_users: true, manage_admins: true, manage_businesses: true, manage_content: true, manage_finances: true, view_analytics: true, manage_settings: true },
      };

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', adminId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user?.id,
        action_type: 'update_admin_role_permissions',
        target_type: 'admin_user',
        target_id: adminId,
        description: `Rôle/permissions mis à jour pour ${adminName}`,
        metadata: { 
          previous_role: adminRole,
          new_role: newRole,
          role_changed: adminRole !== newRole,
          previous_countries: currentCountries,
          new_countries: newRole === 'super_admin' ? null : assignedCountries,
          permissions: newRole === 'moderator' ? permissions : null
        }
      });

      const roleChanged = adminRole !== newRole;
      toast.success(roleChanged 
        ? `Rôle modifié : ${adminName} est maintenant ${ROLE_INFO[newRole].label}`
        : `Permissions mises à jour pour ${adminName}`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const currentRoleInfo = ROLE_INFO[newRole];
  const RoleIcon = currentRoleInfo.icon;
  const isDowngradeFromSuperAdmin = adminRole === 'super_admin' && newRole !== 'super_admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier - {adminName}</DialogTitle>
          <DialogDescription>
            Modifiez le rôle, les permissions et les pays assignés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role selection */}
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={newRole} onValueChange={(v: AdminRoleType) => setNewRole(v)}>
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
                    Admin Régional
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

          {/* Warning for downgrade from super_admin */}
          {isDowngradeFromSuperAdmin && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Attention : vous êtes sur le point de rétrograder un Super Administrateur. 
                Il perdra l'accès complet à tous les pays.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Country assignment (only for non-super_admin) */}
          {newRole !== 'super_admin' && (
            <>
              <AdminCountryAssignment
                selectedCountries={assignedCountries}
                onChange={setAssignedCountries}
              />

              {/* Show current countries for reference */}
              {currentCountries && currentCountries.length > 0 && adminRole !== newRole && (
                <div className="text-xs text-muted-foreground">
                  Pays actuels : {currentCountries.map(c => COUNTRIES[c]?.flag || c).join(' ')}
                </div>
              )}
            </>
          )}

          {newRole === 'super_admin' && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
              Les Super Administrateurs ont automatiquement accès à tous les pays et toutes les permissions.
            </div>
          )}

          {/* Permissions (only for moderators) */}
          {newRole === 'moderator' && (
            <>
              <Separator />
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
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
            {loading ? "En cours..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
