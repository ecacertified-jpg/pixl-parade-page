import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { YearlyRankingData, COUNTRY_FLAGS, COUNTRY_NAMES } from '@/hooks/useCountryMonthlyComparison';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CountryRankingChartProps {
  yearlyRankings: YearlyRankingData[];
  loading?: boolean;
  year: number;
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

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

export function CountryRankingChart({ yearlyRankings, loading, year }: CountryRankingChartProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['CI', 'SN', 'BJ']);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts
  const chartData = MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const dataPoint: Record<string, any> = { month: label };
    
    yearlyRankings.forEach(country => {
      const monthRank = country.monthlyRanks.find(r => r.month === month);
      dataPoint[country.countryCode] = monthRank?.rank || null;
    });
    
    return dataPoint;
  });

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label} {year}</p>
          {payload
            .filter((p: any) => p.value !== null)
            .sort((a: any, b: any) => a.value - b.value)
            .map((p: any) => (
              <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
                  {COUNTRY_FLAGS[p.dataKey]} {COUNTRY_NAMES[p.dataKey]}
                </span>
                <span className="font-medium">#{p.value}</span>
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
            <CardTitle>Évolution des classements</CardTitle>
            <CardDescription>Position relative de chaque pays au fil des mois</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {yearlyRankings.map(country => (
              <button
                key={country.countryCode}
                onClick={() => toggleCountry(country.countryCode)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCountries.includes(country.countryCode)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {country.flag} {country.countryCode}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis 
              reversed
              domain={[1, yearlyRankings.length]}
              ticks={Array.from({ length: yearlyRankings.length }, (_, i) => i + 1)}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              label={{ value: 'Rang', angle: -90, position: 'insideLeft', className: 'fill-muted-foreground' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {yearlyRankings
              .filter(country => selectedCountries.includes(country.countryCode))
              .map(country => (
                <Line
                  key={country.countryCode}
                  type="monotone"
                  dataKey={country.countryCode}
                  stroke={COUNTRY_COLORS[country.countryCode] || 'hsl(var(--primary))'}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>↑ Rang 1 = Meilleur</span>
          <span>↓ Rang élevé = À améliorer</span>
        </div>
      </CardContent>
    </Card>
  );
}
