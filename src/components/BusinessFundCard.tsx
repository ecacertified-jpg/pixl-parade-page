import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Users, Target, Calendar, MapPin, Package, Share2 } from "lucide-react";
import { FundCommentsSection } from "./FundCommentsSection";
import { ShareFundModal } from "./ShareFundModal";
import { useState } from "react";

interface BusinessFund {
  id: string;
  fund_id: string;
  business_id: string;
  product_id: string;
  beneficiary_user_id: string;
  created_at: string;
  fund?: {
    id: string;
    title: string;
    description?: string;
    target_amount: number;
    current_amount: number;
    currency: string;
    status: string;
    occasion?: string;
    deadline_date?: string;
  };
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
  };
  beneficiary?: {
    user_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

interface BusinessFundCardProps {
  fund: BusinessFund;
  onContactBeneficiary?: (fund: BusinessFund) => void;
}

export function BusinessFundCard({ fund, onContactBeneficiary }: BusinessFundCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const progress = fund.fund ? (fund.fund.current_amount / fund.fund.target_amount) * 100 : 0;
  const isCompleted = progress >= 100;
  const beneficiaryName = fund.beneficiary 
    ? `${fund.beneficiary.first_name || ''} ${fund.beneficiary.last_name || ''}`.trim()
    : 'Bénéficiaire';

  const getStatusBadge = () => {
    if (!fund.fund) return null;
    
    switch (fund.fund.status) {
      case 'active':
        return isCompleted ? 
          <Badge className="bg-green-500">Objectif atteint !</Badge> :
          <Badge className="bg-blue-500">En cours</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirée</Badge>;
      case 'target_reached':
        return <Badge className="bg-green-500">Terminée</Badge>;
      default:
        return <Badge variant="outline">{fund.fund.status}</Badge>;
    }
  };

  const handleContactClick = () => {
    if (onContactBeneficiary) {
      onContactBeneficiary(fund);
    } else if (fund.beneficiary?.phone) {
      window.open(`tel:${fund.beneficiary.phone}`, '_self');
    }
  };

  return (
    <Card className={`p-4 space-y-4 ${isCompleted ? 'border-green-200 bg-green-50/50' : ''}`}>
      {/* Header with product and status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {fund.product?.image_url && (
            <img
              src={fund.product.image_url}
              alt={fund.product.name}
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold">{fund.fund?.title || fund.product?.name}</h3>
            <p className="text-sm text-muted-foreground">
              Cotisation pour {beneficiaryName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
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

      {/* Product info */}
      {fund.product && (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{fund.product.name}</span>
          <span className="text-sm text-muted-foreground ml-auto">
            {fund.product.price.toLocaleString()} {fund.product.currency || 'XOF'}
          </span>
        </div>
      )}

      {/* Progress */}
      {fund.fund && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Objectif:</span>
            <span className="font-medium">
              {fund.fund.target_amount.toLocaleString()} {fund.fund.currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Collecté:</span>
            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
              {fund.fund.current_amount.toLocaleString()} {fund.fund.currency}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}% de l'objectif atteint
          </div>
        </div>
      )}

      {/* Beneficiary info */}
      {fund.beneficiary && (
        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {(fund.beneficiary.first_name?.charAt(0) || fund.beneficiary.email?.charAt(0) || '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium">{beneficiaryName}</div>
            {fund.beneficiary.email && (
              <div className="text-xs text-muted-foreground">{fund.beneficiary.email}</div>
            )}
          </div>
          {fund.beneficiary.phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleContactClick}
              className="h-8"
            >
              <Phone className="h-3 w-3 mr-1" />
              Appeler
            </Button>
          )}
        </div>
      )}

      {/* Timeline info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Créé le {new Date(fund.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        {fund.fund?.deadline_date && (
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Échéance: {new Date(fund.fund.deadline_date).toLocaleDateString('fr-FR')}</span>
          </div>
        )}
      </div>

      {/* Section commentaires */}
      {fund.fund_id && (
        <div className="border-t pt-4">
          <FundCommentsSection fundId={fund.fund_id} />
        </div>
      )}

      {/* Actions */}
      {isCompleted && fund.beneficiary && (
        <div className="pt-2 border-t">
          <Button
            onClick={handleContactClick}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            <Phone className="h-4 w-4 mr-2" />
            Contacter pour livraison
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Objectif atteint ! Contactez {beneficiaryName} pour organiser la livraison.
          </p>
        </div>
      )}

      <ShareFundModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        fundId={fund.fund_id}
        fundTitle={fund.fund?.title || fund.product?.name || 'Cagnotte'}
        fundDescription={`Pour ${beneficiaryName} - ${fund.product?.name || ''}`}
      />
    </Card>
  );
}