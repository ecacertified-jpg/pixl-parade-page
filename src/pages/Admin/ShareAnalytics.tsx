import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useShareAnalytics, Period } from '@/hooks/useShareAnalytics';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { ShareKPICards } from '@/components/admin/ShareKPICards';
import { ShareFunnelChart } from '@/components/admin/ShareFunnelChart';
import { PlatformPerformanceChart } from '@/components/admin/PlatformPerformanceChart';
import { ShareTrendsChart } from '@/components/admin/ShareTrendsChart';
import { TopSharedProductsTable } from '@/components/admin/TopSharedProductsTable';
import { TopSharedBusinessesTable } from '@/components/admin/TopSharedBusinessesTable';
import { UTMSourcesChart } from '@/components/admin/UTMSourcesChart';
import { DeviceBreakdownChart } from '@/components/admin/DeviceBreakdownChart';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ShareAnalytics() {
  const [period, setPeriod] = useState<Period>('30days');
  const { data, loading, fetchAnalytics } = useShareAnalytics();
  const { getCountryFilter } = useAdminCountry();
  const countryFilter = getCountryFilter();

  useEffect(() => {
    fetchAnalytics(period, countryFilter);
  }, [period, countryFilter, fetchAnalytics]);

  const handleExportCSV = () => {
    // Export daily stats as CSV
    const headers = ['Date', 'Partages', 'Clics', 'Conversions'];
    const rows = data.dailyStats.map(stat => [
      stat.date,
      stat.shares.toString(),
      stat.clicks.toString(),
      stat.conversions.toString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `share-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const periodLabels: Record<Period, string> = {
    '7days': '7 derniers jours',
    '30days': '30 derniers jours',
    '90days': '90 derniers jours',
    'year': '12 derniers mois'
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="📤 Statistiques de Partage"
          description="Analysez l'impact des partages sociaux sur les conversions"
          actions={
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 derniers jours</SelectItem>
                  <SelectItem value="30days">30 derniers jours</SelectItem>
                  <SelectItem value="90days">90 derniers jours</SelectItem>
                  <SelectItem value="year">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchAnalytics(period, countryFilter)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportCSV}
                disabled={loading || data.dailyStats.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        {/* KPI Cards */}
        <ShareKPICards data={data} loading={loading} />

        {/* Funnel */}
        <ShareFunnelChart data={data} loading={loading} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlatformPerformanceChart data={data.platformBreakdown} loading={loading} />
          <ShareTrendsChart data={data.dailyStats} loading={loading} period={period} />
        </div>

        {/* Tables row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSharedProductsTable data={data.topProducts} loading={loading} />
          <TopSharedBusinessesTable data={data.topBusinesses} loading={loading} />
        </div>

        {/* Pie charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UTMSourcesChart data={data.utmSources} loading={loading} />
          <DeviceBreakdownChart data={data.deviceBreakdown} loading={loading} />
        </div>
      </div>
    </AdminLayout>
  );
}
