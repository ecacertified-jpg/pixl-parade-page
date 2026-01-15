import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, RefreshCw, AlertTriangle, Lightbulb, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { useMLForecast, MetricType, MLForecastAnalysis } from '@/hooks/useMLForecast';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { useCountryObjectives } from '@/hooks/useCountryObjectives';
import { MLForecastChart } from './MLForecastChart';
import { MLInsightsCard } from './MLInsightsCard';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MLForecastPanelProps {
  countryCode: string;
  countryName: string;
  flag: string;
  year: number;
}

const METRICS: MetricType[] = ['users', 'businesses', 'revenue', 'orders'];
const METRIC_LABELS: Record<MetricType, string> = {
  users: 'Utilisateurs',
  businesses: 'Commerces',
  revenue: 'Revenus',
  orders: 'Commandes'
};

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export function MLForecastPanel({ countryCode, countryName, flag, year }: MLForecastPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('users');
  
  const { 
    forecasts, 
    isGenerating, 
    generatingMetric,
    progress, 
    error,
    generateAllForecasts,
    getConfidenceColor,
    getConfidenceBadge
  } = useMLForecast();
  
  const { data: performanceData, isLoading: isLoadingPerformance } = useCountryPerformance();
  const { objectives } = useCountryObjectives(countryCode, year);

  // Prepare historical data from performance data
  const historicalDataByMetric = useMemo(() => {
    if (!performanceData?.trends) return {} as Record<MetricType, any[]>;

    const countryTrends = performanceData.trends
      .filter(t => t.country_code === countryCode)
      .sort((a, b) => {
        const dateA = new Date(a.period_year, a.period_month - 1);
        const dateB = new Date(b.period_year, b.period_month - 1);
        return dateA.getTime() - dateB.getTime();
      });

    const result: Record<MetricType, any[]> = {
      users: [],
      businesses: [],
      revenue: [],
      orders: []
    };

    countryTrends.forEach(trend => {
      const monthData = {
        month: MONTH_LABELS[trend.period_month - 1],
        year: trend.period_year,
        monthNum: trend.period_month
      };

      result.users.push({ ...monthData, value: trend.new_users || 0 });
      result.businesses.push({ ...monthData, value: trend.new_businesses || 0 });
      result.revenue.push({ ...monthData, value: trend.total_revenue || 0 });
      result.orders.push({ ...monthData, value: trend.total_orders || 0 });
    });

    return result;
  }, [performanceData, countryCode]);

  // Prepare objectives context
  const objectivesContext = useMemo(() => {
    if (!objectives) return undefined;

    const result: Record<MetricType, { month: number; target: number }[]> = {
      users: [],
      businesses: [],
      revenue: [],
      orders: []
    };

    objectives.forEach(obj => {
      if (obj.metric_type in result) {
        result[obj.metric_type as MetricType].push({
          month: obj.month,
          target: obj.target_value
        });
      }
    });

    return result;
  }, [objectives]);

  const handleGenerateAll = () => {
    generateAllForecasts(
      countryCode,
      countryName,
      year,
      historicalDataByMetric,
      { objectives: objectivesContext }
    );
  };

  const currentForecast = forecasts[selectedMetric];
  const hasAnyForecast = Object.values(forecasts).some(f => f !== null);

  if (isLoadingPerformance) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{flag}</span>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Prévisions ML - {countryName}
                </CardTitle>
                <CardDescription>
                  Analyse intelligente des tendances pour {year}
                </CardDescription>
              </div>
            </div>
            
            <Button 
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {hasAnyForecast ? 'Régénérer' : 'Générer les prévisions'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {isGenerating && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Analyse de: {generatingMetric ? METRIC_LABELS[generatingMetric] : '...'}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        )}

        {error && (
          <CardContent>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* No forecast state */}
      {!hasAnyForecast && !isGenerating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune prévision ML générée</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Cliquez sur "Générer les prévisions" pour lancer l'analyse ML des tendances 
              historiques et obtenir des prédictions intelligentes.
            </p>
            <Button onClick={handleGenerateAll} className="gap-2">
              <Brain className="h-4 w-4" />
              Générer les prévisions ML
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Forecast results */}
      {hasAnyForecast && (
        <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
          <TabsList className="grid grid-cols-4 w-full">
            {METRICS.map(metric => {
              const forecast = forecasts[metric];
              return (
                <TabsTrigger 
                  key={metric} 
                  value={metric}
                  className="flex items-center gap-2"
                >
                  {METRIC_LABELS[metric]}
                  {forecast && (
                    <Badge 
                      variant={getConfidenceBadge(forecast.modelConfidence).variant}
                      className="text-xs ml-1"
                    >
                      {Math.round(forecast.modelConfidence)}%
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {METRICS.map(metric => (
            <TabsContent key={metric} value={metric} className="space-y-6 mt-6">
              {forecasts[metric] ? (
                <MLForecastContent 
                  forecast={forecasts[metric]!}
                  metric={metric}
                  historicalData={historicalDataByMetric[metric] || []}
                  getConfidenceColor={getConfidenceColor}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                    Prévision non générée pour {METRIC_LABELS[metric]}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

interface MLForecastContentProps {
  forecast: MLForecastAnalysis;
  metric: MetricType;
  historicalData: { month: string; year: number; monthNum: number; value: number }[];
  getConfidenceColor: (confidence: number) => string;
}

function MLForecastContent({ forecast, metric, historicalData, getConfidenceColor }: MLForecastContentProps) {
  const overallTrendIcon = useMemo(() => {
    const avgPredicted = forecast.predictions.reduce((sum, p) => sum + p.predicted, 0) / forecast.predictions.length;
    const lastHistorical = historicalData[historicalData.length - 1]?.value || avgPredicted;
    
    if (avgPredicted > lastHistorical * 1.1) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (avgPredicted < lastHistorical * 0.9) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-yellow-600" />;
  }, [forecast, historicalData]);

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Confidence Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confiance du modèle</p>
                <p className={`text-3xl font-bold ${getConfidenceColor(forecast.modelConfidence)}`}>
                  {Math.round(forecast.modelConfidence)}%
                </p>
              </div>
              <Brain className="h-10 w-10 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Trend Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tendance générale</p>
                <div className="flex items-center gap-2 mt-1">
                  {overallTrendIcon}
                  <span className="text-sm font-medium line-clamp-2">
                    {forecast.overallTrend || 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Update Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière génération</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(new Date(forecast.generatedAt), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>
                {forecast.fromCache && (
                  <Badge variant="outline" className="mt-1 text-xs">Cache</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <MLForecastChart 
        historicalData={historicalData}
        predictions={forecast.predictions}
        metricType={metric}
      />

      {/* Insights */}
      <MLInsightsCard forecast={forecast} />

      {/* Risks & Opportunities */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Risks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Risques identifiés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecast.riskFactors.length > 0 ? (
              <ul className="space-y-2">
                {forecast.riskFactors.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun risque majeur identifié</p>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-500" />
              Opportunités
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecast.opportunities.length > 0 ? (
              <ul className="space-y-2">
                {forecast.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Analyse des opportunités en cours</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
