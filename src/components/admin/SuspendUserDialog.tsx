import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuspendUserDialogProps {
  userId: string | null;
  userName: string;
  isSuspended: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SuspendUserDialog({ 
  userId, 
  userName, 
  isSuspended,
  open, 
  onOpenChange,
  onSuccess 
}: SuspendUserDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;

    if (!isSuspended && !reason.trim()) {
      toast.error("Veuillez indiquer une raison de suspension");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: !isSuspended,
          suspended_at: !isSuspended ? new Date().toISOString() : null,
          suspension_reason: !isSuspended ? reason : null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(
        isSuspended 
          ? `Le compte de ${userName} a été réactivé`
          : `Le compte de ${userName} a été suspendu`
      );
      
      onSuccess();
      onOpenChange(false);
      setReason("");
    } catch (error) {
      console.error('Error updating suspension:', error);
      toast.error("Erreur lors de la mise à jour du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSuspended ? "Réactiver le compte" : "Suspendre le compte"}
          </DialogTitle>
          <DialogDescription>
            {isSuspended 
              ? `Voulez-vous réactiver le compte de ${userName} ?`
              : `Cette action suspendra temporairement l'accès au compte de ${userName}.`
            }
          </DialogDescription>
        </DialogHeader>

        {!isSuspended && (
          <div className="space-y-2">
            <Label htmlFor="reason">Raison de la suspension *</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi ce compte est suspendu..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            variant={isSuspended ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "En cours..." : isSuspended ? "Réactiver" : "Suspendre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
