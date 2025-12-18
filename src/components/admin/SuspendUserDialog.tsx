import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useSecureAdminActions } from "@/hooks/useSecureAdminActions";

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
  const { manageUser } = useSecureAdminActions();

  const handleSubmit = async () => {
    if (!userId) return;

    if (!isSuspended && !reason.trim()) {
      return;
    }

    manageUser.mutate(
      {
        user_id: userId,
        action: isSuspended ? 'unsuspend' : 'suspend',
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          onSuccess();
          onOpenChange(false);
          setReason("");
        }
      }
    );
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
            disabled={manageUser.isPending}
          >
            Annuler
          </Button>
          <Button 
            variant={isSuspended ? "default" : "destructive"}
            onClick={handleSubmit}
            disabled={manageUser.isPending || (!isSuspended && !reason.trim())}
          >
            {manageUser.isPending ? "En cours..." : isSuspended ? "Réactiver" : "Suspendre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
