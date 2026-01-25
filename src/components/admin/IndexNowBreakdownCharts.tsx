import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { IndexNowStats } from '@/hooks/useIndexNowStats';

interface IndexNowBreakdownChartsProps {
  stats: IndexNowStats | null;
  loading: boolean;
}

const ENTITY_COLORS = ['#7A5DC7', '#FAD4E1', '#C084FC', '#22c55e', '#3b82f6', '#f59e0b'];
const ENGINE_COLORS = ['#0078D4', '#FF0000', '#4285F4', '#EA4335']; // Bing blue, Yandex red

const ENTITY_LABELS: Record<string, string> = {
  product: 'Produits',
  business: 'Boutiques',
  page: 'Pages',
  fund: 'Cagnottes',
  unknown: 'Autre',
};

export function IndexNowBreakdownCharts({ stats, loading }: IndexNowBreakdownChartsProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Par type d'entité</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Par moteur de recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const entityData = stats.byEntityType.map(item => ({
    name: ENTITY_LABELS[item.type] || item.type,
    value: item.count,
  }));

  const engineData = stats.byEngine.map(item => ({
    name: item.engine.charAt(0).toUpperCase() + item.engine.slice(1),
    value: item.count,
  }));

  const renderLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (percent < 0.05) return null;
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* By Entity Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Par type d'entité</CardTitle>
        </CardHeader>
        <CardContent>
          {entityData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={entityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {entityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ENTITY_COLORS[index % ENTITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Soumissions']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By Search Engine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Par moteur de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          {engineData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={engineData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engineData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={ENGINE_COLORS[index % ENGINE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Soumissions']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
