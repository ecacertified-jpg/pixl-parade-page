import { Card, CardContent } from '@/components/ui/card';
import { Users, Store, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlobalTotals } from '@/hooks/useCountryPerformance';

interface GlobalSummaryKPIsProps {
  totals: GlobalTotals;
  loading?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

const GrowthIndicator = ({ rate }: { rate: number }) => {
  if (rate > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{rate.toFixed(1)}%</span>
      </div>
    );
  }
  if (rate < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{rate.toFixed(1)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">0%</span>
    </div>
  );
};

export const GlobalSummaryKPIs = ({ totals, loading }: GlobalSummaryKPIsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-24 mb-2" />
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Utilisateurs',
      value: totals.totalUsers.toLocaleString('fr-FR'),
      growth: totals.userGrowthRate,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Entreprises',
      value: totals.totalBusinesses.toLocaleString('fr-FR'),
      growth: totals.businessGrowthRate,
      icon: Store,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Revenus',
      value: `${formatCurrency(totals.totalRevenue)} FCFA`,
      growth: totals.revenueGrowthRate,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Commandes',
      value: totals.totalOrders.toLocaleString('fr-FR'),
      growth: totals.orderGrowthRate,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map(kpi => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <div className="mt-2">
                    <GrowthIndicator rate={kpi.growth} />
                    <p className="text-xs text-muted-foreground mt-1">vs 30 jours précédents</p>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
