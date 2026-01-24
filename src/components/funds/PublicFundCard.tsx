import { Link } from "react-router-dom";
import { Gift, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isValidImageUrl } from "@/lib/utils";
import type { PublicFund } from "@/hooks/usePublicFunds";

interface PublicFundCardProps {
  fund: PublicFund;
  onContribute?: (fund: PublicFund) => void;
}

/**
 * Calcule les jours avant l'anniversaire
 */
function getDaysUntilBirthday(birthdayDate: string | null | undefined, beneficiaryName?: string): string {
  if (!birthdayDate && beneficiaryName) {
    return `Pour ${beneficiaryName}`;
  }
  
  if (!birthdayDate) return "Cadeau surprise";
  
  const today = new Date();
  const birthday = new Date(birthdayDate);
  
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birthday.getMonth(),
    birthday.getDate()
  );
  
  if (thisYearBirthday < today) {
    thisYearBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = thisYearBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `Anniv. dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

/**
 * PublicFundCard - Carte affichant une cagnotte publique
 * Réutilisable pour la page liste et le carousel
 */
export function PublicFundCard({ fund, onContribute }: PublicFundCardProps) {
  const progress = (fund.currentAmount / fund.targetAmount) * 100;

  return (
    <Card className="overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Product Image */}
      <Link to={`/f/${fund.id}`} className="block">
        <div className="h-24 bg-gradient-to-br from-secondary to-accent/30 overflow-hidden">
          {isValidImageUrl(fund.productImage) ? (
            <img 
              src={fund.productImage} 
              alt={fund.productName} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary/40" />
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3 space-y-2">
        {/* Title */}
        <Link to={`/f/${fund.id}`}>
          <h3 className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors">
            {fund.productName || fund.title}
          </h3>
        </Link>
        
        {/* Beneficiary */}
        <p className="text-xs text-muted-foreground truncate">
          Pour {fund.beneficiaryName}
        </p>
        
        {/* Occasion / Birthday */}
        <p className="text-xs text-muted-foreground/70 truncate">
          {getDaysUntilBirthday(fund.beneficiaryBirthday, fund.beneficiaryName)}
        </p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-primary">
              {fund.currentAmount.toLocaleString()} {fund.currency}
            </span>
            <span className="text-muted-foreground">
              {fund.targetAmount.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Contributors */}
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Users className="h-3 w-3" />
          <span>
            {fund.contributorsCount} contributeur{fund.contributorsCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* CTA Button */}
        <Button 
          size="sm" 
          className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
          onClick={() => onContribute?.(fund)}
        >
          <Gift className="h-3 w-3 mr-1" />
          Contribuer
        </Button>
      </div>
    </Card>
  );
}
