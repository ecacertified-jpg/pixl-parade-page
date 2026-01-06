import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';

interface TimeSeriesPoint {
  date: string;
  label: string;
  averageScore: number;
  totalProfiles: number;
}

interface AverageScoreChartProps {
  data: TimeSeriesPoint[];
}

const chartConfig = {
  averageScore: {
    label: 'Score moyen',
    color: 'hsl(var(--primary))',
  },
};

export function AverageScoreChart({ data }: AverageScoreChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution du score moyen</CardTitle>
          <CardDescription>Score de complétion moyen dans le temps</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] flex items-center justify-center text-muted-foreground">
          Aucune donnée disponible
        </CardContent>
      </Card>
    );
  }

  const avgScore = data.reduce((sum, d) => sum + d.averageScore, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du score moyen</CardTitle>
        <CardDescription>Score de complétion moyen dans le temps</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as TimeSeriesPoint;
                return (
                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm">
                      Score moyen: <span className="font-bold">{point.averageScore}%</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {point.totalProfiles} profils
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine 
              y={avgScore} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              label={{ 
                value: `Moy: ${Math.round(avgScore)}%`, 
                position: 'right',
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }}
            />
            <Line
              type="monotone"
              dataKey="averageScore"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
