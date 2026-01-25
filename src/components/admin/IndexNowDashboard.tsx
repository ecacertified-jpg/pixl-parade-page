import { useIndexNowStats } from '@/hooks/useIndexNowStats';
import { IndexNowKPICards } from './IndexNowKPICards';
import { IndexNowTrendsChart } from './IndexNowTrendsChart';
import { IndexNowBreakdownCharts } from './IndexNowBreakdownCharts';
import { IndexNowHistoryTable } from './IndexNowHistoryTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface IndexNowDashboardProps {
  days?: number;
}

export function IndexNowDashboard({ days = 30 }: IndexNowDashboardProps) {
  const { stats, loading, refetch } = useIndexNowStats({ days, limit: 100 });

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <IndexNowKPICards stats={stats} loading={loading} />

      {/* Trends Chart */}
      <IndexNowTrendsChart stats={stats} loading={loading} />

      {/* Breakdown Charts */}
      <IndexNowBreakdownCharts stats={stats} loading={loading} />

      {/* History Table */}
      <IndexNowHistoryTable 
        submissions={stats?.recentSubmissions || []} 
        loading={loading} 
      />
    </div>
  );
}
