import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface BusinessFinancialSummaryProps {
  stats: {
    totalSales: number;
    commission: number;
    netRevenue: number;
  };
  platformName?: string;
  commissionRate?: number;
}

export const BusinessFinancialSummary = ({ 
  stats, 
  platformName = "JOIE DE VIVRE",
  commissionRate = 15
}: BusinessFinancialSummaryProps) => {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Résumé financier</h3>
      </div>
      
      <div className="space-y-4">
        {/* Ventes brutes */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Ventes brutes</span>
          <span className="text-lg font-semibold text-foreground">
            {stats.totalSales.toLocaleString()} F
          </span>
        </div>

        {/* Commission */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Commission {platformName} ({commissionRate}%)
          </span>
          <span className="text-lg font-semibold text-destructive">
            -{stats.commission.toLocaleString()} F
          </span>
        </div>

        {/* Séparateur */}
        <div className="border-t border-border pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Revenus nets</span>
            <span className="text-xl font-bold text-success">
              {stats.netRevenue.toLocaleString()} F
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
