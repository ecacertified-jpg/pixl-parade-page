import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useBusinessDetailedStats } from '@/hooks/useBusinessDetailedStats';
import { useBusinessReportPDF } from '@/hooks/useBusinessReportPDF';
import { BusinessKPICards } from '@/components/admin/BusinessKPICards';
import { RevenueByTypeChart } from '@/components/admin/RevenueByTypeChart';
import { BusinessTrendsChart } from '@/components/admin/BusinessTrendsChart';
import { BusinessPerformanceTable } from '@/components/admin/BusinessPerformanceTable';
import { ProductCategoryChart } from '@/components/admin/ProductCategoryChart';
import { BusinessReportPreview } from '@/components/admin/BusinessReportPreview';
import { ExportReportModal } from '@/components/admin/ExportReportModal';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText } from 'lucide-react';

export default function BusinessAnalytics() {
  const { stats, loading, refresh } = useBusinessDetailedStats();
  const { generateReport, generating, progress } = useBusinessReportPDF(stats);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins">📊 Statistiques Business</h1>
            <p className="text-muted-foreground mt-1">
              Analyse détaillée des comptes business, produits et revenus
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setExportModalOpen(true)}
              disabled={loading || !stats}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

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
