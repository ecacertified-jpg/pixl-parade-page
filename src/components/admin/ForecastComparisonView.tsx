import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { GitCompare, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MetricType, MLForecastAnalysis } from '@/hooks/useMLForecast';
import { ForecastResult } from '@/hooks/useForecastEngine';

interface ForecastComparisonViewProps {
  countryCode: string;
  countryName: string;
  flag: string;
  year: number;
  mlForecasts: Record<MetricType, MLForecastAnalysis | null>;
  statisticalForecasts: Record<MetricType, ForecastResult[] | null>;
}

const METRICS: MetricType[] = ['users', 'businesses', 'revenue', 'orders'];
const METRIC_LABELS: Record<MetricType, string> = {
  users: 'Utilisateurs',
  businesses: 'Commerces',
  revenue: 'Revenus',
  orders: 'Commandes'
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export function ForecastComparisonView({ 
  countryCode, 
  countryName, 
  flag, 
  year,
  mlForecasts,
  statisticalForecasts 
}: ForecastComparisonViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('users');

  const comparisonData = useMemo(() => {
    const ml = mlForecasts[selectedMetric];
    const stats = statisticalForecasts[selectedMetric];

    if (!ml && !stats) return [];

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const mlPred = ml?.predictions.find(p => p.month === month);
      const statPred = stats?.find(p => p.month === month);

      const mlValue = mlPred?.predicted;
      const statValue = statPred?.predicted;
      
      let deviation = 0;
      if (mlValue && statValue) {
        deviation = ((mlValue - statValue) / statValue) * 100;
      }

      return {
        month,
        label: MONTH_LABELS[i],
        ml: mlValue,
        statistical: statValue,
        mlLower: mlPred?.lowerBound,
        mlUpper: mlPred?.upperBound,
        statLower: statPred?.lowerBound,
        statUpper: statPred?.upperBound,
        deviation,
        mlConfidence: mlPred?.confidence,
        statConfidence: statPred?.confidence
      };
    });
  }, [mlForecasts, statisticalForecasts, selectedMetric]);

  const analysisStats = useMemo(() => {
    const validData = comparisonData.filter(d => d.ml && d.statistical);
    if (validData.length === 0) return null;

    const avgDeviation = validData.reduce((sum, d) => sum + Math.abs(d.deviation), 0) / validData.length;
    const maxDeviation = Math.max(...validData.map(d => Math.abs(d.deviation)));
    const minDeviation = Math.min(...validData.map(d => Math.abs(d.deviation)));
    
    const mlHigher = validData.filter(d => d.ml! > d.statistical!).length;
    const statHigher = validData.filter(d => d.statistical! > d.ml!).length;

    const avgMlConfidence = validData.reduce((sum, d) => {
      const conf = typeof d.mlConfidence === 'number' ? d.mlConfidence : 0;
      return sum + conf;
    }, 0) / validData.length;
    
    const avgStatConfidence = validData.reduce((sum, d) => {
      // statConfidence is 'high' | 'medium' | 'low', convert to number
      const confMap: Record<string, number> = { high: 90, medium: 70, low: 50 };
      const conf = typeof d.statConfidence === 'string' ? (confMap[d.statConfidence] || 0) : 0;
      return sum + conf;
    }, 0) / validData.length;

    return {
      avgDeviation,
      maxDeviation,
      minDeviation,
      mlHigher,
      statHigher,
      avgMlConfidence,
      avgStatConfidence,
      agreement: avgDeviation < 10 ? 'high' : avgDeviation < 25 ? 'medium' : 'low'
    };
  }, [comparisonData]);

  const formatValue = (value: number | undefined, metric: MetricType): string => {
    if (value === undefined) return '-';
    if (metric === 'revenue') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    }
    return Math.round(value).toLocaleString();
  };

  const hasBothForecasts = mlForecasts[selectedMetric] && statisticalForecasts[selectedMetric];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{flag}</span>
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                Comparaison des méthodes - {countryName}
              </CardTitle>
              <CardDescription>
                Analyse comparative ML vs Statistique pour {year}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metric Tabs */}
      <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
        <TabsList className="grid grid-cols-4 w-full">
          {METRICS.map(metric => (
            <TabsTrigger key={metric} value={metric}>
              {METRIC_LABELS[metric]}
            </TabsTrigger>
          ))}
        </TabsList>

        {METRICS.map(metric => (
          <TabsContent key={metric} value={metric} className="space-y-6 mt-6">
            {!hasBothForecasts ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Données insuffisantes</h3>
                  <p className="text-muted-foreground max-w-md">
                    Générez les prévisions ML et statistiques pour {METRIC_LABELS[metric]} 
                    afin de les comparer.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Analysis Summary */}
                {analysisStats && (
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Écart moyen</p>
                        <p className="text-2xl font-bold">
                          {analysisStats.avgDeviation.toFixed(1)}%
                        </p>
                        <Badge 
                          variant={analysisStats.agreement === 'high' ? 'default' : 
                                  analysisStats.agreement === 'medium' ? 'secondary' : 'destructive'}
                          className="mt-2"
                        >
                          {analysisStats.agreement === 'high' ? 'Fort accord' : 
                           analysisStats.agreement === 'medium' ? 'Accord modéré' : 'Divergence'}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">ML plus optimiste</p>
                        <p className="text-2xl font-bold">{analysisStats.mlHigher} mois</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          vs {analysisStats.statHigher} pour statistique
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Confiance ML</p>
                        <p className="text-2xl font-bold">{Math.round(analysisStats.avgMlConfidence)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">moyenne sur 12 mois</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Confiance Stat</p>
                        <p className="text-2xl font-bold">{Math.round(analysisStats.avgStatConfidence)}%</p>
                        <p className="text-xs text-muted-foreground mt-1">moyenne sur 12 mois</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Comparison Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Graphique comparatif</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          
                          <XAxis 
                            dataKey="label" 
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          
                          <YAxis 
                            tickFormatter={(value) => formatValue(value, metric)}
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={60}
                          />
                          
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const data = payload[0]?.payload;
                              
                              return (
                                <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                                  <p className="font-medium mb-2">{label} {year}</p>
                                  {data?.ml !== undefined && (
                                    <p className="text-violet-600">
                                      ML: <span className="font-medium">{formatValue(data.ml, metric)}</span>
                                    </p>
                                  )}
                                  {data?.statistical !== undefined && (
                                    <p className="text-primary">
                                      Stat: <span className="font-medium">{formatValue(data.statistical, metric)}</span>
                                    </p>
                                  )}
                                  {data?.deviation !== 0 && (
                                    <p className={`text-xs mt-1 ${data.deviation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      Écart: {data.deviation > 0 ? '+' : ''}{data.deviation.toFixed(1)}%
                                    </p>
                                  )}
                                </div>
                              );
                            }}
                          />
                          
                          <Legend 
                            wrapperStyle={{ paddingTop: 20 }}
                            formatter={(value) => {
                              const labels: Record<string, string> = {
                                ml: 'Prévision ML',
                                statistical: 'Prévision Statistique'
                              };
                              return labels[value] || value;
                            }}
                          />

                          <Line
                            type="monotone"
                            dataKey="statistical"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                            name="statistical"
                          />

                          <Line
                            type="monotone"
                            dataKey="ml"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                            name="ml"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Tableau comparatif détaillé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mois</TableHead>
                          <TableHead className="text-right">ML</TableHead>
                          <TableHead className="text-right">Statistique</TableHead>
                          <TableHead className="text-right">Écart</TableHead>
                          <TableHead className="text-center">Accord</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell className="font-medium">{row.label}</TableCell>
                            <TableCell className="text-right text-violet-600">
                              {formatValue(row.ml, metric)}
                            </TableCell>
                            <TableCell className="text-right text-primary">
                              {formatValue(row.statistical, metric)}
                            </TableCell>
                            <TableCell className={`text-right ${
                              Math.abs(row.deviation) < 10 ? 'text-green-600' :
                              Math.abs(row.deviation) < 25 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {row.deviation > 0 ? '+' : ''}{row.deviation.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-center">
                              {Math.abs(row.deviation) < 10 ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                              ) : Math.abs(row.deviation) < 25 ? (
                                <div className="w-4 h-4 rounded-full bg-yellow-500 mx-auto" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Analysis Text */}
                {analysisStats && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Analyse des écarts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {analysisStats.agreement === 'high' ? (
                          <>
                            Les deux méthodes sont en <strong>fort accord</strong> avec un écart moyen de seulement {analysisStats.avgDeviation.toFixed(1)}%. 
                            Cela suggère une prédiction fiable pour {METRIC_LABELS[metric].toLowerCase()}.
                          </>
                        ) : analysisStats.agreement === 'medium' ? (
                          <>
                            Les méthodes présentent un <strong>accord modéré</strong> avec un écart moyen de {analysisStats.avgDeviation.toFixed(1)}%. 
                            Le modèle ML est plus {analysisStats.mlHigher > analysisStats.statHigher ? 'optimiste' : 'conservateur'} 
                            sur {Math.max(analysisStats.mlHigher, analysisStats.statHigher)} mois.
                          </>
                        ) : (
                          <>
                            Il existe une <strong>divergence significative</strong> entre les méthodes (écart moyen: {analysisStats.avgDeviation.toFixed(1)}%). 
                            Le modèle ML détecte probablement des patterns non capturés par l'approche statistique.
                            Examinez les mois avec les plus grands écarts pour comprendre les différences.
                          </>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
