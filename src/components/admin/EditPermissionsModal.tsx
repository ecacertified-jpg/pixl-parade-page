import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdminCountryAssignment } from "./AdminCountryAssignment";
import { useAuth } from "@/contexts/AuthContext";
import { COUNTRIES } from "@/config/countries";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPermissions(currentPermissions || {});
      setAssignedCountries(currentCountries || []);
    }
  }, [open, currentPermissions, currentCountries]);

  const handleSubmit = async () => {
    if (!adminId) return;

    // Validate permissions for moderator
    if (adminRole === 'moderator' && Object.values(permissions).every(v => !v)) {
      toast.error("Un modérateur doit avoir au moins une permission");
      return;
    }

    // Validate countries for non-super_admin
    if (adminRole !== 'super_admin' && assignedCountries.length === 0) {
      toast.error("Veuillez sélectionner au moins un pays");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        assigned_countries: adminRole === 'super_admin' ? null : assignedCountries,
      };

      // Only update permissions for moderators
      if (adminRole === 'moderator') {
        updateData.permissions = permissions;
      }

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', adminId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_user_id: user?.id,
        action_type: 'update_admin_permissions',
        target_type: 'admin_user',
        target_id: adminId,
        description: `Permissions mises à jour pour ${adminName}`,
        metadata: { 
          previous_countries: currentCountries,
          new_countries: assignedCountries,
          permissions: adminRole === 'moderator' ? permissions : null
        }
      });

      toast.success(`Permissions mises à jour pour ${adminName}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error("Erreur lors de la mise à jour des permissions");
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

  if (adminRole === 'super_admin') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les permissions</DialogTitle>
            <DialogDescription>
              Les Super Administrateurs ont automatiquement toutes les permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
              Super Administrateur
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {adminName} a accès complet à toutes les fonctionnalités et tous les pays.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier - {adminName}</DialogTitle>
          <DialogDescription>
            {adminRole === 'regional_admin' 
              ? "Modifiez les pays assignés à cet administrateur régional."
              : "Modifiez les permissions et pays de ce modérateur."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current role badge */}
          <div className="flex items-center gap-2">
            <Label>Rôle actuel :</Label>
            <Badge variant={adminRole === 'regional_admin' ? 'default' : 'secondary'}>
              {adminRole === 'regional_admin' ? 'Admin Régional' : 'Modérateur'}
            </Badge>
          </div>

          <Separator />

          {/* Country assignment */}
          <AdminCountryAssignment
            selectedCountries={assignedCountries}
            onChange={setAssignedCountries}
          />

          {/* Show current countries for reference */}
          {currentCountries && currentCountries.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Pays actuels : {currentCountries.map(c => COUNTRIES[c]?.flag || c).join(' ')}
            </div>
          )}

          {/* Permissions (only for moderators) */}
          {adminRole === 'moderator' && (
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
