import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Users, Briefcase, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { PeriodSelector } from './PeriodSelector';
import { useRegistrationTrends, Granularity, getPresetDateRange, getRecommendedGranularity } from '@/hooks/useRegistrationTrends';
import { ExportButton } from './ExportButton';
import { exportToCSV, type ExportColumn } from '@/utils/exportUtils';

export function RegistrationTrendsChart() {
  const [startDate, setStartDate] = useState(() => getPresetDateRange('30d').startDate);
  const [endDate, setEndDate] = useState(() => getPresetDateRange('30d').endDate);
  const [granularity, setGranularity] = useState<Granularity>(() => getRecommendedGranularity(startDate, endDate));
  const [showCumulative, setShowCumulative] = useState(false);

  const { data, loading, totals, refetch } = useRegistrationTrends({
    startDate,
    endDate,
    granularity,
  });

  const handlePeriodChange = (newStart: Date, newEnd: Date) => {
    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const chartData = data.map(point => ({
    ...point,
    displayUsers: showCumulative ? point.usersTotal : point.users,
    displayBusinesses: showCumulative ? point.businessesTotal : point.businesses,
  }));

  const ChartComponent = showCumulative ? AreaChart : LineChart;

  const handleExportCSV = () => {
    const columns: ExportColumn<typeof chartData[0]>[] = [
      { key: 'label', header: 'Période' },
      { key: 'displayUsers', header: showCumulative ? 'Utilisateurs (cumul)' : 'Nouveaux utilisateurs' },
      { key: 'displayBusinesses', header: showCumulative ? 'Business (cumul)' : 'Nouveaux business' },
    ];
    exportToCSV(chartData, columns, 'inscriptions');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution des inscriptions
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExportButton onExportCSV={handleExportCSV} disabled={loading || data.length === 0} />
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PeriodSelector
          startDate={startDate}
          endDate={endDate}
          granularity={granularity}
          onPeriodChange={handlePeriodChange}
          onGranularityChange={setGranularity}
        />

        <div className="flex items-center gap-2">
          <Switch
            id="cumulative"
            checked={showCumulative}
            onCheckedChange={setShowCumulative}
          />
          <Label htmlFor="cumulative" className="text-sm">
            Afficher le cumul
          </Label>
        </div>

        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ChartComponent data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  {showCumulative ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="displayUsers"
                        name="Utilisateurs"
                        stroke="hsl(142, 76%, 36%)"
                        fill="hsl(142, 76%, 36%)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="displayBusinesses"
                        name="Business"
                        stroke="hsl(259, 58%, 59%)"
                        fill="hsl(259, 58%, 59%)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </>
                  ) : (
                    <>
                      <Line
                        type="monotone"
                        dataKey="displayUsers"
                        name="Utilisateurs"
                        stroke="hsl(142, 76%, 36%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="displayBusinesses"
                        name="Business"
                        stroke="hsl(259, 58%, 59%)"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(259, 58%, 59%)', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  )}
                </ChartComponent>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nouveaux utilisateurs</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{totals.users}</span>
                    <GrowthBadge value={totals.usersGrowth} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nouveaux business</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{totals.businesses}</span>
                    <GrowthBadge value={totals.businessGrowth} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        0%
      </span>
    );
  }

  const isPositive = value > 0;
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        isPositive
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : ''}{value}%
    </span>
  );
}
