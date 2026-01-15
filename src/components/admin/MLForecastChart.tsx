import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { MetricType, MLPrediction } from '@/hooks/useMLForecast';

interface MLForecastChartProps {
  historicalData: { month: string; year: number; monthNum: number; value: number }[];
  predictions: MLPrediction[];
  metricType: MetricType;
  title?: string;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const METRIC_CONFIG: Record<MetricType, { label: string; format: (v: number) => string }> = {
  users: { 
    label: 'Utilisateurs', 
    format: (v) => v.toLocaleString() 
  },
  businesses: { 
    label: 'Commerces', 
    format: (v) => v.toLocaleString() 
  },
  revenue: { 
    label: 'Revenus', 
    format: (v) => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
      return v.toLocaleString();
    }
  },
  orders: { 
    label: 'Commandes', 
    format: (v) => v.toLocaleString() 
  }
};

export function MLForecastChart({ historicalData, predictions, metricType, title }: MLForecastChartProps) {
  const config = METRIC_CONFIG[metricType];
  
  const chartData = useMemo(() => {
    const data: any[] = [];
    
    // Get last 12 months of historical data
    const recentHistory = historicalData.slice(-12);
    
    // Add historical data points
    recentHistory.forEach((point, index) => {
      data.push({
        label: `${point.month} ${point.year}`,
        month: point.monthNum,
        year: point.year,
        actual: point.value,
        isHistorical: true,
        index
      });
    });

    // Mark the transition point
    const transitionIndex = data.length;

    // Add prediction data points
    predictions.forEach((pred, index) => {
      const predYear = historicalData[0]?.year ? 
        (pred.month <= (recentHistory[recentHistory.length - 1]?.monthNum || 0) ? 
          (recentHistory[recentHistory.length - 1]?.year || 2026) + 1 : 
          recentHistory[recentHistory.length - 1]?.year || 2026) : 
        2026;
      
      data.push({
        label: `${MONTH_LABELS[pred.month - 1]} ${predYear}`,
        month: pred.month,
        year: predYear,
        predicted: pred.predicted,
        lowerBound: pred.lowerBound,
        upperBound: pred.upperBound,
        confidence: pred.confidence,
        trendDirection: pred.trendDirection,
        confidenceRange: [pred.lowerBound, pred.upperBound],
        isHistorical: false,
        index: transitionIndex + index
      });
    });

    return data;
  }, [historicalData, predictions]);

  const transitionLabel = useMemo(() => {
    const lastHistorical = chartData.find(d => d.isHistorical && !chartData[chartData.indexOf(d) + 1]?.isHistorical);
    return lastHistorical?.label || '';
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0]?.payload;
    
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        {data?.actual !== undefined && (
          <p className="text-primary">
            Réel: <span className="font-medium">{config.format(data.actual)}</span>
          </p>
        )}
        {data?.predicted !== undefined && (
          <>
            <p className="text-violet-600">
              Prédit: <span className="font-medium">{config.format(data.predicted)}</span>
            </p>
            <p className="text-muted-foreground text-xs">
              Intervalle: {config.format(data.lowerBound)} - {config.format(data.upperBound)}
            </p>
            <p className="text-muted-foreground text-xs">
              Confiance: {data.confidence}%
              {data.trendDirection === 'up' && ' 📈'}
              {data.trendDirection === 'down' && ' 📉'}
              {data.trendDirection === 'stable' && ' ➡️'}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {title || `Prévisions ${config.label}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                tickFormatter={(value) => config.format(value)}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    actual: 'Données réelles',
                    predicted: 'Prédiction ML',
                    confidenceRange: 'Intervalle de confiance'
                  };
                  return labels[value] || value;
                }}
              />

              {/* Transition line */}
              {transitionLabel && (
                <ReferenceLine 
                  x={transitionLabel} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: '← Historique | Prévisions →', 
                    position: 'top',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
              )}

              {/* Confidence interval area */}
              <Area
                type="monotone"
                dataKey="confidenceRange"
                fill="url(#predictionGradient)"
                stroke="none"
                name="confidenceRange"
              />

              {/* Historical line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="actual"
                connectNulls={false}
              />

              {/* Prediction line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload?.predicted) return null;
                  
                  const color = payload.trendDirection === 'up' ? '#22c55e' : 
                               payload.trendDirection === 'down' ? '#ef4444' : '#eab308';
                  
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={5} 
                      fill={color} 
                      stroke="white" 
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: 'white' }}
                name="predicted"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend explanation */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Tendance haussière</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Tendance stable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Tendance baissière</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
