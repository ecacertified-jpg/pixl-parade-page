import { useState, useCallback } from 'react';

export type ForecastMethod = 'linear' | 'moving_average' | 'growth_rate' | 'seasonal';

export interface ForecastResult {
  month: number;
  predicted: number;
  confidence: 'high' | 'medium' | 'low';
  method: ForecastMethod;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastInput {
  historicalData: Array<{ month: string; value: number }>;
  metricType: string;
  countryCode: string;
  targetYear: number;
}

export interface ForecastMethodInfo {
  id: ForecastMethod;
  name: string;
  description: string;
  bestFor: string;
}

const FORECAST_METHODS: ForecastMethodInfo[] = [
  {
    id: 'linear',
    name: 'Régression linéaire',
    description: 'Ajuste une droite sur les données historiques',
    bestFor: 'Croissance stable et prévisible'
  },
  {
    id: 'moving_average',
    name: 'Moyenne mobile',
    description: 'Moyenne des 3 derniers mois',
    bestFor: 'Données volatiles à lisser'
  },
  {
    id: 'growth_rate',
    name: 'Taux de croissance',
    description: 'Projette le taux de croissance moyen',
    bestFor: 'Croissance exponentielle'
  },
  {
    id: 'seasonal',
    name: 'Saisonnalité',
    description: 'Détecte les patterns annuels',
    bestFor: 'Variations cycliques'
  }
];

// Linear regression calculation
function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  const sumX = data.reduce((s, _, i) => s + i, 0);
  const sumY = data.reduce((s, v) => s + v, 0);
  const sumXY = data.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
  const sumY2 = data.reduce((s, v) => s + v * v, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const ssTotal = data.reduce((s, v) => s + Math.pow(v - meanY, 2), 0);
  const ssResidual = data.reduce((s, v, i) => s + Math.pow(v - (slope * i + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope, intercept, r2 };
}

// Moving average calculation
function movingAverage(data: number[], window: number = 3): number {
  if (data.length === 0) return 0;
  const recent = data.slice(-window);
  return recent.reduce((s, v) => s + v, 0) / recent.length;
}

// Average growth rate calculation
function averageGrowthRate(data: number[]): number {
  if (data.length < 2) return 0;
  
  let totalGrowth = 0;
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] > 0) {
      totalGrowth += (data[i] - data[i - 1]) / data[i - 1];
      count++;
    }
  }
  
  return count > 0 ? totalGrowth / count : 0;
}

// Calculate variance
function calculateVariance(data: number[]): number {
  if (data.length < 2) return 0;
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  return data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (data.length - 1);
}

// Seasonal factors calculation
function calculateSeasonalFactors(data: number[]): number[] {
  if (data.length < 12) {
    return Array(12).fill(1);
  }

  const monthlyValues: number[][] = Array(12).fill(null).map(() => []);
  
  data.forEach((value, index) => {
    const monthIndex = index % 12;
    monthlyValues[monthIndex].push(value);
  });

  const overallMean = data.reduce((s, v) => s + v, 0) / data.length;
  
  return monthlyValues.map(values => {
    if (values.length === 0 || overallMean === 0) return 1;
    const monthMean = values.reduce((s, v) => s + v, 0) / values.length;
    return monthMean / overallMean;
  });
}

// Calculate confidence level
function calculateConfidence(data: number[], r2: number = 0): 'high' | 'medium' | 'low' {
  if (data.length >= 12 && r2 > 0.7) return 'high';
  if (data.length >= 6 && r2 > 0.4) return 'medium';
  return 'low';
}

// Calculate confidence interval
function calculateConfidenceInterval(predicted: number, variance: number, dataLength: number): { lower: number; upper: number } {
  // Adjust margin based on data availability
  const confidenceFactor = dataLength >= 12 ? 1.5 : dataLength >= 6 ? 2 : 2.5;
  const margin = confidenceFactor * Math.sqrt(variance);
  
  return {
    lower: Math.max(0, Math.round(predicted - margin)),
    upper: Math.round(predicted + margin)
  };
}

export function useForecastEngine() {
  const [selectedMethod, setSelectedMethod] = useState<ForecastMethod>('linear');

  const generateForecast = useCallback((
    input: ForecastInput,
    method: ForecastMethod = selectedMethod
  ): ForecastResult[] => {
    const values = input.historicalData.map(d => d.value);
    
    if (values.length === 0) {
      return Array(12).fill(null).map((_, month) => ({
        month: month + 1,
        predicted: 0,
        confidence: 'low' as const,
        method,
        lowerBound: 0,
        upperBound: 0
      }));
    }

    const variance = calculateVariance(values);
    const results: ForecastResult[] = [];

    switch (method) {
      case 'linear': {
        const { slope, intercept, r2 } = linearRegression(values);
        const confidence = calculateConfidence(values, r2);
        const startIndex = values.length;

        for (let i = 0; i < 12; i++) {
          const predicted = Math.max(0, Math.round(slope * (startIndex + i) + intercept));
          const { lower, upper } = calculateConfidenceInterval(predicted, variance, values.length);
          
          results.push({
            month: i + 1,
            predicted,
            confidence,
            method,
            lowerBound: lower,
            upperBound: upper
          });
        }
        break;
      }

      case 'moving_average': {
        const baseAvg = movingAverage(values);
        const confidence = calculateConfidence(values, 0.5);

        for (let i = 0; i < 12; i++) {
          const predicted = Math.round(baseAvg);
          const { lower, upper } = calculateConfidenceInterval(predicted, variance, values.length);
          
          results.push({
            month: i + 1,
            predicted,
            confidence,
            method,
            lowerBound: lower,
            upperBound: upper
          });
        }
        break;
      }

      case 'growth_rate': {
        const rate = averageGrowthRate(values);
        const lastValue = values[values.length - 1] || 0;
        const { r2 } = linearRegression(values);
        const confidence = calculateConfidence(values, r2);

        for (let i = 0; i < 12; i++) {
          const predicted = Math.max(0, Math.round(lastValue * Math.pow(1 + rate, i + 1)));
          const { lower, upper } = calculateConfidenceInterval(predicted, variance * (1 + i * 0.1), values.length);
          
          results.push({
            month: i + 1,
            predicted,
            confidence: i < 6 ? confidence : (confidence === 'high' ? 'medium' : 'low'),
            method,
            lowerBound: lower,
            upperBound: upper
          });
        }
        break;
      }

      case 'seasonal': {
        const seasonalFactors = calculateSeasonalFactors(values);
        const { slope, intercept, r2 } = linearRegression(values);
        const confidence = calculateConfidence(values, r2);
        const startIndex = values.length;

        for (let i = 0; i < 12; i++) {
          const basePrediction = slope * (startIndex + i) + intercept;
          const seasonalFactor = seasonalFactors[i];
          const predicted = Math.max(0, Math.round(basePrediction * seasonalFactor));
          const { lower, upper } = calculateConfidenceInterval(predicted, variance, values.length);
          
          results.push({
            month: i + 1,
            predicted,
            confidence,
            method,
            lowerBound: lower,
            upperBound: upper
          });
        }
        break;
      }
    }

    return results;
  }, [selectedMethod]);

  const getBestMethod = useCallback((data: number[]): ForecastMethod => {
    if (data.length < 3) return 'moving_average';
    
    const { r2 } = linearRegression(data);
    const growthRate = averageGrowthRate(data);
    const variance = calculateVariance(data);
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

    // High R² and stable growth → linear
    if (r2 > 0.8 && Math.abs(growthRate) < 0.1) return 'linear';
    
    // High growth rate → growth_rate method
    if (Math.abs(growthRate) > 0.1) return 'growth_rate';
    
    // High variance → moving average to smooth
    if (coefficientOfVariation > 0.3) return 'moving_average';
    
    // If we have enough data, check for seasonality
    if (data.length >= 12) return 'seasonal';
    
    return 'linear';
  }, []);

  const getConfidenceColor = useCallback((confidence: 'high' | 'medium' | 'low'): string => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
    }
  }, []);

  const getConfidenceBgColor = useCallback((confidence: 'high' | 'medium' | 'low'): string => {
    switch (confidence) {
      case 'high': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'low': return 'bg-red-100';
    }
  }, []);

  return {
    generateForecast,
    getBestMethod,
    methods: FORECAST_METHODS,
    selectedMethod,
    setSelectedMethod,
    getConfidenceColor,
    getConfidenceBgColor
  };
}
