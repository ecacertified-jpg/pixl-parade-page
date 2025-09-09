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

  const getErrorMessage = (error: any) => {
    console.log('ContributionModal - Analyse d\'erreur:', error);
    
    // Erreurs de base de données résolues
    if (error?.message?.includes('record') && error?.message?.includes('has no field')) {
      return {
        title: "Problème technique résolu",
        description: "Un problème temporaire a été détecté et corrigé automatiquement.",
        suggestion: "Veuillez réessayer votre contribution maintenant."
      };
    }
    
    // Erreurs de permissions RLS
    if (error?.message?.includes('new row violates row-level security policy')) {
      return {
        title: "Permissions insuffisantes",
        description: "Vous n'êtes pas autorisé à contribuer à cette cagnotte. Vous devez être ami avec le créateur et avoir les permissions appropriées.",
        suggestion: "Contactez le créateur de la cagnotte pour qu'il vous ajoute à sa liste d'amis."
      };
    }

    // Erreurs de fonction RPC
    if (error?.code === '42883' || error?.message?.includes('function')) {
      return {
        title: "Erreur système",
        description: "Un problème technique empêche la contribution. Veuillez réessayer dans quelques instants.",
        suggestion: "Si le problème persiste, contactez le support."
      };
    }

    // Erreurs de permissions explicites
    if (error?.message?.includes('autorisation') || error?.message?.includes('permission')) {
      return {
        title: "Accès non autorisé",
        description: "Vous n'avez pas l'autorisation de contribuer à cette cagnotte.",
        suggestion: "Demandez au créateur de vous donner accès à ses cagnottes."
      };
    }

    // Erreurs de validation
    if (error?.message?.includes('violates check constraint') || error?.message?.includes('invalid input')) {
      return {
        title: "Données invalides",
        description: "Les informations saisies ne sont pas valides.",
        suggestion: "Vérifiez le montant et réessayez."
      };
    }

    // Erreurs réseau/connectivité
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
      return {
        title: "Problème de connexion",
        description: "Impossible de se connecter au serveur.",
        suggestion: "Vérifiez votre connexion internet et réessayez."
      };
    }

    // Erreurs par défaut
    return {
      title: "Erreur de contribution",
      description: error?.message || 'Une erreur inattendue s\'est produite lors de la contribution.',
      suggestion: "Réessayez dans quelques instants. Si le problème persiste, contactez le support."
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const contributionAmount = parseFloat(amount);
    console.log('ContributionModal - Début contribution', {
      fundId,
      userId: user.id,
      contributionAmount,
      currency,
      remainingAmount
    });

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
      // Vérifier les permissions avant la contribution
      console.log('ContributionModal - Vérification des permissions...');
      const { data: canContribute, error: permissionError } = await supabase
        .rpc('can_contribute_to_fund', { fund_uuid: fundId });

      console.log('ContributionModal - Résultat permissions', { canContribute, permissionError });

      if (permissionError) {
        console.error('ContributionModal - Erreur permissions:', permissionError);
        const errorInfo = getErrorMessage(permissionError);
        toast({
          title: errorInfo.title,
          description: `${errorInfo.description} ${errorInfo.suggestion}`,
          variant: "destructive"
        });
        return;
      }

      if (!canContribute) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas l'autorisation de contribuer à cette cagnotte. Assurez-vous d'être ami avec le créateur.",
          variant: "destructive"
        });
        return;
      }

      // Créer la contribution
      console.log('ContributionModal - Insertion contribution...');
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

      console.log('ContributionModal - Résultat insertion', { contributionError });
      
      if (contributionError) {
        console.error('ContributionModal - Erreur contribution:', contributionError);
        const errorInfo = getErrorMessage(contributionError);
        toast({
          title: errorInfo.title,
          description: `${errorInfo.description} ${errorInfo.suggestion}`,
          variant: "destructive"
        });
        return;
      }

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
      console.error('ContributionModal - Erreur complète:', error);
      const errorInfo = getErrorMessage(error);
      
      toast({
        title: errorInfo.title,
        description: `${errorInfo.description} ${errorInfo.suggestion}`,
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