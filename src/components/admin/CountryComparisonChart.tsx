import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CountryPerformanceData } from '@/hooks/useCountryPerformance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CountryComparisonChartProps {
  countries: CountryPerformanceData[];
  loading?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const CountryComparisonChart = ({ countries, loading }: CountryComparisonChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des marchés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartData = countries.map(c => ({
    name: `${c.flag} ${c.countryCode}`,
    fullName: c.countryName,
    users: c.totalUsers,
    businesses: c.totalBusinesses,
    revenue: c.totalRevenue,
    orders: c.totalOrders,
    conversion: c.conversionRate,
  })).sort((a, b) => b.users - a.users);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des marchés</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="businesses">Entreprises</TabsTrigger>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString('fr-FR'), 'Utilisateurs']}
                  labelFormatter={(label) => chartData.find(c => c.name === label)?.fullName || label}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="businesses">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString('fr-FR'), 'Entreprises']}
                  labelFormatter={(label) => chartData.find(c => c.name === label)?.fullName || label}
                />
                <Bar dataKey="businesses" fill="hsl(272, 76%, 75%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="revenue">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  formatter={(value: number) => [`${formatCurrency(value)} FCFA`, 'Revenus']}
                  labelFormatter={(label) => chartData.find(c => c.name === label)?.fullName || label}
                />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="conversion">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Taux de conversion']}
                  labelFormatter={(label) => chartData.find(c => c.name === label)?.fullName || label}
                />
                <Bar dataKey="conversion" fill="hsl(45, 88%, 63%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
