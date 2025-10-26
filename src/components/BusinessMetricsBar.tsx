import { Package, ShoppingCart, DollarSign, Star } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

interface BusinessMetricsBarProps {
  stats: {
    activeProducts: number;
    monthlyOrders: number;
    totalSales: number;
    averageProductRating: number;
  };
}

export const BusinessMetricsBar = ({ stats }: BusinessMetricsBarProps) => {
  return (
    <div className="bg-card border rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Produits */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Package className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Produits
            </p>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {stats.activeProducts}
          </p>
        </div>

        {/* Commandes */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Commandes
            </p>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {stats.monthlyOrders}
          </p>
        </div>

        {/* Revenus */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Revenus (F)
            </p>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {formatCompactNumber(stats.totalSales)}
          </p>
        </div>

        {/* Note */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Note
            </p>
          </div>
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {stats.averageProductRating || '—'}
            </p>
            {stats.averageProductRating > 0 && (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
