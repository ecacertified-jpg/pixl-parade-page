import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DeviceBreakdown } from '@/hooks/useShareAnalytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Smartphone, Tablet, Monitor, HelpCircle } from 'lucide-react';

interface DeviceBreakdownChartProps {
  data: DeviceBreakdown[];
  loading: boolean;
}

const COLORS = {
  mobile: '#22C55E',
  tablet: '#3B82F6',
  desktop: '#8B5CF6',
  unknown: '#9CA3AF'
};

const deviceLabels: Record<string, string> = {
  mobile: 'Mobile',
  tablet: 'Tablette',
  desktop: 'Ordinateur',
  unknown: 'Autre'
};

const deviceIcons: Record<string, any> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: HelpCircle
};

export function DeviceBreakdownChart({ data, loading }: DeviceBreakdownChartProps) {
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
    name: deviceLabels[item.device] || item.device,
    device: item.device,
    value: item.clicks,
    conversions: item.conversions,
    color: COLORS[item.device as keyof typeof COLORS] || COLORS.unknown
  }));

  const totalClicks = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = totalClicks > 0 ? (item.value / totalClicks) * 100 : 0;
      const convRate = item.value > 0 ? (item.conversions / item.value) * 100 : 0;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-1">{item.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">Clics: {item.value} ({percentage.toFixed(1)}%)</p>
            <p className="text-green-600">Conversions: {item.conversions}</p>
            <p className="text-muted-foreground">Taux: {convRate.toFixed(1)}%</p>
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
          <Smartphone className="h-5 w-5 text-primary" />
          Répartition par Appareil
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Aucune donnée d'appareil disponible
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={250}>
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
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom legend with icons */}
            <div className="flex-1 space-y-3">
              {chartData.map((item) => {
                const Icon = deviceIcons[item.device] || deviceIcons.unknown;
                const percentage = totalClicks > 0 ? (item.value / totalClicks) * 100 : 0;
                
                return (
                  <div key={item.device} className="flex items-center gap-2">
                    <div 
                      className="p-1.5 rounded"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <Icon 
                        className="h-4 w-4" 
                        style={{ color: item.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.value} clics ({percentage.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
