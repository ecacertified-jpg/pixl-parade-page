import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useBusinessDetailedStats } from '@/hooks/useBusinessDetailedStats';
import { useBusinessReportPDF } from '@/hooks/useBusinessReportPDF';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { BusinessKPICards } from '@/components/admin/BusinessKPICards';
import { RevenueByTypeChart } from '@/components/admin/RevenueByTypeChart';
import { BusinessTrendsChart } from '@/components/admin/BusinessTrendsChart';
import { BusinessPerformanceTable } from '@/components/admin/BusinessPerformanceTable';
import { ProductCategoryChart } from '@/components/admin/ProductCategoryChart';
import { BusinessReportPreview } from '@/components/admin/BusinessReportPreview';
import { ExportReportModal } from '@/components/admin/ExportReportModal';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText } from 'lucide-react';

export default function BusinessAnalytics() {
  const { getCountryFilter } = useAdminCountry();
  const countryFilter = getCountryFilter();
  const { stats, loading, refresh } = useBusinessDetailedStats(countryFilter);
  const { generateReport, generating, progress } = useBusinessReportPDF(stats);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="📊 Statistiques Business"
          description="Analyse détaillée des comptes business"
          actions={
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExportModalOpen(true)}
                disabled={loading || !stats}
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exporter PDF</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          }
        />

        {/* KPI Cards */}
        <BusinessKPICards stats={stats} loading={loading} />

        {/* Revenue by Type */}
        <RevenueByTypeChart 
          data={stats?.revenueByType || []} 
          loading={loading} 
        />

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <BusinessTrendsChart 
            data={stats?.monthlyTrends || []} 
            loading={loading} 
          />

          {/* Product Categories */}
          <ProductCategoryChart 
            data={stats?.productCategoryStats || []} 
            loading={loading} 
          />
        </div>

        {/* Performance Table */}
        <BusinessPerformanceTable 
          data={stats?.businessPerformance || []} 
          loading={loading} 
        />
      </div>

      {/* Hidden charts for PDF capture */}
      {stats && (
        <BusinessReportPreview 
          stats={stats} 
          visible={exportModalOpen || generating} 
        />
      )}

      {/* Export Modal */}
      <ExportReportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onGenerate={generateReport}
        generating={generating}
        progress={progress}
      />
    </AdminLayout>
  );
}
