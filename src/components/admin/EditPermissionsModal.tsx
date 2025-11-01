import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface EditPermissionsModalProps {
  adminId: string | null;
  adminName: string;
  adminRole: string;
  currentPermissions: Record<string, boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PERMISSIONS = [
  { key: 'manage_users', label: 'Gérer les utilisateurs' },
  { key: 'manage_admins', label: 'Gérer les administrateurs' },
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
  open, 
  onOpenChange,
  onSuccess 
}: EditPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPermissions(currentPermissions || {});
    }
  }, [open, currentPermissions]);

  const handleSubmit = async () => {
    if (!adminId) return;

    if (Object.values(permissions).every(v => !v)) {
      toast.error("Un modérateur doit avoir au moins une permission");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ permissions })
        .eq('id', adminId);

      if (error) throw error;

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
              {adminName} a accès complet à toutes les fonctionnalités.
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les permissions - {adminName}</DialogTitle>
          <DialogDescription>
            Sélectionnez les permissions accordées à ce modérateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
