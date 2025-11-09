import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, Gift, Phone, MapPin, CreditCard, Share2 } from "lucide-react";
import { FundCommentsSection } from "./FundCommentsSection";
import { ShareFundModal } from "./ShareFundModal";
import { useState } from "react";

interface Contributor {
  id: string;
  name: string;
  amount: number;
  avatar?: string;
}

interface CollectiveFundBusinessCardProps {
  fund: {
    id: string;
    title: string;
    beneficiaryName: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    productImage?: string;
    productName: string;
    contributors: Contributor[];
    status: 'active' | 'completed' | 'expired' | 'target_reached';
    occasion: string;
    orderData?: {
      donor_phone: string;
      beneficiary_phone: string;
      delivery_address: string;
      payment_method: string;
      order_summary: {
        items: Array<{
          name: string;
          description: string;
          price: number;
          quantity: number;
          currency: string;
          image: string;
        }>;
        subtotal: number;
        shippingCost: number;
        total: number;
      };
    };
  };
}

export function CollectiveFundBusinessCard({ fund }: CollectiveFundBusinessCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const progressPercentage = Math.min((fund.currentAmount / fund.targetAmount) * 100, 100);
  const isCompleted = fund.currentAmount >= fund.targetAmount;
  
  return (
    <Card className="p-4 space-y-4">
      {/* Header avec nom du bénéficiaire et statut */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{fund.title}</h3>
          <p className="text-sm text-muted-foreground">Pour: {fund.beneficiaryName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isCompleted ? "default" : "secondary"}
            className={isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {isCompleted ? "Terminé" : "En cours"}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
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
          <p className="text-xs text-primary font-medium">
            {fund.targetAmount.toLocaleString()} {fund.currency}
          </p>
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
          {isCompleted ? "100% atteint - Prêt pour livraison 🎉" : `${Math.round(progressPercentage)}% atteint`}
        </p>
      </div>

      {/* Contributeurs */}
      {fund.contributors.length > 0 && (
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
              <div className="text-xs text-muted-foreground">
                {fund.contributors.slice(0, 2).map(c => `${c.name}: ${c.amount.toLocaleString()}F`).join(', ')}
                {fund.contributors.length > 2 && ` et ${fund.contributors.length - 2} autre${fund.contributors.length > 3 ? 's' : ''}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section commentaires */}
      <div className="border-t pt-4">
        <FundCommentsSection fundId={fund.id} />
      </div>

      {/* Informations de contact et livraison */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Phone className="h-4 w-4 text-blue-500" />
          Informations de contact
        </h4>
        
        <div className="p-3 bg-blue-50 rounded-lg space-y-2 text-xs">
          {fund.orderData?.beneficiary_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-blue-600" />
              <span className="text-muted-foreground">Bénéficiaire:</span>
              <span className="font-medium">{fund.orderData.beneficiary_phone}</span>
            </div>
          )}
          
          {fund.orderData?.delivery_address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-blue-600 mt-0.5" />
              <span className="text-muted-foreground">Livraison:</span>
              <span className="flex-1">{fund.orderData.delivery_address}</span>
            </div>
          )}
          
          {!fund.orderData?.delivery_address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-orange-500 mt-0.5" />
              <span className="text-muted-foreground">Livraison:</span>
              <span className="flex-1 text-orange-600">Adresse à confirmer</span>
            </div>
          )}
        </div>

        {/* Informations de commande complètes si terminé */}
        {isCompleted && fund.orderData && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-500" />
              Détails de la commande
            </h4>
            
            <div className="p-3 bg-green-50 rounded-lg space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">Donateur:</span>
                <span className="font-medium">{fund.orderData.donor_phone}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">Paiement:</span>
                <span>
                  {fund.orderData.payment_method === 'cash_on_delivery' ? 'À la livraison' : 'Mobile Money'}
                </span>
              </div>
            </div>

            {/* Notification pour le prestataire */}
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800">
                🎉 Objectif atteint ! Vous pouvez maintenant préparer et livrer ce cadeau.
              </p>
            </div>
          </div>
        )}
      </div>

      <ShareFundModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        fundId={fund.id}
        fundTitle={fund.title}
        fundDescription={`Pour ${fund.beneficiaryName} - ${fund.productName}`}
      />
    </Card>
  );
}