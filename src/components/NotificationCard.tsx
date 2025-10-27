import { Gift, Calendar, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NotificationCardProps {
  title: string;
  subtitle: string;
  daysLeft?: number;
  onAction: () => void;
  type?: 'default' | 'reciprocity';
  contributionAmount?: number;
  currency?: string;
}

export function NotificationCard({ 
  title, 
  subtitle, 
  daysLeft, 
  onAction,
  type = 'default',
  contributionAmount,
  currency = 'XOF'
}: NotificationCardProps) {
  const isReciprocity = type === 'reciprocity';
  
  return (
    <Card className={`flex items-center justify-between p-4 mb-6 shadow-card ${
      isReciprocity 
        ? 'bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/40 animate-pulse-subtle' 
        : 'bg-gradient-to-r from-accent/20 to-secondary/20 border-accent/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isReciprocity ? 'bg-primary' : 'bg-accent'}`}>
          {isReciprocity ? (
            <Heart className="h-5 w-5 text-primary-foreground fill-current" />
          ) : (
            <Gift className="h-5 w-5 text-accent-foreground" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {isReciprocity && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Réciprocité
              </Badge>
            )}
          </div>
          {isReciprocity && contributionAmount && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Vous aviez contribué {contributionAmount} {currency}
            </p>
          )}
          {daysLeft !== undefined && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
      <Button 
        variant={isReciprocity ? "default" : "secondary"}
        size="sm"
        onClick={onAction}
        className={isReciprocity ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-secondary-foreground"}
      >
        {isReciprocity ? "Contribuer maintenant" : "Offrir"}
      </Button>
    </Card>
  );
}