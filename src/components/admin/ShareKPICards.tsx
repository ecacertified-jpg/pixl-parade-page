import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, MousePointer, TrendingUp, Percent, Eye, Coins } from 'lucide-react';
import { ShareAnalyticsData } from '@/hooks/useShareAnalytics';

interface ShareKPICardsProps {
  data: ShareAnalyticsData;
  loading: boolean;
}

export function ShareKPICards({ data, loading }: ShareKPICardsProps) {
  const kpis = [
    {
      title: 'Total Partages',
      value: data.totalShares,
      icon: Share2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      format: (v: number) => v.toLocaleString('fr-FR')
    },
    {
      title: 'Total Clics',
      value: data.totalClicks,
      icon: MousePointer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      format: (v: number) => v.toLocaleString('fr-FR')
    },
    {
      title: 'Total Vues',
      value: data.totalViews,
      icon: Eye,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      format: (v: number) => v.toLocaleString('fr-FR')
    },
    {
      title: 'Conversions',
      value: data.totalConversions,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      format: (v: number) => v.toLocaleString('fr-FR')
    },
    {
      title: 'Taux de Conversion',
      value: data.conversionRate,
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      format: (v: number) => `${v.toFixed(1)}%`
    },
    {
      title: 'Valeur Conversions',
      value: data.totalConversionValue,
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      format: (v: number) => `${v.toLocaleString('fr-FR')} FCFA`
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {kpi.title}
                </span>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>
                {kpi.format(kpi.value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
