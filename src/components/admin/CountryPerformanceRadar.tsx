import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MonthlyCountryComparison, COUNTRY_FLAGS, COUNTRY_NAMES } from '@/hooks/useCountryMonthlyComparison';
import { cn } from '@/lib/utils';

interface CountryPerformanceRadarProps {
  currentMonth: MonthlyCountryComparison | null;
  loading?: boolean;
}

const COUNTRY_COLORS: Record<string, string> = {
  CI: 'hsl(142, 76%, 36%)',
  SN: 'hsl(221, 83%, 53%)',
  BJ: 'hsl(25, 95%, 53%)',
  ML: 'hsl(0, 84%, 60%)',
  BF: 'hsl(262, 83%, 58%)',
  TG: 'hsl(173, 80%, 40%)',
  GN: 'hsl(47, 95%, 53%)',
  NE: 'hsl(328, 85%, 46%)',
  CM: 'hsl(199, 89%, 48%)',
  GA: 'hsl(280, 65%, 60%)',
};

const METRICS = [
  { key: 'usersNorm', label: 'Utilisateurs' },
  { key: 'businessesNorm', label: 'Entreprises' },
  { key: 'revenueNorm', label: 'Revenus' },
  { key: 'ordersNorm', label: 'Commandes' },
  { key: 'achievementNorm', label: 'Objectifs' },
  { key: 'growthNorm', label: 'Croissance' },
];

export function CountryPerformanceRadar({ currentMonth, loading }: CountryPerformanceRadarProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['CI', 'SN', 'BJ']);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!currentMonth) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune donnée disponible
        </CardContent>
      </Card>
    );
  }

  // Normalize values to 0-100 scale based on max in dataset
  const maxUsers = Math.max(...currentMonth.countries.map(c => c.users), 1);
  const maxBusinesses = Math.max(...currentMonth.countries.map(c => c.businesses), 1);
  const maxRevenue = Math.max(...currentMonth.countries.map(c => c.revenue), 1);
  const maxOrders = Math.max(...currentMonth.countries.map(c => c.orders), 1);

  // Prepare radar data
  const radarData = METRICS.map(metric => {
    const dataPoint: Record<string, any> = { metric: metric.label };
    
    currentMonth.countries.forEach(country => {
      let value = 0;
      
      switch (metric.key) {
        case 'usersNorm':
          value = (country.users / maxUsers) * 100;
          break;
        case 'businessesNorm':
          value = (country.businesses / maxBusinesses) * 100;
          break;
        case 'revenueNorm':
          value = (country.revenue / maxRevenue) * 100;
          break;
        case 'ordersNorm':
          value = (country.orders / maxOrders) * 100;
          break;
        case 'achievementNorm':
          // Average of all achievements, capped at 100
          const achievements = [
            country.usersAchievement,
            country.businessesAchievement,
            country.revenueAchievement,
            country.ordersAchievement,
          ].filter((a): a is number => a !== null);
          value = achievements.length > 0
            ? Math.min(100, achievements.reduce((a, b) => a + b, 0) / achievements.length)
            : 50;
          break;
        case 'growthNorm':
          // Average growth, normalized to 0-100 where 50 = 0%, 100 = +50%, 0 = -50%
          const growths = [
            country.usersVariationM1,
            country.businessesVariationM1,
            country.revenueVariationM1,
            country.ordersVariationM1,
          ].filter((g): g is number => g !== null);
          const avgGrowth = growths.length > 0
            ? growths.reduce((a, b) => a + b, 0) / growths.length
            : 0;
          value = Math.min(100, Math.max(0, 50 + avgGrowth));
          break;
      }
      
      dataPoint[country.countryCode] = Math.round(value);
    });
    
    return dataPoint;
  });

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : prev.length < 5 ? [...prev, code] : prev
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{payload[0]?.payload?.metric}</p>
          {payload
            .filter((p: any) => selectedCountries.includes(p.dataKey))
            .sort((a: any, b: any) => b.value - a.value)
            .map((p: any) => (
              <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
                  {COUNTRY_FLAGS[p.dataKey]} {COUNTRY_NAMES[p.dataKey]}
                </span>
                <span className="font-medium">{p.value}%</span>
              </div>
            ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Comparaison radar</CardTitle>
            <CardDescription>Performance normalisée sur toutes les métriques</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentMonth.countries.map(country => (
              <button
                key={country.countryCode}
                onClick={() => toggleCountry(country.countryCode)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                  selectedCountries.includes(country.countryCode)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {country.flag} {country.countryCode}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Sélectionnez jusqu'à 5 pays pour comparer
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            {currentMonth.countries
              .filter(country => selectedCountries.includes(country.countryCode))
              .map((country, index) => (
                <Radar
                  key={country.countryCode}
                  name={`${country.flag} ${country.countryName}`}
                  dataKey={country.countryCode}
                  stroke={COUNTRY_COLORS[country.countryCode] || 'hsl(var(--primary))'}
                  fill={COUNTRY_COLORS[country.countryCode] || 'hsl(var(--primary))'}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>Valeurs normalisées 0-100</span>
          <span>•</span>
          <span>100 = Meilleure performance</span>
        </div>
      </CardContent>
    </Card>
  );
}
