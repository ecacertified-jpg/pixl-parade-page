import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendData {
  date: string;
  contributions_count: number;
  avg_amount: number;
  avg_reciprocity_score: number;
}

interface ReciprocityTrendsChartProps {
  trends: TrendData[];
}

export function ReciprocityTrendsChart({ trends }: ReciprocityTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendances de Réciprocité</CardTitle>
        <CardDescription>
          Évolution temporelle des contributions et scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              className="text-muted-foreground"
              label={{ value: 'Nombre', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-muted-foreground"
              label={{ value: 'Montant (XOF)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        Contributions: {payload[0].value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Montant moyen: {Number(payload[1].value).toLocaleString('fr-FR')} XOF
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="contributions_count" 
              stroke="hsl(var(--chart-1))" 
              name="Contributions"
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avg_amount" 
              stroke="hsl(var(--chart-2))" 
              name="Montant moyen"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
