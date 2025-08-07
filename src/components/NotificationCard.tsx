import { Gift, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotificationCardProps {
  title: string;
  subtitle: string;
  daysLeft: number;
  onAction: () => void;
}

export function NotificationCard({ title, subtitle, daysLeft, onAction }: NotificationCardProps) {
  return (
    <Card className="flex items-center justify-between p-4 mb-6 bg-gradient-to-r from-accent/20 to-secondary/20 border-accent/30 shadow-card">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent rounded-lg">
          <Gift className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={onAction}
        className="text-secondary-foreground"
      >
        Offrir
      </Button>
    </Card>
  );
}