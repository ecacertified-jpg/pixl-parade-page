import { Flame, Heart, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FavoriteStatsBarProps {
  total: number;
  urgent: number;
  estimatedBudget: number;
}

export function FavoriteStatsBar({ total, urgent, estimatedBudget }: FavoriteStatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <Card className="p-4 border-l-4 border-l-destructive bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Urgent</p>
            <p className="text-2xl font-bold">{urgent}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-primary bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Heart className="h-5 w-5 text-primary fill-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-l-4 border-l-success bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Budget estimé</p>
            <p className="text-xl font-bold">{estimatedBudget.toLocaleString()} XOF</p>
          </div>
        </div>
      </Card>
    </div>
  );
}