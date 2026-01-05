import { Card, CardContent } from '@/components/ui/card';
import { Send, CheckCircle, Eye, MousePointerClick, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationStatsCardsProps {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalConverted: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  totalConversionValue: number;
}

export function NotificationStatsCards({
  totalSent,
  totalDelivered,
  totalOpened,
  totalClicked,
  totalConverted,
  deliveryRate,
  openRate,
  clickRate,
  conversionRate,
  totalConversionValue,
}: NotificationStatsCardsProps) {
  const stats = [
    {
      label: 'Envoyées',
      value: totalSent.toLocaleString(),
      icon: Send,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Livrées',
      value: totalDelivered.toLocaleString(),
      subValue: `${deliveryRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Ouvertes',
      value: totalOpened.toLocaleString(),
      subValue: `${openRate.toFixed(1)}%`,
      icon: Eye,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Cliquées',
      value: totalClicked.toLocaleString(),
      subValue: `${clickRate.toFixed(1)}%`,
      icon: MousePointerClick,
      color: 'text-celebration',
      bgColor: 'bg-celebration/10',
    },
    {
      label: 'Conversions',
      value: totalConverted.toLocaleString(),
      subValue: `${conversionRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-heart',
      bgColor: 'bg-heart/10',
    },
    {
      label: 'Valeur générée',
      value: `${totalConversionValue.toLocaleString()} XOF`,
      icon: TrendingUp,
      color: 'text-gratitude',
      bgColor: 'bg-gratitude/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                  {stat.subValue && (
                    <p className={cn('text-xs font-medium', stat.color)}>{stat.subValue}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
