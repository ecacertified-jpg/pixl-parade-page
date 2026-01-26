import { AdminLayout } from '@/components/AdminLayout';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { GlobalSummaryKPIs } from '@/components/admin/GlobalSummaryKPIs';
import { CountryPerformanceCard } from '@/components/admin/CountryPerformanceCard';
import { CountryComparisonChart } from '@/components/admin/CountryComparisonChart';
import { CountryTrendsChart } from '@/components/admin/CountryTrendsChart';
import { StrugglingCountryLiveBanner } from '@/components/admin/StrugglingCountryLiveBanner';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, GitCompare } from 'lucide-react';
import { exportToCSV, formatNumberFr, formatCurrencyXOF } from '@/utils/exportUtils';
import { useNavigate } from 'react-router-dom';

const CountryPerformanceDashboard = () => {
  const { countries, trends, totals, loading, refresh } = useCountryPerformance();
  const navigate = useNavigate();

  const handleExport = () => {
    if (countries.length === 0) return;

    const columns = [
      { key: 'countryName' as const, header: 'Pays' },
      { key: 'countryCode' as const, header: 'Code' },
      { key: 'totalUsers' as const, header: 'Utilisateurs', format: (v: number) => formatNumberFr(v) },
      { key: 'newUsersLast30Days' as const, header: 'Nouveaux (30j)', format: (v: number) => formatNumberFr(v) },
      { key: 'totalBusinesses' as const, header: 'Entreprises', format: (v: number) => formatNumberFr(v) },
      { key: 'activeBusinesses' as const, header: 'Actives', format: (v: number) => formatNumberFr(v) },
      { key: 'conversionRate' as const, header: 'Taux conversion (%)', format: (v: number) => v.toFixed(2) },
      { key: 'totalRevenue' as const, header: 'Revenus (FCFA)', format: (v: number) => formatCurrencyXOF(v) },
      { key: 'totalOrders' as const, header: 'Commandes', format: (v: number) => formatNumberFr(v) },
      { key: 'avgOrderValue' as const, header: 'Panier moyen (FCFA)', format: (v: number) => formatCurrencyXOF(v) },
    ];

    exportToCSV(countries, columns, 'performance-pays');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Struggling Countries Banner */}
        <StrugglingCountryLiveBanner />

        {/* Header */}
        <AdminPageHeader
          title="🌍 Performance par pays"
          description="Analyse des marchés et KPIs clés par région"
          showCountryIndicator={false}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/admin/countries/comparison')}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Comparaison
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={loading || countries.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          }
        />

        {/* Global Summary */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Résumé global</h2>
          <GlobalSummaryKPIs totals={totals} loading={loading} />
        </section>

        {/* Country Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Performance par pays</h2>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[300px] animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune donnée de performance disponible
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {countries
                .sort((a, b) => b.totalUsers - a.totalUsers)
                .map(country => (
                  <CountryPerformanceCard
                    key={country.countryCode}
                    data={country}
                    trends={trends[country.countryCode]}
                  />
                ))}
            </div>
          )}
        </section>

        {/* Comparison Chart */}
        <section>
          <CountryComparisonChart countries={countries} loading={loading} />
        </section>

        {/* Trends Chart */}
        <section>
          <CountryTrendsChart trends={trends} loading={loading} />
        </section>
      </div>
    </AdminLayout>
  );
};

export default CountryPerformanceDashboard;
