import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useReciprocityAnalytics, Period } from '@/hooks/useReciprocityAnalytics';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { ReciprocityStatsCards } from '@/components/admin/ReciprocityStatsCards';
import { TopContributorsTable } from '@/components/admin/TopContributorsTable';
import { ReciprocityNetworkChart } from '@/components/admin/ReciprocityNetworkChart';
import { BadgeDistributionChart } from '@/components/admin/BadgeDistributionChart';
import { ReciprocityTrendsChart } from '@/components/admin/ReciprocityTrendsChart';
import { OccasionBreakdownChart } from '@/components/admin/OccasionBreakdownChart';
import { ImbalanceAlertsSection } from '@/components/admin/ImbalanceAlertsSection';
import { CountryFilterIndicator } from '@/components/admin/CountryFilterIndicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReciprocityDashboard() {
  const [period, setPeriod] = useState<Period>('30days');
  const { getCountryFilter } = useAdminCountry();
  const countryFilter = getCountryFilter();
  const { data, loading, refresh } = useReciprocityAnalytics(period, countryFilter);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statistiques de Réciprocité</h1>
            <p className="text-muted-foreground mt-1">
              Analyse du réseau de contributions et d'entraide
            </p>
            <CountryFilterIndicator className="mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="90days">90 derniers jours</SelectItem>
                <SelectItem value="year">Dernière année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-[400px]" />
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* Stats Cards */}
            <ReciprocityStatsCards globalStats={data.globalStats} />

            {/* Network & Badge Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
              <ReciprocityNetworkChart networkData={data.networkData} />
              <BadgeDistributionChart badgeDistribution={data.badgeDistribution} />
            </div>

            {/* Top Contributors */}
            <TopContributorsTable contributors={data.topContributors} />

            {/* Trends & Occasions */}
            <div className="grid gap-6 md:grid-cols-2">
              <ReciprocityTrendsChart trends={data.trends} />
              <OccasionBreakdownChart occasionBreakdown={data.occasionBreakdown} />
            </div>

            {/* Imbalance Alerts */}
            <ImbalanceAlertsSection />
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Aucune donnée disponible pour cette période
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
