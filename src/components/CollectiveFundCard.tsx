import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Gift } from "lucide-react";
import { useState } from "react";
import { ContributeModal } from "./ContributeModal";

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar?: string;
}

interface CollectiveFund {
  id: string;
  title: string;
  beneficiaryName: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  productImage?: string;
  productName: string;
  contributors: Contributor[];
  status: 'active' | 'completed' | 'expired';
  occasion: string;
}

interface CollectiveFundCardProps {
  fund: CollectiveFund;
  onContribute?: (fundId: string) => void;
}

export function CollectiveFundCard({ fund, onContribute }: CollectiveFundCardProps) {
  const [showContributeModal, setShowContributeModal] = useState(false);
  
  const progressPercentage = Math.min((fund.currentAmount / fund.targetAmount) * 100, 100);
  const isCompleted = fund.currentAmount >= fund.targetAmount;
  
  const handleContribute = () => {
    if (onContribute) {
      onContribute(fund.id);
    } else {
      setShowContributeModal(true);
    }
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        {/* Header avec nom du bénéficiaire et statut */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{fund.title}</h3>
            <p className="text-sm text-muted-foreground">Pour: {fund.beneficiaryName}</p>
          </div>
          <Badge 
            variant={isCompleted ? "default" : "secondary"}
            className={isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {isCompleted ? "Terminé" : "En cours"}
          </Badge>
        </div>

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

        {/* Bouton d'action */}
        {!isCompleted && (
          <Button 
            onClick={handleContribute}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            Contribuer
          </Button>
        )}
      </Card>

      <ContributeModal 
        isOpen={showContributeModal}
        onClose={() => setShowContributeModal(false)}
      />
    </>
  );
}