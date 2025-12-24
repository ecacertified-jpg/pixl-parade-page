import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Link2Off, Trash2, AlertTriangle } from "lucide-react";

export interface AssociatedFund {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  status: string;
  contributions_count: number;
}

interface ManageFundsBeforeDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  funds: AssociatedFund[];
  onComplete: () => void;
}

export function ManageFundsBeforeDeleteModal({
  open,
  onOpenChange,
  businessId,
  businessName,
  funds,
  onComplete,
}: ManageFundsBeforeDeleteModalProps) {
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Complétée</Badge>;
      case "expired":
        return <Badge variant="secondary">Expirée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDissociateAll = async () => {
    setLoading(true);
    const toastId = toast.loading("Dissociation des cagnottes...");

    try {
      const fundIds = funds.map((f) => f.id);

      const { error } = await supabase
        .from("collective_funds")
        .update({ created_by_business_id: null })
        .in("id", fundIds);

      if (error) throw error;

      toast.success(
        `${funds.length} cagnotte(s) dissociée(s) du business`,
        { id: toastId }
      );
      onOpenChange(false);
      onComplete();
    } catch (error) {
      console.error("Error dissociating funds:", error);
      toast.error("Erreur lors de la dissociation", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSmartDelete = async () => {
    setLoading(true);
    const toastId = toast.loading("Traitement des cagnottes...");

    try {
      const fundsWithoutContributions = funds.filter(
        (f) => f.contributions_count === 0
      );
      const fundsWithContributions = funds.filter(
        (f) => f.contributions_count > 0
      );

      // Delete funds without contributions
      if (fundsWithoutContributions.length > 0) {
        const { error: deleteError } = await supabase
          .from("collective_funds")
          .delete()
          .in(
            "id",
            fundsWithoutContributions.map((f) => f.id)
          );

        if (deleteError) throw deleteError;
      }

      // Dissociate funds with contributions
      if (fundsWithContributions.length > 0) {
        const { error: updateError } = await supabase
          .from("collective_funds")
          .update({ created_by_business_id: null })
          .in(
            "id",
            fundsWithContributions.map((f) => f.id)
          );

        if (updateError) throw updateError;
      }

      const messages: string[] = [];
      if (fundsWithoutContributions.length > 0) {
        messages.push(
          `${fundsWithoutContributions.length} cagnotte(s) supprimée(s)`
        );
      }
      if (fundsWithContributions.length > 0) {
        messages.push(
          `${fundsWithContributions.length} cagnotte(s) dissociée(s)`
        );
      }

      toast.success(messages.join(", "), { id: toastId });
      onOpenChange(false);
      onComplete();
    } catch (error) {
      console.error("Error processing funds:", error);
      toast.error("Erreur lors du traitement des cagnottes", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const fundsWithContributions = funds.filter((f) => f.contributions_count > 0);
  const fundsWithoutContributions = funds.filter(
    (f) => f.contributions_count === 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Cagnottes associées
          </DialogTitle>
          <DialogDescription>
            Ce business "{businessName}" a {funds.length} cagnotte(s) associée(s).
            Choisissez comment les gérer avant de supprimer le business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {funds.map((fund) => (
            <div
              key={fund.id}
              className="p-3 border rounded-lg bg-muted/30 space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm line-clamp-1">
                    {fund.title}
                  </span>
                </div>
                {getStatusBadge(fund.status || "active")}
              </div>
              <div className="text-xs text-muted-foreground">
                {fund.current_amount.toLocaleString()} /{" "}
                {fund.target_amount.toLocaleString()} XOF •{" "}
                {fund.contributions_count} contribution(s)
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleDissociateAll}
            disabled={loading}
          >
            <Link2Off className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Dissocier toutes</div>
              <div className="text-xs text-muted-foreground">
                Les cagnottes seront conservées mais plus liées au business
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleSmartDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Supprimer / Dissocier</div>
              <div className="text-xs text-muted-foreground">
                {fundsWithoutContributions.length > 0 && (
                  <span>
                    Supprime {fundsWithoutContributions.length} cagnotte(s) sans
                    contributions
                  </span>
                )}
                {fundsWithContributions.length > 0 && (
                  <span>
                    {fundsWithoutContributions.length > 0 && ", "}
                    dissocie {fundsWithContributions.length} avec contributions
                  </span>
                )}
              </div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
