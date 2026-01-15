import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MetricType = 'users' | 'businesses' | 'revenue' | 'orders';

export interface MLPrediction {
  month: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  trendDirection: 'up' | 'down' | 'stable';
  contributingFactors: Record<string, number>;
}

export interface MLForecastAnalysis {
  predictions: MLPrediction[];
  riskFactors: string[];
  opportunities: string[];
  overallTrend: string;
  seasonalPatterns: string[];
  anomaliesDetected: { month: string; description: string }[];
  modelConfidence: number;
  generatedAt: string;
  expiresAt: string;
  fromCache?: boolean;
}

interface HistoricalDataPoint {
  month: string;
  year: number;
  monthNum: number;
  value: number;
}

interface GenerateForecastParams {
  countryCode: string;
  countryName: string;
  metricType: MetricType;
  year: number;
  historicalData: HistoricalDataPoint[];
  context?: {
    objectives?: { month: number; target: number }[];
    correlations?: Record<string, number>;
    events?: string[];
  };
}

export function useMLForecast() {
  const [forecasts, setForecasts] = useState<Record<MetricType, MLForecastAnalysis | null>>({
    users: null,
    businesses: null,
    revenue: null,
    orders: null
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMetric, setGeneratingMetric] = useState<MetricType | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateForecast = useCallback(async (params: GenerateForecastParams): Promise<MLForecastAnalysis | null> => {
    setError(null);
    setGeneratingMetric(params.metricType);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ml-country-forecast', {
        body: params
      });

      if (fnError) {
        console.error('ML Forecast function error:', fnError);
        throw new Error(fnError.message || 'Erreur lors de la génération');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const analysis: MLForecastAnalysis = data;

      setForecasts(prev => ({
        ...prev,
        [params.metricType]: analysis
      }));

      return analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('ML Forecast error:', err);
      return null;
    } finally {
      setGeneratingMetric(null);
    }
  }, []);

  const generateAllForecasts = useCallback(async (
    countryCode: string,
    countryName: string,
    year: number,
    historicalDataByMetric: Record<MetricType, HistoricalDataPoint[]>,
    context?: {
      objectives?: Record<MetricType, { month: number; target: number }[]>;
      events?: string[];
    }
  ) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    const metrics: MetricType[] = ['users', 'businesses', 'revenue', 'orders'];
    let completed = 0;

    try {
      for (const metric of metrics) {
        const result = await generateForecast({
          countryCode,
          countryName,
          metricType: metric,
          year,
          historicalData: historicalDataByMetric[metric] || [],
          context: {
            objectives: context?.objectives?.[metric],
            events: context?.events
          }
        });

        completed++;
        setProgress((completed / metrics.length) * 100);

        if (!result) {
          toast.error(`Erreur pour ${metric}`);
        }

        // Small delay to avoid rate limiting
        if (completed < metrics.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast.success('Prévisions ML générées avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }, [generateForecast]);

  const clearForecasts = useCallback(() => {
    setForecasts({
      users: null,
      businesses: null,
      revenue: null,
      orders: null
    });
    setError(null);
    setProgress(0);
  }, []);

  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getConfidenceBadge = useCallback((confidence: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (confidence >= 80) return { label: 'Haute', variant: 'default' };
    if (confidence >= 60) return { label: 'Moyenne', variant: 'secondary' };
    return { label: 'Faible', variant: 'destructive' };
  }, []);

  const getTrendIcon = useCallback((direction: 'up' | 'down' | 'stable'): string => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  }, []);

  return {
    forecasts,
    isGenerating,
    generatingMetric,
    progress,
    error,
    generateForecast,
    generateAllForecasts,
    clearForecasts,
    getConfidenceColor,
    getConfidenceBadge,
    getTrendIcon
  };
}
