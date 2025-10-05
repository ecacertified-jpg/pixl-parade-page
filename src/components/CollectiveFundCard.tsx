import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Users, Gift, Trash2, RefreshCw, AlertTriangle, Heart, Globe, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { ContributionModal } from "./ContributionModal";
import type { CollectiveFund } from "@/hooks/useCollectiveFunds";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar?: string;
}

interface CollectiveFundCardProps {
  fund: CollectiveFund;
  onContribute?: (fundId: string) => void;
  onContributionSuccess?: () => void;
  onDelete?: (fundId: string) => void;
}

export function CollectiveFundCard({ fund, onContribute, onContributionSuccess, onDelete }: CollectiveFundCardProps) {
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [isPublic, setIsPublic] = useState(fund.isPublic || false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [reciprocityInfo, setReciprocityInfo] = useState<{
    contribution_amount: number;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    if (user && fund.creatorId) {
      supabase
        .from('reciprocity_tracking')
        .select('contribution_amount, created_at')
        .eq('donor_id', user.id)
        .eq('beneficiary_id', fund.creatorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setReciprocityInfo(data);
          }
        });
    }
  }, [user, fund.creatorId]);
  
  const progressPercentage = Math.min((fund.currentAmount / fund.targetAmount) * 100, 100);
  const isCompleted = fund.currentAmount >= fund.targetAmount;
  const isExpired = fund.status === 'expired';
  const isCreator = user?.id === fund.creatorId;
  
  // Calculer le nombre de jours jusqu'à l'anniversaire
  const getDaysUntilBirthday = () => {
    if (!fund.beneficiaryBirthday) return null;
    
    const today = new Date();
    const birthday = new Date(fund.beneficiaryBirthday);
    
    // Définir l'anniversaire pour cette année
    const nextBirthday = new Date(
      today.getFullYear(),
      birthday.getMonth(),
      birthday.getDate()
    );
    
    // Si l'anniversaire est déjà passé cette année, utiliser l'année prochaine
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    // Calculer la différence en jours
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const daysUntilBirthday = getDaysUntilBirthday();
  
  const handleContribute = () => {
    if (isExpired) {
      toast({
        title: "Cotisation expirée",
        description: "Cette cotisation a expiré et n'accepte plus de contributions",
        variant: "destructive"
      });
      return;
    }
    
    if (onContribute) {
      onContribute(fund.id);
    } else {
      setShowContributionModal(true);
    }
  };

  const handleDelete = async () => {
    if (!isCreator) return;
    
    try {
      const { error } = await supabase
        .from('collective_funds')
        .delete()
        .eq('id', fund.id)
        .eq('creator_id', user?.id);

      if (error) throw error;

      toast({
        title: "Cotisation supprimée",
        description: "La cotisation a été supprimée avec succès"
      });

      if (onDelete) {
        onDelete(fund.id);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la cotisation",
        variant: "destructive"
      });
    }
  };

  const handleRequestRefund = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('request-refund', {
        body: { 
          fund_id: fund.id,
          user_id: user?.id,
          fund_title: fund.title 
        }
      });

      if (error) throw error;

      toast({
        title: "Demande de remboursement envoyée",
        description: "Votre demande a été transmise au service de remboursement de JOIE DE VIVRE"
      });
    } catch (error) {
      console.error('Erreur lors de la demande de remboursement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de remboursement",
        variant: "destructive"
      });
    }
  };

  const handleToggleVisibility = async (checked: boolean) => {
    if (!isCreator) return;
    
    setIsUpdatingVisibility(true);
    try {
      const { error } = await supabase
        .from('collective_funds')
        .update({ is_public: checked })
        .eq('id', fund.id)
        .eq('creator_id', user?.id);

      if (error) throw error;

      setIsPublic(checked);
      toast({
        title: checked ? "Cagnotte publique" : "Cagnotte privée",
        description: checked 
          ? "Tout le monde peut voir et contribuer à cette cagnotte"
          : "Seuls vos amis autorisés peuvent voir cette cagnotte"
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la visibilité",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        {/* Header avec nom du bénéficiaire et statut */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{fund.title}</h3>
            <p className="text-sm text-muted-foreground">
              {daysUntilBirthday !== null 
                ? `Anniv. dans ${daysUntilBirthday} jour${daysUntilBirthday > 1 ? 's' : ''}`
                : `Pour: ${fund.beneficiaryName}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isExpired ? "destructive" : isCompleted ? "default" : "secondary"}
              className={
                isExpired ? "bg-red-500 hover:bg-red-600" : 
                isCompleted ? "bg-green-500 hover:bg-green-600" : ""
              }
            >
              {isExpired ? "Expirée" : isCompleted ? "Terminé" : "En cours"}
            </Badge>
            {isCreator && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Toggle de visibilité (pour le créateur uniquement) */}
        {isCreator && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {isPublic ? "Cagnotte publique" : "Cagnotte privée"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPublic 
                    ? "Visible par tous" 
                    : "Visible par vos amis uniquement"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleToggleVisibility}
              disabled={isUpdatingVisibility || isExpired}
            />
          </div>
        )}

        {/* Produit avec image et nom */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
            {fund.productImage ? (
              <img 
                src={fund.productImage} 
                alt={fund.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Gift className="h-8 w-8 text-orange-500" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{fund.productName}</h4>
            <p className="text-xs text-muted-foreground capitalize">{fund.occasion}</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">
              {fund.currentAmount.toLocaleString()} / {fund.targetAmount.toLocaleString()} {fund.currency}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {isCompleted ? "100% atteint" : `${Math.round(progressPercentage)}% atteint`}
          </p>
        </div>

        {/* Contributeurs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Contributeurs ({fund.contributors.length})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {fund.contributors.slice(0, 3).map((contributor) => (
                <Avatar key={contributor.id} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                    {contributor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {fund.contributors.length > 3 && (
                <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium">+{fund.contributors.length - 3}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              {fund.contributors.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  {fund.contributors.slice(0, 2).map(c => c.name).join(', ')}
                  {fund.contributors.length > 2 && ` et ${fund.contributors.length - 2} autre${fund.contributors.length > 3 ? 's' : ''}`}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Aucune contribution pour le moment</div>
              )}
            </div>
          </div>
        </div>

        {/* Messages d'état et boutons d'action */}
        {isExpired && (
          <div className="space-y-3">
            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-red-600 font-medium text-sm mb-1">
                <AlertTriangle className="h-4 w-4" />
                Cotisation expirée
              </div>
              <div className="text-xs text-red-600">
                L'objectif n'a pas été atteint avant la date limite. Les remboursements ont été traités automatiquement.
              </div>
            </div>
            
            {/* Bouton remboursement pour les contributeurs */}
            {fund.contributors.some(c => c.id === user?.id) && (
              <Button 
                onClick={handleRequestRefund}
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Demander le remboursement
              </Button>
            )}
          </div>
        )}

        {reciprocityInfo && !isExpired && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">
              <Heart className="h-4 w-4 fill-current" />
              Tu as déjà contribué {reciprocityInfo.contribution_amount} XOF
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              C'est le moment de rendre la pareille ! 🎁
            </div>
          </div>
        )}
        
        {!isCompleted && !isExpired && (
          <Button 
            onClick={handleContribute}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            Contribuer
          </Button>
        )}
        
        {isCompleted && (
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-green-600 font-medium text-sm">✅ Objectif atteint !</div>
            <div className="text-xs text-green-600 mt-1">La commande est en cours de traitement</div>
          </div>
        )}
      </Card>

      {!isExpired && (
        <ContributionModal 
          isOpen={showContributionModal}
          onClose={() => setShowContributionModal(false)}
          fundId={fund.id}
          fundTitle={fund.title}
          targetAmount={fund.targetAmount}
          currentAmount={fund.currentAmount}
          currency={fund.currency}
          onContributionSuccess={onContributionSuccess}
        />
      )}
    </>
  );
}