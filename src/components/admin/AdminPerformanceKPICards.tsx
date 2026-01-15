import { Card, CardContent } from '@/components/ui/card';
import { Activity, Clock, Bell, TrendingUp } from 'lucide-react';
import { PerformanceKPIs } from '@/hooks/useAdminPerformance';
import { cn } from '@/lib/utils';

interface AdminPerformanceKPICardsProps {
  kpis: PerformanceKPIs;
  loading?: boolean;
}

const formatResponseTime = (minutes: number | null): string => {
  if (minutes === null) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}min`;
};

const getResponseTimeStatus = (minutes: number | null): 'success' | 'warning' | 'error' => {
  if (minutes === null) return 'warning';
  if (minutes < 120) return 'success'; // < 2h
  if (minutes < 360) return 'warning'; // 2-6h
  return 'error'; // > 6h
};

const getActivityStatus = (rate: number): 'success' | 'warning' | 'error' => {
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'warning';
  return 'error';
};

export const AdminPerformanceKPICards = ({ kpis, loading }: AdminPerformanceKPICardsProps) => {
  const responseStatus = getResponseTimeStatus(kpis.avgResponseTimeMinutes);
  const activityStatus = getActivityStatus(kpis.avgActivityRate);

  const cards = [
    {
      title: 'Actions totales',
      value: loading ? '...' : kpis.totalActions.toLocaleString('fr-FR'),
      icon: Activity,
      description: 'Sur la période sélectionnée',
      status: 'neutral' as const,
    },
    {
      title: 'Temps de réponse moyen',
      value: loading ? '...' : formatResponseTime(kpis.avgResponseTimeMinutes),
      icon: Clock,
      description: 'Délai de traitement',
      status: responseStatus,
    },
    {
      title: 'Notifications traitées',
      value: loading ? '...' : kpis.notificationsProcessed.toLocaleString('fr-FR'),
      icon: Bell,
      description: 'Lues et traitées',
      status: 'neutral' as const,
    },
    {
      title: "Taux d'activité",
      value: loading ? '...' : `${Math.round(kpis.avgActivityRate)}%`,
      icon: TrendingUp,
      description: 'Moyenne équipe',
      status: activityStatus,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className={cn(
                  "text-2xl font-bold",
                  card.status === 'success' && "text-green-600",
                  card.status === 'warning' && "text-yellow-600",
                  card.status === 'error' && "text-red-600"
                )}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                card.status === 'success' && "bg-green-100",
                card.status === 'warning' && "bg-yellow-100",
                card.status === 'error' && "bg-red-100",
                card.status === 'neutral' && "bg-primary/10"
              )}>
                <card.icon className={cn(
                  "h-5 w-5",
                  card.status === 'success' && "text-green-600",
                  card.status === 'warning' && "text-yellow-600",
                  card.status === 'error' && "text-red-600",
                  card.status === 'neutral' && "text-primary"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
