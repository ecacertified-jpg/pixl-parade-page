import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface OccasionData {
  occasion: string;
  count: number;
  total_amount: number;
}

interface OccasionBreakdownChartProps {
  occasionBreakdown: OccasionData[];
}

const OCCASION_LABELS: Record<string, string> = {
  birthday: 'Anniversaire',
  wedding: 'Mariage',
  academic: 'Académique',
  promotion: 'Promotion',
  other: 'Autre',
};

export function OccasionBreakdownChart({ occasionBreakdown }: OccasionBreakdownChartProps) {
  const chartData = occasionBreakdown.map((occasion) => ({
    name: OCCASION_LABELS[occasion.occasion] || occasion.occasion,
    contributions: occasion.count,
    montant: Math.round(occasion.total_amount),
  }));

  const totalContributions = occasionBreakdown.reduce((sum, o) => sum + o.count, 0);
  const totalAmount = occasionBreakdown.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributions par Occasion</CardTitle>
        <CardDescription>
          {totalContributions} contributions · {totalAmount.toLocaleString('fr-FR')} XOF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-muted-foreground text-xs"
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
                        Montant: {Number(payload[1].value).toLocaleString('fr-FR')} XOF
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="contributions" 
              fill="hsl(var(--chart-1))" 
              name="Contributions"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="montant" 
              fill="hsl(var(--chart-2))" 
              name="Montant (XOF)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
