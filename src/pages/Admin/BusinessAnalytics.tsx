import { AdminLayout } from '@/components/AdminLayout';
import { useBusinessDetailedStats } from '@/hooks/useBusinessDetailedStats';
import { BusinessKPICards } from '@/components/admin/BusinessKPICards';
import { RevenueByTypeChart } from '@/components/admin/RevenueByTypeChart';
import { BusinessTrendsChart } from '@/components/admin/BusinessTrendsChart';
import { BusinessPerformanceTable } from '@/components/admin/BusinessPerformanceTable';
import { ProductCategoryChart } from '@/components/admin/ProductCategoryChart';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function BusinessAnalytics() {
  const { stats, loading, refresh } = useBusinessDetailedStats();

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
          <Button 
            variant="outline" 
            onClick={refresh}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
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
    </AdminLayout>
  );
}
