import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { MLForecastAnalysis } from '@/hooks/useMLForecast';

interface MLInsightsCardProps {
  forecast: MLForecastAnalysis;
}

export function MLInsightsCard({ forecast }: MLInsightsCardProps) {
  // Calculate contributing factors summary
  const factorsSummary = forecast.predictions.reduce((acc, pred) => {
    if (pred.contributingFactors) {
      Object.entries(pred.contributingFactors).forEach(([factor, weight]) => {
        acc[factor] = (acc[factor] || 0) + (weight as number);
      });
    }
    return acc;
  }, {} as Record<string, number>);

  // Normalize and sort factors
  const totalWeight = Object.values(factorsSummary).reduce((sum, w) => sum + w, 0);
  const sortedFactors = Object.entries(factorsSummary)
    .map(([factor, weight]) => ({
      factor: formatFactorName(factor),
      weight: totalWeight > 0 ? (weight / totalWeight) * 100 : 0
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Analyse ML détaillée
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Trend */}
        {forecast.overallTrend && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tendance générale</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              {forecast.overallTrend}
            </p>
          </div>
        )}

        {/* Contributing Factors */}
        {sortedFactors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Facteurs contributifs</span>
            </div>
            <div className="space-y-3">
              {sortedFactors.map(({ factor, weight }) => (
                <div key={factor} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{factor}</span>
                    <span className="font-medium">{Math.round(weight)}%</span>
                  </div>
                  <Progress value={weight} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Patterns */}
        {forecast.seasonalPatterns && forecast.seasonalPatterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Patterns saisonniers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.seasonalPatterns.map((pattern, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {forecast.anomaliesDetected && forecast.anomaliesDetected.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">⚠️ Anomalies détectées</span>
            </div>
            <div className="space-y-2">
              {forecast.anomaliesDetected.map((anomaly, i) => (
                <div key={i} className="text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                  <span className="font-medium">{anomaly.month}:</span> {anomaly.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Confidence Overview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">Confiance par mois</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
            {forecast.predictions.map((pred) => {
              const bgColor = pred.confidence >= 80 
                ? 'bg-green-500' 
                : pred.confidence >= 60 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500';
              
              return (
                <div 
                  key={pred.month} 
                  className="flex flex-col items-center"
                  title={`${getMonthName(pred.month)}: ${pred.confidence}%`}
                >
                  <div 
                    className={`w-full h-8 rounded ${bgColor} opacity-${Math.round(pred.confidence / 10) * 10}`}
                    style={{ opacity: pred.confidence / 100 }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {getMonthName(pred.month).slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>60-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>&lt;60%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatFactorName(factor: string): string {
  const labels: Record<string, string> = {
    trend: 'Tendance',
    seasonality: 'Saisonnalité',
    marketGrowth: 'Croissance marché',
    events: 'Événements',
    momentum: 'Momentum',
    external: 'Facteurs externes',
    interpolated: 'Interpolé',
    historical: 'Historique',
    cyclical: 'Cyclique',
    noise: 'Bruit'
  };
  
  return labels[factor] || factor.charAt(0).toUpperCase() + factor.slice(1);
}

function getMonthName(month: number): string {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months[month - 1] || '';
}
