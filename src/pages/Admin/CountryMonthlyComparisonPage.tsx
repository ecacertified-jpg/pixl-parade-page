import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useCountryMonthlyComparison } from '@/hooks/useCountryMonthlyComparison';
import { MonthlyCountryComparisonTable } from '@/components/admin/MonthlyCountryComparisonTable';
import { CountryRankingChart } from '@/components/admin/CountryRankingChart';
import { StrugglingMarketsAlert } from '@/components/admin/StrugglingMarketsAlert';
import { CountryComparisonHeatmap } from '@/components/admin/CountryComparisonHeatmap';
import { CountryPerformanceRadar } from '@/components/admin/CountryPerformanceRadar';
import { CountryTrendsChart } from '@/components/admin/CountryTrendsChart';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, BarChart3, Table, Grid3X3, Target, Radar } from 'lucide-react';
import { exportToCSV, formatNumberFr, formatCurrencyXOF } from '@/utils/exportUtils';

const YEARS = [2024, 2025, 2026];
const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const CountryMonthlyComparisonPage = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState('table');
  
  const { 
    comparisons, 
    currentMonth, 
    yearlyRankings,
    heatmapData,
    loading, 
    refresh 
  } = useCountryMonthlyComparison({ year, month: selectedMonth });
  
  const { trends, loading: trendsLoading } = useCountryPerformance();

  const handleExport = () => {
    if (!currentMonth) return;

    const columns = [
      { key: 'countryCode' as const, header: 'Code' },
      { key: 'countryName' as const, header: 'Pays' },
      { key: 'overallRank' as const, header: 'Rang global' },
      { key: 'performanceScore' as const, header: 'Score (%)', format: (v: number) => v.toFixed(1) },
      { key: 'users' as const, header: 'Utilisateurs', format: formatNumberFr },
      { key: 'usersAchievement' as const, header: 'Objectif utilisateurs (%)', format: (v: number | null) => v !== null ? v.toFixed(1) : '-' },
      { key: 'businesses' as const, header: 'Entreprises', format: formatNumberFr },
      { key: 'businessesAchievement' as const, header: 'Objectif entreprises (%)', format: (v: number | null) => v !== null ? v.toFixed(1) : '-' },
      { key: 'revenue' as const, header: 'Revenus (FCFA)', format: formatCurrencyXOF },
      { key: 'revenueAchievement' as const, header: 'Objectif revenus (%)', format: (v: number | null) => v !== null ? v.toFixed(1) : '-' },
      { key: 'orders' as const, header: 'Commandes', format: formatNumberFr },
      { key: 'ordersAchievement' as const, header: 'Objectif commandes (%)', format: (v: number | null) => v !== null ? v.toFixed(1) : '-' },
      { key: 'isStruggling' as const, header: 'En difficulté', format: (v: boolean) => v ? 'Oui' : 'Non' },
    ];

    exportToCSV(currentMonth.countries, columns, `comparaison-pays-${MONTHS[selectedMonth - 1].label.toLowerCase()}-${year}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Comparaison mensuelle des marchés</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Visualisez les performances relatives et identifiez les marchés en difficulté
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={loading || !currentMonth}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Struggling Markets Alert */}
        <StrugglingMarketsAlert currentMonth={currentMonth} loading={loading} />

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Heatmap</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
            <TabsTrigger value="radar" className="gap-2">
              <Radar className="h-4 w-4" />
              <span className="hidden sm:inline">Radar</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Tendances</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <MonthlyCountryComparisonTable
              comparisons={comparisons}
              currentMonth={currentMonth}
              loading={loading}
              onMonthChange={setSelectedMonth}
              selectedMonth={selectedMonth}
              year={year}
            />
          </TabsContent>

          <TabsContent value="heatmap" className="mt-6">
            <CountryComparisonHeatmap
              heatmapData={heatmapData}
              loading={loading}
              year={year}
            />
          </TabsContent>

          <TabsContent value="ranking" className="mt-6">
            <CountryRankingChart
              yearlyRankings={yearlyRankings}
              loading={loading}
              year={year}
            />
          </TabsContent>

          <TabsContent value="radar" className="mt-6">
            <CountryPerformanceRadar
              currentMonth={currentMonth}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <CountryTrendsChart trends={trends} loading={trendsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default CountryMonthlyComparisonPage;
