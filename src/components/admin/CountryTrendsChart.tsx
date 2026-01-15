import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CountryTrend } from '@/hooks/useCountryPerformance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface CountryTrendsChartProps {
  trends: Record<string, CountryTrend[]>;
  loading?: boolean;
}

const COUNTRY_COLORS: Record<string, string> = {
  CI: '#7A5DC7',
  SN: '#22C55E',
  BJ: '#F59E0B',
  ML: '#EF4444',
  BF: '#3B82F6',
  TG: '#EC4899',
};

const COUNTRY_NAMES: Record<string, string> = {
  CI: 'Côte d\'Ivoire',
  SN: 'Sénégal',
  BJ: 'Bénin',
  ML: 'Mali',
  BF: 'Burkina Faso',
  TG: 'Togo',
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const CountryTrendsChart = ({ trends, loading }: CountryTrendsChartProps) => {
  const [metric, setMetric] = useState<'users' | 'revenue' | 'orders'>('users');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for multi-line chart
  const countryCodes = Object.keys(trends).filter(code => trends[code]?.length > 0);
  
  if (countryCodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Aucune donnée de tendance disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all unique months
  const allMonths = new Set<string>();
  countryCodes.forEach(code => {
    trends[code]?.forEach(t => allMonths.add(t.month));
  });

  const sortedMonths = Array.from(allMonths).sort();

  // Build combined data
  const chartData = sortedMonths.map(month => {
    const point: Record<string, any> = { month };
    
    countryCodes.forEach(code => {
      const trend = trends[code]?.find(t => t.month === month);
      point[`${code}_users`] = trend?.users || 0;
      point[`${code}_revenue`] = trend?.revenue || 0;
      point[`${code}_orders`] = trend?.orders || 0;
      point.label = trend?.label || month;
    });
    
    return point;
  });

  const getDataKey = (code: string) => `${code}_${metric}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Évolution mensuelle par pays</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as typeof metric)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
          </TabsList>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                interval={1}
              />
              <YAxis 
                tickFormatter={metric === 'revenue' ? formatCurrency : (v) => v.toLocaleString('fr-FR')}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const countryCode = name.split('_')[0];
                  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
                  if (metric === 'revenue') {
                    return [`${formatCurrency(value)} FCFA`, countryName];
                  }
                  return [value.toLocaleString('fr-FR'), countryName];
                }}
              />
              <Legend 
                formatter={(value: string) => {
                  const countryCode = value.split('_')[0];
                  return COUNTRY_NAMES[countryCode] || countryCode;
                }}
              />
              {countryCodes.map(code => (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={getDataKey(code)}
                  stroke={COUNTRY_COLORS[code] || '#888'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Tabs>
      </CardContent>
    </Card>
  );
};
