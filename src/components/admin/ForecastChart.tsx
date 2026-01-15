import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForecastResult } from '@/hooks/useForecastEngine';

interface ForecastChartProps {
  historicalData: Array<{ month: string; label: string; value: number }>;
  forecastData: ForecastResult[];
  metricType: string;
  title?: string;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const METRIC_LABELS: Record<string, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus (FCFA)',
  orders: 'Commandes'
};

export function ForecastChart({
  historicalData,
  forecastData,
  metricType,
  title
}: ForecastChartProps) {
  // Combine historical and forecast data
  const chartData = [
    ...historicalData.map((d, index) => ({
      label: d.label,
      actual: d.value,
      predicted: null as number | null,
      lowerBound: null as number | null,
      upperBound: null as number | null,
      isHistorical: true,
      index
    })),
    ...forecastData.map((d, index) => ({
      label: MONTH_LABELS[d.month - 1],
      actual: null as number | null,
      predicted: d.predicted,
      lowerBound: d.lowerBound,
      upperBound: d.upperBound,
      isHistorical: false,
      index: historicalData.length + index
    }))
  ];

  // Add connection point
  if (historicalData.length > 0 && forecastData.length > 0) {
    const lastHistorical = historicalData[historicalData.length - 1];
    const firstForecast = forecastData[0];
    
    // Update the first forecast point to include the last historical value for smooth transition
    const connectionIndex = historicalData.length;
    if (chartData[connectionIndex]) {
      chartData[connectionIndex] = {
        ...chartData[connectionIndex],
        actual: lastHistorical.value
      };
    }
  }

  const formatValue = (value: number) => {
    if (metricType === 'revenue') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString('fr-FR');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title || `Prévisions - ${METRIC_LABELS[metricType] || metricType}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={formatValue}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                      <p className="font-medium mb-1">{label}</p>
                      {data?.actual !== null && (
                        <p className="text-foreground">
                          Réel: <span className="font-medium">{formatValue(data.actual)}</span>
                        </p>
                      )}
                      {data?.predicted !== null && (
                        <>
                          <p className="text-primary">
                            Prévu: <span className="font-medium">{formatValue(data.predicted)}</span>
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Intervalle: {formatValue(data.lowerBound)} - {formatValue(data.upperBound)}
                          </p>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              
              {/* Reference line for separation */}
              <ReferenceLine
                x={historicalData[historicalData.length - 1]?.label}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{
                  value: 'Prévisions →',
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 10
                }}
              />

              {/* Confidence interval area */}
              <Area
                dataKey="upperBound"
                stroke="none"
                fill="url(#confidenceGradient)"
                connectNulls={false}
              />
              <Area
                dataKey="lowerBound"
                stroke="none"
                fill="hsl(var(--background))"
                connectNulls={false}
              />

              {/* Historical data line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--foreground))', r: 3 }}
                connectNulls={false}
              />

              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-foreground" />
            <span>Données réelles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" style={{ borderStyle: 'dashed', borderWidth: '1px 0' }} />
            <span>Prévisions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-primary/20 rounded" />
            <span>Intervalle de confiance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
