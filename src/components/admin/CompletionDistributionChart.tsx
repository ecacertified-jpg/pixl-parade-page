import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface TimeSeriesPoint {
  date: string;
  label: string;
  perfect: number;
  complete: number;
  partial: number;
  minimal: number;
  totalProfiles: number;
}

interface CompletionDistributionChartProps {
  data: TimeSeriesPoint[];
}

const chartConfig = {
  perfect: {
    label: '100% complet',
    color: 'hsl(45, 93%, 47%)', // Gold
  },
  complete: {
    label: '80-99%',
    color: 'hsl(142, 76%, 36%)', // Green
  },
  partial: {
    label: '40-79%',
    color: 'hsl(38, 92%, 50%)', // Orange
  },
  minimal: {
    label: '0-39%',
    color: 'hsl(0, 84%, 60%)', // Red
  },
};

export function CompletionDistributionChart({ data }: CompletionDistributionChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution des profils par niveau</CardTitle>
          <CardDescription>Évolution de la répartition dans le temps</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Aucune donnée disponible
        </CardContent>
      </Card>
    );
  }

  // Convert to percentages for stacked area
  const percentageData = data.map(point => ({
    ...point,
    perfectPct: point.totalProfiles > 0 ? (point.perfect / point.totalProfiles) * 100 : 0,
    completePct: point.totalProfiles > 0 ? (point.complete / point.totalProfiles) * 100 : 0,
    partialPct: point.totalProfiles > 0 ? (point.partial / point.totalProfiles) * 100 : 0,
    minimalPct: point.totalProfiles > 0 ? (point.minimal / point.totalProfiles) * 100 : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des profils par niveau</CardTitle>
        <CardDescription>Évolution de la répartition dans le temps (en %)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={percentageData} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={(value) => `${Math.round(value * 100)}%`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = data.find(d => d.label === label);
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium mb-2">{label}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Total: {point?.totalProfiles} profils
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: chartConfig.perfect.color }} />
                        <span>100%: {point?.perfect} ({point?.totalProfiles ? Math.round((point.perfect / point.totalProfiles) * 100) : 0}%)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: chartConfig.complete.color }} />
                        <span>80-99%: {point?.complete} ({point?.totalProfiles ? Math.round((point.complete / point.totalProfiles) * 100) : 0}%)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: chartConfig.partial.color }} />
                        <span>40-79%: {point?.partial} ({point?.totalProfiles ? Math.round((point.partial / point.totalProfiles) * 100) : 0}%)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: chartConfig.minimal.color }} />
                        <span>0-39%: {point?.minimal} ({point?.totalProfiles ? Math.round((point.minimal / point.totalProfiles) * 100) : 0}%)</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="minimalPct"
              stackId="1"
              stroke={chartConfig.minimal.color}
              fill={chartConfig.minimal.color}
              fillOpacity={0.8}
              name="minimal"
            />
            <Area
              type="monotone"
              dataKey="partialPct"
              stackId="1"
              stroke={chartConfig.partial.color}
              fill={chartConfig.partial.color}
              fillOpacity={0.8}
              name="partial"
            />
            <Area
              type="monotone"
              dataKey="completePct"
              stackId="1"
              stroke={chartConfig.complete.color}
              fill={chartConfig.complete.color}
              fillOpacity={0.8}
              name="complete"
            />
            <Area
              type="monotone"
              dataKey="perfectPct"
              stackId="1"
              stroke={chartConfig.perfect.color}
              fill={chartConfig.perfect.color}
              fillOpacity={0.8}
              name="perfect"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
