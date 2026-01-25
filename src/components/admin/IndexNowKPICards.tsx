import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, CheckCircle2, XCircle, TrendingUp, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { IndexNowStats } from '@/hooks/useIndexNowStats';

interface IndexNowKPICardsProps {
  stats: IndexNowStats | null;
  loading: boolean;
}

export function IndexNowKPICards({ stats, loading }: IndexNowKPICardsProps) {
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

  if (!stats) return null;

  const kpis = [
    {
      label: 'Total soumissions',
      value: stats.totalSubmissions,
      icon: Send,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Réussies',
      value: stats.successCount,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Échouées',
      value: stats.failedCount,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      label: 'Taux de réussite',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: stats.successRate >= 90 ? 'text-green-600' : stats.successRate >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: stats.successRate >= 90 ? 'bg-green-100' : stats.successRate >= 70 ? 'bg-yellow-100' : 'bg-red-100',
    },
    {
      label: "Aujourd'hui",
      value: stats.todayCount,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Dernière',
      value: stats.lastSubmissionAt 
        ? formatDistanceToNow(new Date(stats.lastSubmissionAt), { addSuffix: true, locale: fr }).replace('il y a ', '')
        : '-',
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <div className={`text-xl font-bold ${kpi.isText ? 'text-sm' : ''} ${kpi.color}`}>
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
