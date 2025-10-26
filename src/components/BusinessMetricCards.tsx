import { DollarSign, ShoppingCart, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BusinessMetricCardsProps {
  stats: {
    totalSales: number;
    monthlyOrders: number;
    activeProducts: number;
  };
}

export const BusinessMetricCards = ({ stats }: BusinessMetricCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Revenus totaux */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Revenus totaux</p>
            <p className="text-3xl font-bold text-foreground">
              {stats.totalSales.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">F CFA</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-success" />
          </div>
        </div>
      </Card>

      {/* Commandes du mois */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Commandes du mois</p>
            <p className="text-3xl font-bold text-foreground">
              {stats.monthlyOrders}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ce mois-ci</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </Card>

      {/* Produits actifs */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Produits actifs</p>
            <p className="text-3xl font-bold text-foreground">
              {stats.activeProducts}
            </p>
            <p className="text-xs text-muted-foreground mt-1">en catalogue</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>
    </div>
  );
};
