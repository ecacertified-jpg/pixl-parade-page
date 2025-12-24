import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Treemap } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BarChart3, Grid3X3 } from 'lucide-react';
import type { ProductCategoryStat } from '@/hooks/useBusinessDetailedStats';

interface ProductCategoryChartProps {
  data: ProductCategoryStat[];
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

type ViewMode = 'bar' | 'treemap';

export function ProductCategoryChart({ data, loading }: ProductCategoryChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = data.reduce((acc, item, index) => ({
    ...acc,
    [item.category]: {
      label: item.category,
      color: COLORS[index % COLORS.length]
    }
  }), {});

  const barData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));

  const treemapData = data.map((item, index) => ({
    name: item.category,
    size: item.productCount,
    fill: COLORS[index % COLORS.length],
    ...item
  }));

  const formatPrice = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const totalProducts = data.reduce((sum, d) => sum + d.productCount, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);

  const CustomTreemapContent = ({ x, y, width, height, name, productCount, fill }: any) => {
    if (width < 40 || height < 30) return null;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="white"
          strokeWidth={2}
          rx={4}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 6}
              textAnchor="middle"
              fill="white"
              fontSize={11}
              fontWeight="bold"
            >
              {name?.length > 12 ? name.slice(0, 10) + '...' : name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="white"
              fontSize={10}
            >
              {productCount} produits
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          📦 Produits par Catégorie
        </CardTitle>
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
          <ToggleGroupItem value="bar" aria-label="Vue barres">
            <BarChart3 className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="treemap" aria-label="Vue treemap">
            <Grid3X3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs text-muted-foreground">Total produits</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-xs text-muted-foreground">Catégories</p>
          </div>
        </div>

        <div className="h-64">
          <ChartContainer config={chartConfig} className="h-full w-full">
            {viewMode === 'bar' ? (
              <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  width={120} 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => value.length > 15 ? value.slice(0, 13) + '...' : value}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.category}</p>
                          <p className="text-sm">
                            {data.productCount} produits
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Prix moyen: {formatPrice(data.avgPrice)} XOF
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Revenus: {formatPrice(data.totalRevenue)} XOF
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="productCount" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomTreemapContent />}
              />
            )}
          </ChartContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {data.slice(0, 6).map((item, index) => (
            <div key={item.category} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate max-w-[120px]">{item.category}</span>
              <span className="text-muted-foreground">({item.productCount})</span>
            </div>
          ))}
          {data.length > 6 && (
            <span className="text-sm text-muted-foreground">+{data.length - 6} autres</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
