import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TrendingUp, Building2 } from 'lucide-react';
import type { MonthlyTrend } from '@/hooks/useBusinessDetailedStats';
import { ExportButton } from './ExportButton';
import { exportToCSV, formatNumberFr, type ExportColumn } from '@/utils/exportUtils';

interface BusinessTrendsChartProps {
  data: MonthlyTrend[];
  loading: boolean;
}

type ViewMode = 'revenue' | 'businesses';

export function BusinessTrendsChart({ data, loading }: BusinessTrendsChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    revenue: {
      label: 'Revenus',
      color: 'hsl(var(--primary))'
    },
    orders: {
      label: 'Commandes',
      color: 'hsl(var(--chart-2))'
    },
    newBusinesses: {
      label: 'Nouveaux Business',
      color: 'hsl(142 76% 36%)'
    }
  };

  const formatRevenue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  // Calculate totals for the period
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalNewBusinesses = data.reduce((sum, d) => sum + d.newBusinesses, 0);

  const handleExportCSV = () => {
    const columns: ExportColumn<MonthlyTrend>[] = [
      { key: 'label', header: 'Mois' },
      { key: 'revenue', header: 'Revenus (XOF)', format: (v) => formatNumberFr(v) },
      { key: 'orders', header: 'Commandes' },
      { key: 'newBusinesses', header: 'Nouveaux Business' },
    ];
    exportToCSV(data, columns, 'tendances_business');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              📈 Tendances <span className="hidden sm:inline">Mensuelles</span> (12 mois)
            </CardTitle>
            <ExportButton onExportCSV={handleExportCSV} disabled={data.length === 0} />
          </div>
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="self-start"
          >
            <ToggleGroupItem value="revenue" aria-label="Voir revenus" size="sm">
              <TrendingUp className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Revenus</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="businesses" aria-label="Voir business" size="sm">
              <Building2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Business</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 sm:p-3 bg-primary/10 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-primary">{formatRevenue(totalRevenue)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total revenus</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-blue-100 rounded-lg">
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{totalOrders}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Commandes</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-green-100 rounded-lg col-span-2 sm:col-span-1">
            <p className="text-lg sm:text-2xl font-bold text-green-600">+{totalNewBusinesses}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Nouveaux business</p>
          </div>
        </div>

        <div className="h-56 sm:h-72">
          <ChartContainer config={chartConfig} className="h-full w-full">
            {viewMode === 'revenue' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tickFormatter={formatRevenue} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{label}</p>
                          {payload.map((entry: any) => (
                            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                              {entry.name === 'revenue' ? 'Revenus' : 'Commandes'}:{' '}
                              {entry.name === 'revenue' ? `${formatRevenue(entry.value)} XOF` : entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Legend
                  formatter={(value) => (value === 'revenue' ? 'Revenus (XOF)' : 'Commandes')}
                />
              </AreaChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="businessGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{label}</p>
                          <p className="text-sm text-green-600">
                            +{payload[0].value} nouveaux business
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="newBusinesses"
                  stroke="hsl(142 76% 36%)"
                  fill="url(#businessGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
