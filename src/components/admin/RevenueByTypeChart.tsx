import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { RevenueByType } from '@/hooks/useBusinessDetailedStats';
import { ExportButton } from './ExportButton';
import { exportToCSV, formatNumberFr, type ExportColumn } from '@/utils/exportUtils';

interface RevenueByTypeChartProps {
  data: RevenueByType[];
  loading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(142 76% 36%)',
  'hsl(45 88% 63%)',
  'hsl(345 100% 65%)'
];

export function RevenueByTypeChart({ data, loading }: RevenueByTypeChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-64 w-full rounded-full mx-auto max-w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = data.reduce((acc, item, index) => ({
    ...acc,
    [item.type]: {
      label: item.type,
      color: COLORS[index % COLORS.length]
    }
  }), {});

  const pieData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));

  const barData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));

  const formatRevenue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const handleExportCSV = () => {
    const columns: ExportColumn<RevenueByType>[] = [
      { key: 'type', header: 'Type de Business' },
      { key: 'revenue', header: 'Revenus (XOF)', format: (v) => formatNumberFr(v) },
      { key: 'orders', header: 'Commandes' },
      { key: 'businessCount', header: 'Nombre de Business' },
      { key: 'percentage', header: 'Pourcentage (%)', format: (v) => v.toFixed(1) },
    ];
    exportToCSV(data, columns, 'revenus_par_type');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            📊 Revenus par Type
          </CardTitle>
          <ExportButton onExportCSV={handleExportCSV} disabled={data.length === 0} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart */}
          <div className="h-48 sm:h-64">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="revenue"
                  nameKey="type"
                  label={({ percentage }) => `${percentage.toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.type}</p>
                          <p className="text-sm text-muted-foreground">
                            Revenus: {formatRevenue(data.revenue)} XOF
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Commandes: {data.orders}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Business: {data.businessCount}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>
          </div>

          {/* Bar Chart */}
          <div className="h-48 sm:h-64">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tickFormatter={formatRevenue} tick={{ fontSize: 11 }} />
                <YAxis 
                  type="category" 
                  dataKey="type" 
                  width={70} 
                  tick={{ fontSize: 10 }} 
                  tickFormatter={(value) => value.length > 10 ? value.slice(0, 8) + '...' : value}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.type}</p>
                          <p className="text-sm">
                            {formatRevenue(data.revenue)} XOF ({data.percentage.toFixed(1)}%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data.orders} commandes • {data.businessCount} business
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {data.map((item, index) => (
            <div key={item.type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">
                {item.type}: {item.businessCount} ({item.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
