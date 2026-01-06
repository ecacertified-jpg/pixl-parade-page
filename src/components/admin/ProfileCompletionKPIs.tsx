import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Trophy, CheckCircle, AlertCircle, XCircle, BarChart3 } from 'lucide-react';
import { SparklineChart } from './SparklineChart';

interface KPIData {
  averageScore: number;
  perfectCount: number;
  completeCount: number;
  partialCount: number;
  minimalCount: number;
  totalCount: number;
}

interface Comparison {
  averageScoreChange: number;
  perfectCountChange: number;
  completeRateChange: number;
}

interface TimeSeriesPoint {
  averageScore: number;
  perfect: number;
  complete: number;
  partial: number;
  minimal: number;
}

interface ProfileCompletionKPIsProps {
  stats: KPIData;
  comparison: Comparison;
  timeSeriesData: TimeSeriesPoint[];
}

export function ProfileCompletionKPIs({ stats, comparison, timeSeriesData }: ProfileCompletionKPIsProps) {
  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatTrend = (value: number, suffix = '') => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}${suffix}`;
  };

  const getTrendColor = (value: number, invert = false) => {
    const positive = invert ? value < 0 : value > 0;
    const negative = invert ? value > 0 : value < 0;
    if (positive) return 'text-green-600';
    if (negative) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const kpis = [
    {
      title: 'Score moyen',
      value: `${stats.averageScore}%`,
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: comparison.averageScoreChange,
      changeSuffix: '%',
      sparklineData: timeSeriesData.map(d => d.averageScore),
      sparklineColor: '#7A5DC7',
    },
    {
      title: 'Profils parfaits',
      value: stats.perfectCount.toString(),
      subtitle: `${stats.totalCount > 0 ? Math.round((stats.perfectCount / stats.totalCount) * 100) : 0}%`,
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: comparison.perfectCountChange,
      changeSuffix: '',
      sparklineData: timeSeriesData.map(d => d.perfect),
      sparklineColor: '#F59E0B',
    },
    {
      title: 'Complets (80%+)',
      value: stats.completeCount.toString(),
      subtitle: `${stats.totalCount > 0 ? Math.round((stats.completeCount / stats.totalCount) * 100) : 0}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: comparison.completeRateChange,
      changeSuffix: '%',
      sparklineData: timeSeriesData.map(d => d.complete),
      sparklineColor: '#10B981',
    },
    {
      title: 'Partiels (40-79%)',
      value: stats.partialCount.toString(),
      subtitle: `${stats.totalCount > 0 ? Math.round((stats.partialCount / stats.totalCount) * 100) : 0}%`,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: 0,
      changeSuffix: '',
      sparklineData: timeSeriesData.map(d => d.partial),
      sparklineColor: '#F97316',
    },
    {
      title: 'Minimaux (0-39%)',
      value: stats.minimalCount.toString(),
      subtitle: `${stats.totalCount > 0 ? Math.round((stats.minimalCount / stats.totalCount) * 100) : 0}%`,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: 0,
      changeSuffix: '',
      invert: true,
      sparklineData: timeSeriesData.map(d => d.minimal),
      sparklineColor: '#EF4444',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                {kpi.change !== 0 && (
                  <div className={`flex items-center gap-1 text-xs ${getTrendColor(kpi.change, kpi.invert)}`}>
                    <TrendIcon value={kpi.invert ? -kpi.change : kpi.change} />
                    <span>{formatTrend(kpi.change, kpi.changeSuffix)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold">{kpi.value}</p>
                {kpi.subtitle && (
                  <p className="text-xs text-muted-foreground">{kpi.subtitle} du total</p>
                )}
                <p className="text-xs text-muted-foreground truncate">{kpi.title}</p>
              </div>

              {kpi.sparklineData.length > 1 && (
                <div className="mt-3 h-8">
                  <SparklineChart 
                    data={kpi.sparklineData} 
                    color={kpi.sparklineColor}
                    height={32}
                    showArea
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
