import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FieldRate {
  field: string;
  fieldKey: string;
  currentRate: number;
  previousRate: number;
  change: number;
}

interface FieldCompletionChartProps {
  data: FieldRate[];
}

const chartConfig = {
  currentRate: {
    label: 'Taux actuel',
    color: 'hsl(var(--primary))',
  },
};

function getBarColor(rate: number): string {
  if (rate >= 70) return 'hsl(142, 76%, 36%)'; // Green
  if (rate >= 40) return 'hsl(38, 92%, 50%)'; // Orange
  return 'hsl(0, 84%, 60%)'; // Red
}

export function FieldCompletionChart({ data }: FieldCompletionChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taux de remplissage par champ</CardTitle>
          <CardDescription>Pourcentage de profils avec chaque champ renseigné</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Aucune donnée disponible
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux de remplissage par champ</CardTitle>
        <CardDescription>Pourcentage de profils avec chaque champ renseigné</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((field) => {
            const TrendIcon = field.change > 0 ? TrendingUp : field.change < 0 ? TrendingDown : Minus;
            const trendColor = field.change > 0 ? 'text-green-600' : field.change < 0 ? 'text-red-600' : 'text-muted-foreground';
            
            return (
              <div key={field.fieldKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{field.field}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{field.currentRate}%</span>
                    <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{field.change > 0 ? '+' : ''}{field.change}%</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={field.currentRate} 
                    className="h-3"
                    style={{
                      // Use CSS custom property for the indicator color
                    }}
                  />
                  <div 
                    className="absolute top-0 left-0 h-3 rounded-full transition-all"
                    style={{
                      width: `${field.currentRate}%`,
                      backgroundColor: getBarColor(field.currentRate),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bar chart view */}
        <div className="mt-6 pt-6 border-t">
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                type="category" 
                dataKey="field" 
                width={80}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload as FieldRate;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.field}</p>
                      <p className="text-sm">Taux actuel: <span className="font-bold">{data.currentRate}%</span></p>
                      <p className="text-xs text-muted-foreground">
                        Variation: {data.change > 0 ? '+' : ''}{data.change}%
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="currentRate" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.currentRate)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
