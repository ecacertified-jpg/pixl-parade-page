import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareAnalyticsData } from '@/hooks/useShareAnalytics';
import { Share2, MousePointer, Eye, TrendingUp } from 'lucide-react';

interface ShareFunnelChartProps {
  data: ShareAnalyticsData;
  loading: boolean;
}

export function ShareFunnelChart({ data, loading }: ShareFunnelChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(data.totalShares, 1);

  const steps = [
    {
      label: 'Partages',
      value: data.totalShares,
      icon: Share2,
      color: 'bg-primary',
      percentage: 100
    },
    {
      label: 'Clics',
      value: data.totalClicks,
      icon: MousePointer,
      color: 'bg-blue-500',
      percentage: data.totalShares > 0 ? (data.totalClicks / data.totalShares) * 100 : 0
    },
    {
      label: 'Vues',
      value: data.totalViews,
      icon: Eye,
      color: 'bg-amber-500',
      percentage: data.totalShares > 0 ? (data.totalViews / data.totalShares) * 100 : 0
    },
    {
      label: 'Conversions',
      value: data.totalConversions,
      icon: TrendingUp,
      color: 'bg-green-500',
      percentage: data.totalShares > 0 ? (data.totalConversions / data.totalShares) * 100 : 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Entonnoir de Conversion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const width = Math.max((step.value / maxValue) * 100, 5);
            
            return (
              <div key={step.label} className="relative">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-1.5 rounded ${step.color} bg-opacity-20`}>
                    <Icon className={`h-4 w-4 ${step.color.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="font-medium text-sm">{step.label}</span>
                  <span className="text-muted-foreground text-sm ml-auto">
                    {step.value.toLocaleString('fr-FR')}
                    {index > 0 && (
                      <span className="text-xs ml-1">
                        ({step.percentage.toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${step.color} transition-all duration-500 rounded-lg flex items-center justify-end pr-3`}
                    style={{ width: `${width}%` }}
                  >
                    {width > 15 && (
                      <span className="text-white text-xs font-medium">
                        {step.value.toLocaleString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Connector arrow */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-muted-foreground/30" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Conversion rates summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Taux de clic</p>
            <p className="text-lg font-bold text-blue-600">
              {data.totalShares > 0 
                ? ((data.totalClicks / data.totalShares) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taux de vue</p>
            <p className="text-lg font-bold text-amber-600">
              {data.totalClicks > 0 
                ? ((data.totalViews / data.totalClicks) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taux de conversion</p>
            <p className="text-lg font-bold text-green-600">
              {data.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
