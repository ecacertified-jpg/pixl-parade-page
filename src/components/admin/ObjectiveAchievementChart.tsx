import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { Target } from 'lucide-react';

interface ObjectiveAchievementChartProps {
  countryCode: string;
  countryName: string;
  metricType: 'users' | 'businesses' | 'revenue' | 'orders';
  year: number;
  monthlyData: Array<{
    month: number;
    actual: number;
    target: number;
  }>;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const METRIC_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus',
  orders: 'Commandes'
};

export function ObjectiveAchievementChart({
  countryCode,
  countryName,
  metricType,
  year,
  monthlyData
}: ObjectiveAchievementChartProps) {
  const chartData = useMemo(() => {
    return monthlyData.map(item => ({
      month: MONTH_LABELS[item.month - 1],
      Réalisé: item.actual,
      Objectif: item.target,
      écart: item.actual - item.target
    }));
  }, [monthlyData]);

  const hasData = monthlyData.some(m => m.actual > 0 || m.target > 0);

  const formatValue = (value: number) => {
    if (metricType === 'revenue') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString('fr-FR');
  };

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            {METRIC_LABELS[metricType]} - {countryName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Aucune donnée disponible pour {year}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          {METRIC_LABELS[metricType]} - {countryName} ({year})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorActual-${countryCode}-${metricType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={formatValue}
              className="text-muted-foreground"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value: number) => formatValue(value)}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Objectif"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              fill="none"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Réalisé"
              stroke="hsl(var(--primary))"
              fill={`url(#colorActual-${countryCode}-${metricType})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
