import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BadgeDistribution {
  badge_level: string;
  count: number;
  avg_score: number;
}

interface BadgeDistributionChartProps {
  badgeDistribution: BadgeDistribution[];
}

const COLORS = {
  champion: 'hsl(var(--chart-1))',
  generous: 'hsl(var(--chart-2))',
  helper: 'hsl(var(--chart-3))',
  newcomer: 'hsl(var(--chart-4))',
};

const LABELS = {
  champion: 'Champion',
  generous: 'Généreux',
  helper: 'Contributeur',
  newcomer: 'Nouveau',
};

export function BadgeDistributionChart({ badgeDistribution }: BadgeDistributionChartProps) {
  const chartData = badgeDistribution
    .filter(b => b.count > 0)
    .map((badge) => ({
      name: LABELS[badge.badge_level as keyof typeof LABELS] || badge.badge_level,
      value: badge.count,
      avgScore: badge.avg_score,
      level: badge.badge_level,
    }));

  const totalUsers = badgeDistribution.reduce((sum, b) => sum + b.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des Badges</CardTitle>
        <CardDescription>
          Répartition des {totalUsers} utilisateurs par niveau de badge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.level as keyof typeof COLORS]} 
                />
              ))}
            </Pie>
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Utilisateurs: {data.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score moyen: {data.avgScore.toFixed(1)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
