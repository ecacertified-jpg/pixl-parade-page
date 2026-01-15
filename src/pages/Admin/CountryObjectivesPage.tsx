import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryObjectivesEditor } from '@/components/admin/CountryObjectivesEditor';
import { CountryObjectivesSummary } from '@/components/admin/CountryObjectivesSummary';
import { ObjectiveAchievementChart } from '@/components/admin/ObjectiveAchievementChart';
import { useCountryObjectives } from '@/hooks/useCountryObjectives';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { Target, BarChart3, Calendar } from 'lucide-react';

const COUNTRIES = [
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' }
];

const YEARS = [2024, 2025, 2026, 2027];

export default function CountryObjectivesPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCountry, setSelectedCountry] = useState('CI');
  const [viewMode, setViewMode] = useState<'editor' | 'summary'>('editor');

  // Fetch objectives for all countries for current year
  const { objectives: allObjectives } = useCountryObjectives(selectedYear);
  
  // Fetch performance data
  const { countries: performanceData, loading: performanceLoading } = useCountryPerformance();

  // Get objectives for selected country
  const { objectives: countryObjectives, getObjectiveValue } = useCountryObjectives(selectedYear, selectedCountry);

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);

  // Prepare data for summary cards
  const getSummaryMetrics = (countryCode: string) => {
    const perfData = performanceData.find(p => p.countryCode === countryCode);
    
    return {
      users: {
        actual: perfData?.totalUsers || 0,
        target: getObjectiveValue(countryCode, currentMonth, 'users') || 0
      },
      businesses: {
        actual: perfData?.totalBusinesses || 0,
        target: getObjectiveValue(countryCode, currentMonth, 'businesses') || 0
      },
      revenue: {
        actual: perfData?.totalRevenue || 0,
        target: getObjectiveValue(countryCode, currentMonth, 'revenue') || 0
      },
      orders: {
        actual: perfData?.totalOrders || 0,
        target: getObjectiveValue(countryCode, currentMonth, 'orders') || 0
      }
    };
  };

  // Prepare chart data
  const getChartData = (metricType: 'users' | 'businesses' | 'revenue' | 'orders') => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const perfData = performanceData.find(p => p.countryCode === selectedCountry);
    
    return months.map(month => {
      const objective = countryObjectives.find(
        o => o.month === month && o.metric_type === metricType
      );
      
      // For actual values, we'd need monthly breakdown - for now use current totals for current month
      let actual = 0;
      if (month === currentMonth && perfData) {
        switch (metricType) {
          case 'users': actual = perfData.totalUsers; break;
          case 'businesses': actual = perfData.totalBusinesses; break;
          case 'revenue': actual = perfData.totalRevenue; break;
          case 'orders': actual = perfData.totalOrders; break;
        }
      }
      
      return {
        month,
        actual,
        target: objective?.target_value || 0
      };
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Objectifs par pays
            </h1>
            <p className="text-muted-foreground">
              Définir et suivre les cibles mensuelles pour chaque marché
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={viewMode}
              onValueChange={(v) => setViewMode(v as 'editor' | 'summary')}
            >
              <SelectTrigger className="w-[140px]">
                <BarChart3 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Édition</SelectItem>
                <SelectItem value="summary">Résumé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Country Tabs */}
        <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
          <TabsList className="flex-wrap h-auto gap-1 p-1">
            {COUNTRIES.map(country => (
              <TabsTrigger 
                key={country.code} 
                value={country.code}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-1">{country.flag}</span>
                <span className="hidden sm:inline">{country.name}</span>
                <span className="sm:hidden">{country.code}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {COUNTRIES.map(country => (
            <TabsContent key={country.code} value={country.code} className="mt-6">
              {viewMode === 'editor' ? (
                <CountryObjectivesEditor
                  countryCode={country.code}
                  countryName={country.name}
                  flag={country.flag}
                  allCountries={COUNTRIES}
                />
              ) : (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <CountryObjectivesSummary
                    countryCode={country.code}
                    countryName={country.name}
                    flag={country.flag}
                    month={currentMonth}
                    year={selectedYear}
                    metrics={getSummaryMetrics(country.code)}
                  />

                  {/* Achievement Charts */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <ObjectiveAchievementChart
                      countryCode={country.code}
                      countryName={country.name}
                      metricType="users"
                      year={selectedYear}
                      monthlyData={getChartData('users')}
                    />
                    <ObjectiveAchievementChart
                      countryCode={country.code}
                      countryName={country.name}
                      metricType="revenue"
                      year={selectedYear}
                      monthlyData={getChartData('revenue')}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* All Countries Summary */}
        {viewMode === 'summary' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Résumé tous pays - {new Date(selectedYear, currentMonth - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COUNTRIES.map(country => {
                  const metrics = getSummaryMetrics(country.code);
                  const hasObjectives = Object.values(metrics).some(m => m.target > 0);
                  
                  if (!hasObjectives) return null;

                  const scores = Object.values(metrics)
                    .filter(m => m.target > 0)
                    .map(m => (m.actual / m.target) * 100);
                  
                  const avgScore = scores.length > 0 
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0;

                  const getScoreColor = (score: number) => {
                    if (score >= 100) return 'bg-green-500';
                    if (score >= 70) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };

                  return (
                    <div 
                      key={country.code}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{country.flag}</span>
                        <span className="font-medium">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getScoreColor(avgScore)}`} />
                        <span className="font-bold">{avgScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
