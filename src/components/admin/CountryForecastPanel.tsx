import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { useCountryObjectives } from '@/hooks/useCountryObjectives';
import { useForecastEngine, ForecastMethod, ForecastResult } from '@/hooks/useForecastEngine';
import { ForecastMethodSelector } from './ForecastMethodSelector';
import { ForecastSuggestionCard } from './ForecastSuggestionCard';
import { ForecastChart } from './ForecastChart';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CountryForecastPanelProps {
  countryCode: string;
  countryName: string;
  flag: string;
  year: number;
}

const METRICS = ['users', 'businesses', 'revenue', 'orders'] as const;
type MetricType = typeof METRICS[number];

const METRIC_LABELS: Record<MetricType, string> = {
  users: 'Utilisateurs',
  businesses: 'Entreprises',
  revenue: 'Revenus',
  orders: 'Commandes'
};

export function CountryForecastPanel({
  countryCode,
  countryName,
  flag,
  year
}: CountryForecastPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('users');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedMetrics, setAppliedMetrics] = useState<Set<string>>(new Set());

  const { trends, loading: performanceLoading } = useCountryPerformance();
  const { bulkSetObjectives } = useCountryObjectives(year, countryCode);
  const { 
    generateForecast, 
    getBestMethod, 
    methods, 
    selectedMethod, 
    setSelectedMethod 
  } = useForecastEngine();

  // Get historical data for the country
  const countryTrends = useMemo(() => {
    return trends.filter(t => t.countryCode === countryCode);
  }, [trends, countryCode]);

  // Prepare historical data for each metric
  const getHistoricalData = useCallback((metric: MetricType) => {
    return countryTrends.map(t => ({
      month: t.month,
      label: t.month.slice(0, 3),
      value: metric === 'users' ? t.users :
             metric === 'businesses' ? t.businesses :
             metric === 'revenue' ? t.revenue :
             t.orders
    }));
  }, [countryTrends]);

  // Generate forecasts for all metrics
  const forecasts = useMemo(() => {
    const result: Record<MetricType, ForecastResult[]> = {} as any;
    
    METRICS.forEach(metric => {
      const historicalData = getHistoricalData(metric);
      result[metric] = generateForecast({
        historicalData,
        metricType: metric,
        countryCode,
        targetYear: year
      }, selectedMethod);
    });
    
    return result;
  }, [countryTrends, selectedMethod, countryCode, year, generateForecast, getHistoricalData]);

  // Get recommended method based on data
  const recommendedMethod = useMemo(() => {
    const historicalData = getHistoricalData('users');
    const values = historicalData.map(d => d.value);
    return getBestMethod(values);
  }, [getHistoricalData, getBestMethod]);

  const handleApplyForecasts = async (metric: MetricType, selectedMonths: number[], forecastResults: ForecastResult[]) => {
    setIsApplying(true);
    
    try {
      const objectives = forecastResults
        .filter(f => selectedMonths.includes(f.month))
        .map(f => ({
          year,
          month: f.month,
          metricType: metric,
          targetValue: f.predicted,
          countryCode
        }));

      await bulkSetObjectives(objectives);
      
      setAppliedMetrics(prev => new Set([...prev, metric]));
      toast.success(`Objectifs ${METRIC_LABELS[metric]} appliqués pour ${selectedMonths.length} mois`);
    } catch (error) {
      console.error('Error applying forecasts:', error);
      toast.error('Erreur lors de l\'application des prévisions');
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyAll = async () => {
    setIsApplying(true);
    
    try {
      const allObjectives = METRICS.flatMap(metric => 
        forecasts[metric].map(f => ({
          year,
          month: f.month,
          metricType: metric,
          targetValue: f.predicted,
          countryCode
        }))
      );

      await bulkSetObjectives(allObjectives);
      
      setAppliedMetrics(new Set(METRICS));
      toast.success('Tous les objectifs ont été appliqués');
    } catch (error) {
      console.error('Error applying all forecasts:', error);
      toast.error('Erreur lors de l\'application des prévisions');
    } finally {
      setIsApplying(false);
    }
  };

  if (performanceLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const historicalData = getHistoricalData(selectedMetric);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Prévisions automatiques - {flag} {countryName}
              </CardTitle>
              <CardDescription>
                Basées sur les tendances des {countryTrends.length} derniers mois
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedMethod}
                onValueChange={(v) => setSelectedMethod(v as ForecastMethod)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.id === recommendedMethod && ' ⭐'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleApplyAll} 
                disabled={isApplying}
                className="gap-2"
              >
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Tout appliquer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ForecastMethodSelector
            methods={methods}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            recommendedMethod={recommendedMethod}
          />
        </CardContent>
      </Card>

      <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
        <TabsList className="grid w-full grid-cols-4">
          {METRICS.map(metric => (
            <TabsTrigger key={metric} value={metric} className="relative">
              {METRIC_LABELS[metric]}
              {appliedMetrics.has(metric) && (
                <CheckCircle2 className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {METRICS.map(metric => (
          <TabsContent key={metric} value={metric} className="space-y-4">
            <ForecastChart
              historicalData={historicalData}
              forecastData={forecasts[metric]}
              metricType={metric}
            />
            
            <ForecastSuggestionCard
              metricType={metric}
              forecasts={forecasts[metric]}
              onApply={(months, results) => handleApplyForecasts(metric, months, results)}
              isApplying={isApplying}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
