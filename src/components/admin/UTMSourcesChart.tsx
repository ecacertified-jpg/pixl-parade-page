import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UTMSource } from '@/hooks/useShareAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Link2 } from 'lucide-react';

interface UTMSourcesChartProps {
  data: UTMSource[];
  loading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1'
];

const sourceLabels: Record<string, string> = {
  direct: 'Direct',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  twitter: 'Twitter/X',
  google: 'Google',
  email: 'Email',
  sms: 'SMS',
  referral: 'Référent'
};

export function UTMSourcesChart({ data, loading }: UTMSourcesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: sourceLabels[item.source] || item.source,
    value: item.clicks,
    conversions: item.conversions
  }));

  const totalClicks = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = totalClicks > 0 ? (item.value / totalClicks) * 100 : 0;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-1">{item.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">Clics: {item.value} ({percentage.toFixed(1)}%)</p>
            <p className="text-green-600">Conversions: {item.conversions}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ name, percent }: any) => {
    if (percent > 0.05) {
      return `${(percent * 100).toFixed(0)}%`;
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Sources de Trafic (UTM)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Aucune donnée UTM disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
