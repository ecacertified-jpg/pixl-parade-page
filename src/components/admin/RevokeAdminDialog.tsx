import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RevokeAdminDialogProps {
  adminId: string | null;
  adminName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RevokeAdminDialog({ 
  adminId, 
  adminName, 
  open, 
  onOpenChange,
  onSuccess 
}: RevokeAdminDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    if (!adminId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: false })
        .eq('id', adminId);

      if (error) throw error;

      toast.success(`Accès administrateur révoqué pour ${adminName}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error revoking admin access:', error);
      toast.error("Erreur lors de la révocation de l'accès");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Révoquer l'accès administrateur</DialogTitle>
          <DialogDescription>
            Cette action va retirer les droits d'administration de {adminName}.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention :</strong> {adminName} perdra immédiatement tous ses droits d'administration 
            et ne pourra plus accéder au panel d'administration.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={handleRevoke}
            disabled={loading}
          >
            {loading ? "En cours..." : "Révoquer l'accès"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
