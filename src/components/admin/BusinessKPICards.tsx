import { Card, CardContent } from '@/components/ui/card';
import { Building2, DollarSign, ShoppingCart, Package, TrendingUp, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { BusinessDetailedStats } from '@/hooks/useBusinessDetailedStats';

interface BusinessKPICardsProps {
  stats: BusinessDetailedStats | null;
  loading: boolean;
}

export function BusinessKPICards({ stats, loading }: BusinessKPICardsProps) {
  const kpis = [
    {
      title: 'Total Business',
      value: stats?.totalBusinesses || 0,
      subtitle: `${stats?.activeBusinesses || 0} actifs`,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Vérifiés',
      value: stats?.verifiedBusinesses || 0,
      subtitle: `${stats?.totalBusinesses ? Math.round((stats.verifiedBusinesses / stats.totalBusinesses) * 100) : 0}% du total`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Revenus Totaux',
      value: `${((stats?.totalRevenue || 0) / 1000).toFixed(1)}k`,
      subtitle: 'XOF',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Commandes',
      value: stats?.totalOrders || 0,
      subtitle: `Moy. ${((stats?.avgOrderValue || 0) / 1000).toFixed(1)}k/cmd`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Produits',
      value: stats?.totalProducts || 0,
      subtitle: 'en catalogue',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Moy./Business',
      value: `${((stats?.avgRevenuePerBusiness || 0) / 1000).toFixed(1)}k`,
      subtitle: 'revenu moyen',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate pr-1">{kpi.title}</span>
                <div className={`p-1 sm:p-1.5 rounded-lg ${kpi.bgColor} shrink-0`}>
                  <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-lg sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
