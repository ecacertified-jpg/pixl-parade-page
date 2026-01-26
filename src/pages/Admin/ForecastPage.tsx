import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryForecastPanel } from '@/components/admin/CountryForecastPanel';
import { MLForecastPanel } from '@/components/admin/MLForecastPanel';
import { ForecastComparisonView } from '@/components/admin/ForecastComparisonView';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useMLForecast, MetricType } from '@/hooks/useMLForecast';
import { useForecastEngine, ForecastResult } from '@/hooks/useForecastEngine';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { Brain, GitCompare, TrendingUp } from 'lucide-react';

const COUNTRIES = [
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' }
];

const YEARS = [2024, 2025, 2026, 2027];

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function ForecastPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].code);
  const [forecastMode, setForecastMode] = useState<'statistical' | 'ml' | 'comparison'>('statistical');

  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];

  // ML Forecast hook
  const { forecasts: mlForecasts } = useMLForecast();
  
  // Statistical forecast hook
  const { generateForecast, selectedMethod } = useForecastEngine();
  
  // Performance data for statistical forecasts
  const { trends: performanceData } = useCountryPerformance();

  // Generate statistical forecasts for comparison
  const statisticalForecasts = useMemo(() => {
    if (!performanceData || !performanceData[selectedCountry]) {
      return {} as Record<MetricType, ForecastResult[] | null>;
    }

    const countryTrends = performanceData[selectedCountry] || [];

    const metrics: MetricType[] = ['users', 'businesses', 'revenue', 'orders'];
    const result: Record<MetricType, ForecastResult[] | null> = {
      users: null,
      businesses: null,
      revenue: null,
      orders: null
    };

    metrics.forEach(metric => {
      const historicalData = countryTrends.map((t, index) => ({
        month: t.label || MONTH_LABELS[index % 12],
        value: t[metric] || 0
      }));
      
      if (historicalData.length >= 3) {
        result[metric] = generateForecast({
          historicalData,
          metricType: metric,
          countryCode: selectedCountry,
          targetYear: selectedYear
        }, selectedMethod);
      }
    });

    return result;
  }, [performanceData, selectedCountry, generateForecast, selectedMethod, selectedYear]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="✨ Prévisions automatiques"
          description="Suggestions d'objectifs basées sur les tendances historiques et ML"
          showCountryIndicator={false}
          actions={
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Forecast Mode Tabs */}
        <Tabs value={forecastMode} onValueChange={(v) => setForecastMode(v as typeof forecastMode)}>
          <TabsList>
            <TabsTrigger value="statistical" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistique
            </TabsTrigger>
            <TabsTrigger value="ml" className="gap-2">
              <Brain className="h-4 w-4" />
              Machine Learning
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Comparaison
            </TabsTrigger>
          </TabsList>

          {/* Statistical Tab */}
          <TabsContent value="statistical" className="mt-6">
            <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                {COUNTRIES.map(country => (
                  <TabsTrigger
                    key={country.code}
                    value={country.code}
                    className="flex items-center gap-1"
                  >
                    <span>{country.flag}</span>
                    <span className="hidden sm:inline">{country.code}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {COUNTRIES.map(country => (
                <TabsContent key={country.code} value={country.code}>
                  <CountryForecastPanel
                    countryCode={country.code}
                    countryName={country.name}
                    flag={country.flag}
                    year={selectedYear}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* ML Tab */}
          <TabsContent value="ml" className="mt-6">
            <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                {COUNTRIES.map(country => (
                  <TabsTrigger
                    key={country.code}
                    value={country.code}
                    className="flex items-center gap-1"
                  >
                    <span>{country.flag}</span>
                    <span className="hidden sm:inline">{country.code}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {COUNTRIES.map(country => (
                <TabsContent key={country.code} value={country.code}>
                  <MLForecastPanel
                    countryCode={country.code}
                    countryName={country.name}
                    flag={country.flag}
                    year={selectedYear}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-6">
            <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
              <TabsList className="flex flex-wrap h-auto gap-1">
                {COUNTRIES.map(country => (
                  <TabsTrigger
                    key={country.code}
                    value={country.code}
                    className="flex items-center gap-1"
                  >
                    <span>{country.flag}</span>
                    <span className="hidden sm:inline">{country.code}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {COUNTRIES.map(country => (
                <TabsContent key={country.code} value={country.code}>
                  <ForecastComparisonView
                    countryCode={country.code}
                    countryName={country.name}
                    flag={country.flag}
                    year={selectedYear}
                    mlForecasts={mlForecasts}
                    statisticalForecasts={statisticalForecasts}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
