import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricSparklineCard } from './MetricSparklineCard';
import { useMonthlyComparison } from '@/hooks/useMonthlyComparison';
import { Loader2 } from 'lucide-react';

export function MetricsSparklineDashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { metrics, totals, loading } = useMonthlyComparison(year);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!totals) return null;

  // Extract monthly values for sparklines
  const userValues = metrics.map(m => m.users);
  const businessValues = metrics.map(m => m.businesses);
  const revenueValues = metrics.map(m => m.revenue);
  const orderValues = metrics.map(m => m.orders);
  const fundValues = metrics.map(m => m.funds);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Évolution mensuelle {year}</h3>
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricSparklineCard
          title="Utilisateurs"
          icon="users"
          values={userValues}
          total={totals.users}
          variation={totals.usersVariation}
          objective={totals.usersObjective}
          attainment={totals.usersVsObjective}
        />
        <MetricSparklineCard
          title="Entreprises"
          icon="business"
          values={businessValues}
          total={totals.businesses}
          variation={totals.businessesVariation}
          objective={totals.businessesObjective}
          attainment={totals.businessesVsObjective}
        />
        <MetricSparklineCard
          title="Revenus"
          icon="revenue"
          values={revenueValues}
          total={totals.revenue}
          variation={totals.revenueVariation}
          objective={totals.revenueObjective}
          attainment={totals.revenueVsObjective}
          formatValue={formatCurrency}
        />
        <MetricSparklineCard
          title="Commandes"
          icon="orders"
          values={orderValues}
          total={totals.orders}
          variation={totals.ordersVariation}
          objective={totals.ordersObjective}
          attainment={totals.ordersVsObjective}
        />
        <MetricSparklineCard
          title="Cagnottes"
          icon="funds"
          values={fundValues}
          total={totals.funds}
          variation={totals.fundsVariation}
          objective={totals.fundsObjective}
          attainment={totals.fundsVsObjective}
        />
      </div>
    </div>
  );
}
