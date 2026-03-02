import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddGratitudeModal } from "@/components/AddGratitudeModal";
import { triggerBadgeCheckAfterAction } from "@/utils/badgeAwarder";
import { SmartAmountSuggestions } from "@/components/SmartAmountSuggestions";
import { useSmartAmountSuggestions } from "@/hooks/useSmartAmountSuggestions";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { useShareConversionTracking } from "@/hooks/useShareConversionTracking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { z } from "zod";

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundId: string;
  fundTitle: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  isFromPublicFund?: boolean;
  onContributionSuccess?: () => void;
  fundCreatorId?: string;
  occasion?: string;
}

interface ExistingContribution {
  id: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
}

const contributionSchema = z.object({
  amount: z.number()
    .positive("Le montant doit être positif")
    .max(500000, "Le montant ne peut pas dépasser 500,000 XOF"),
  message: z.string()
    .max(500, "Le message ne peut pas dépasser 500 caractères")
    .optional(),
  fundId: z.string().uuid("Identifiant de cagnotte invalide"),
});

export function ContributionModal({
  isOpen, 
  onClose, 
  fundId, 
  fundTitle, 
  targetAmount, 
  currentAmount, 
  currency,
  isFromPublicFund = false,
  onContributionSuccess,
  fundCreatorId = '',
  occasion
}: ContributionModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [beneficiaryId, setBeneficiaryId] = useState<string>("");
  const [existingContribution, setExistingContribution] = useState<ExistingContribution | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackConversion } = useGoogleAnalytics();
  const { trackContributionConversion } = useShareConversionTracking();

  // Hook pour les suggestions intelligentes
  const smartSuggestions = useSmartAmountSuggestions(
    fundId,
    fundCreatorId,
    targetAmount,
    currentAmount,
    occasion
  );

  // Charger la contribution existante à l'ouverture du modal
  useEffect(() => {
    if (isOpen && user && fundId) {
      const fetchExisting = async () => {
        setLoadingExisting(true);
        try {
          const { data } = await supabase
            .from('fund_contributions')
            .select('id, amount, message, is_anonymous')
            .eq('fund_id', fundId)
            .eq('contributor_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setExistingContribution(data);
            setAmount(data.amount.toString());
            setMessage(data.message || "");
            setIsAnonymous(data.is_anonymous);
          } else {
            setExistingContribution(null);
          }
        } catch (err) {
          console.error('Erreur chargement contribution existante:', err);
          setExistingContribution(null);
        } finally {
          setLoadingExisting(false);
        }
      };
      fetchExisting();
    }

    if (!isOpen) {
      setExistingContribution(null);
      setAmount("");
      setMessage("");
      setIsAnonymous(false);
    }
  }, [isOpen, user, fundId]);

  // Réinitialiser le retry count quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      setRetryCount(0);
    }
  }, [isOpen]);

  const handleRetry = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }, 1000);
    }
  };

  const isEditMode = !!existingContribution;
  // En mode édition, le remaining doit inclure le montant existant (puisqu'on le remplace)
  const effectiveRemainingAmount = isEditMode
    ? (targetAmount - currentAmount) + existingContribution.amount
    : targetAmount - currentAmount;
  const maxAmount = Math.min(effectiveRemainingAmount, 500000);
  const remainingAmount = targetAmount - currentAmount;

  const getErrorMessage = (error: any) => {
    console.log('ContributionModal - Analyse d\'erreur complète:', {
      error,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    
    if (error?.message?.includes('new row violates row-level security policy')) {
      return {
        title: "Permissions insuffisantes",
        description: "Vous n'êtes pas autorisé à contribuer à cette cagnotte. Vous devez être ami avec le créateur et avoir les permissions appropriées.",
        suggestion: "Contactez le créateur de la cagnotte pour qu'il vous ajoute à sa liste d'amis.",
        canRetry: false
      };
    }

    if (error?.code === '42883' || error?.message?.includes('function')) {
      return {
        title: "Erreur système",
        description: "Un problème technique empêche la contribution. Veuillez réessayer dans quelques instants.",
        suggestion: "Si le problème persiste, contactez le support.",
        canRetry: true
      };
    }

    if (error?.message?.includes('autorisation') || error?.message?.includes('permission')) {
      return {
        title: "Accès non autorisé",
        description: "Vous n'avez pas l'autorisation de contribuer à cette cagnotte.",
        suggestion: "Demandez au créateur de vous donner accès à ses cagnottes.",
        canRetry: false
      };
    }

    if (error?.message?.includes('violates check constraint') || error?.message?.includes('invalid input')) {
      return {
        title: "Données invalides",
        description: "Les informations saisies ne sont pas valides.",
        suggestion: "Vérifiez le montant et réessayez.",
        canRetry: true
      };
    }

    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
      return {
        title: "Problème de connexion",
        description: "Impossible de se connecter au serveur.",
        suggestion: "Vérifiez votre connexion internet et réessayez.",
        canRetry: true
      };
    }

    return {
      title: "Erreur de contribution",
      description: error?.message || 'Une erreur inattendue s\'est produite lors de la contribution.',
      suggestion: "Réessayez dans quelques instants. Si le problème persiste, contactez le support.",
      canRetry: true
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const contributionAmount = parseFloat(amount);
    
    // Validate input
    const result = contributionSchema.safeParse({
      amount: contributionAmount,
      message: message.trim(),
      fundId,
    });

    if (!result.success) {
      toast({
        title: "Validation échouée",
        description: result.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    // Validation spécifique au mode édition
    if (isEditMode && contributionAmount <= existingContribution.amount) {
      toast({
        title: "Montant insuffisant",
        description: `Le nouveau montant doit être supérieur à votre don actuel de ${existingContribution.amount.toLocaleString()} ${currency}`,
        variant: "destructive"
      });
      return;
    }

    console.log('ContributionModal - Début contribution', {
      fundId,
      userId: user.id,
      contributionAmount,
      currency,
      remainingAmount,
      retryCount,
      isEditMode,
      existingAmount: existingContribution?.amount
    });

    if (contributionAmount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier si la cotisation est expirée
    const { data: fundCheck } = await supabase
      .from('collective_funds')
      .select('status')
      .eq('id', fundId)
      .single();
      
    if (fundCheck?.status === 'expired') {
      toast({
        title: "Cotisation expirée",
        description: "Cette cotisation a expiré et n'accepte plus de contributions",
        variant: "destructive"
      });
      return;
    }

    // Vérifier le dépassement (en mode édition, on compare le delta au remaining)
    const effectiveAmount = isEditMode
      ? contributionAmount - existingContribution.amount
      : contributionAmount;

    if (effectiveAmount > remainingAmount) {
      toast({
        title: "Erreur", 
        description: `Le montant ne peut pas dépasser ${(remainingAmount + (existingContribution?.amount || 0)).toLocaleString()} ${currency}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Vérifier les permissions avant la contribution (seulement pour nouvelle contribution)
      if (!isEditMode) {
        console.log('ContributionModal - Vérification des permissions...');
        const { data: canContribute, error: permissionError } = await supabase
          .rpc('can_contribute_to_fund', { fund_uuid: fundId });

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
      }

      if (isEditMode) {
        // MODE MODIFICATION : UPDATE de la contribution existante
        const delta = contributionAmount - existingContribution.amount;

        const { error: updateError } = await supabase
          .from('fund_contributions')
          .update({
            amount: contributionAmount,
            message: message || null,
            is_anonymous: isAnonymous
          })
          .eq('id', existingContribution.id)
          .eq('contributor_id', user.id);

        if (updateError) {
          console.error('ContributionModal - Erreur update:', updateError);
          const errorInfo = getErrorMessage(updateError);
          toast({
            title: errorInfo.title,
            description: `${errorInfo.description} ${errorInfo.suggestion}`,
            variant: "destructive"
          });
          return;
        }

        // Mettre à jour le current_amount de la cagnotte avec le delta
        const { error: fundUpdateError } = await supabase
          .from('collective_funds')
          .update({ current_amount: currentAmount + delta })
          .eq('id', fundId);

        if (fundUpdateError) {
          console.error('ContributionModal - Erreur mise à jour cagnotte:', fundUpdateError);
          // Rollback: remettre l'ancien montant
          await supabase
            .from('fund_contributions')
            .update({ amount: existingContribution.amount })
            .eq('id', existingContribution.id);

          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour la cagnotte. Votre contribution a été restaurée.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Contribution modifiée ! 🎉",
          description: `Votre don est passé de ${existingContribution.amount.toLocaleString()} à ${contributionAmount.toLocaleString()} ${currency} (+${delta.toLocaleString()} ${currency})`,
        });

        trackConversion('contribution', delta, currency);
      } else {
        // MODE CRÉATION : INSERT classique
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

        if (contributionError) {
          console.error('ContributionModal - Erreur contribution:', contributionError);
          const errorInfo = getErrorMessage(contributionError);
          if (errorInfo.canRetry && retryCount < 2) {
            toast({
              title: errorInfo.title,
              description: `${errorInfo.description} Tentative ${retryCount + 1}/3.`,
              variant: "destructive"
            });
            return;
          } else {
            toast({
              title: errorInfo.title,
              description: `${errorInfo.description} ${errorInfo.suggestion}`,
              variant: "destructive"
            });
          }
          return;
        }

        toast({
          title: "Contribution ajoutée !",
          description: `Vous avez contribué ${contributionAmount.toLocaleString()} ${currency} à "${fundTitle}"`,
        });

        trackConversion('contribution', contributionAmount, currency);
        await trackContributionConversion(fundId, contributionAmount);
      }

      triggerBadgeCheckAfterAction('contribution', user.id);

      // Réinitialiser le formulaire
      setAmount("");
      setMessage("");
      setIsAnonymous(false);
      
      // Récupérer le beneficiaryId pour le modal de gratitude
      if (!isEditMode) {
        const { data: fundData } = await supabase
          .from('collective_funds')
          .select('creator_id')
          .eq('id', fundId)
          .single();
        
        if (fundData?.creator_id) {
          setBeneficiaryId(fundData.creator_id);
          setShowGratitudeModal(true);
        }
      }
      
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center">
            {isEditMode ? "✏️ Modifier ma contribution" : "💰 Contribuer à la cagnotte"}
          </DialogTitle>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2">
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

          {/* Bandeau contribution existante */}
          {isEditMode && (
            <Alert className="border-primary/30 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Vous avez déjà contribué <strong>{existingContribution.amount.toLocaleString()} {currency}</strong> à cette cagnotte. 
                Vous pouvez augmenter votre don ci-dessous.
              </AlertDescription>
            </Alert>
          )}

          {/* Suggestions intelligentes */}
          {fundCreatorId && !isEditMode && (
            <SmartAmountSuggestions
              suggestions={smartSuggestions.suggestions}
              loading={smartSuggestions.loading}
              hasHistory={smartSuggestions.hasHistory}
              reciprocityScore={smartSuggestions.reciprocityScore}
              onSelectAmount={(selectedAmount) => setAmount(selectedAmount.toString())}
              currentAmount={amount}
            />
          )}

          <div>
            <Label htmlFor="amount">
              {isEditMode ? "Nouveau montant de la contribution *" : "Montant de la contribution *"}
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxAmount}
                min={isEditMode ? existingContribution.amount + 1 : 1}
                required
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {currency}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isEditMode 
                ? `Minimum : ${(existingContribution.amount + 1).toLocaleString()} ${currency} (supérieur à votre don actuel) · Maximum : ${maxAmount.toLocaleString()} ${currency}`
                : `Maximum: ${maxAmount.toLocaleString()} ${currency}`
              }
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

          {!isFromPublicFund && (
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
          )}
        </div>

        {/* Footer fixe avec boutons */}
        <div className="flex-shrink-0 pt-4 border-t flex gap-2">
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
            onClick={handleSubmit}
            disabled={loading || !amount || loadingExisting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            {loading 
              ? "Envoi..." 
              : isEditMode 
                ? "Modifier ma contribution" 
                : "Contribuer"
            }
          </Button>
        </div>
      </DialogContent>

      {/* Modal de Gratitude après contribution */}
      <AddGratitudeModal
        isOpen={showGratitudeModal}
        onClose={() => setShowGratitudeModal(false)}
        fundId={fundId}
        beneficiaryId={beneficiaryId}
        fundTitle={fundTitle}
      />
    </Dialog>
  );
}