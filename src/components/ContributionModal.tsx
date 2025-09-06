import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundId: string;
  fundTitle: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  onContributionSuccess?: () => void;
}

export function ContributionModal({ 
  isOpen, 
  onClose, 
  fundId, 
  fundTitle, 
  targetAmount, 
  currentAmount, 
  currency,
  onContributionSuccess 
}: ContributionModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const remainingAmount = targetAmount - currentAmount;
  const maxAmount = Math.min(remainingAmount, 500000); // Limite maximum de 500,000 XOF

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const contributionAmount = parseFloat(amount);
    if (contributionAmount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    if (contributionAmount > remainingAmount) {
      toast({
        title: "Erreur", 
        description: `Le montant ne peut pas dépasser ${remainingAmount.toLocaleString()} ${currency}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Créer la contribution
      const { error: contributionError } = await supabase
        .from('fund_contributions')
        .insert({
          fund_id: fundId,
          contributor_id: user.id,
          amount: contributionAmount,
          currency: currency,
          message: message || null,
          is_anonymous: isAnonymous
        });

      if (contributionError) throw contributionError;

      toast({
        title: "Contribution ajoutée !",
        description: `Vous avez contribué ${contributionAmount.toLocaleString()} ${currency} à "${fundTitle}"`,
      });

      // Réinitialiser le formulaire
      setAmount("");
      setMessage("");
      setIsAnonymous(false);
      
      // Callback de succès
      if (onContributionSuccess) {
        onContributionSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la contribution:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter votre contribution",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            💰 Contribuer à la cagnotte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info sur la cagnotte */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="font-medium text-sm">{fundTitle}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentAmount.toLocaleString()} / {targetAmount.toLocaleString()} {currency}
            </div>
            <div className="text-xs text-primary font-medium">
              Reste: {remainingAmount.toLocaleString()} {currency}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant de la contribution *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={maxAmount}
                  min="1"
                  required
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {currency}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Maximum: {maxAmount.toLocaleString()} {currency}
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message (optionnel)</Label>
              <Textarea
                id="message"
                placeholder="Laissez un petit mot d'encouragement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
              />
              <Label htmlFor="anonymous" className="text-sm">
                Contribution anonyme
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !amount}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                {loading ? "Envoi..." : "Contribuer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}