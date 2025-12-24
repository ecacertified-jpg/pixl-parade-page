import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { RealtimeConnectionStatus } from '@/components/admin/RealtimeConnectionStatus';
import { RealtimeStatsCards } from '@/components/admin/RealtimeStatsCards';
import { RealtimeActivityFeed } from '@/components/admin/RealtimeActivityFeed';
import { RealtimeChart } from '@/components/admin/RealtimeChart';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RealtimeDashboard() {
  const {
    events,
    liveStats,
    chartData,
    isConnected,
    isConnecting,
    isPaused,
    togglePause,
    clearEvents,
    refetchStats,
  } = useRealtimeDashboard();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              📡 Tableau de bord temps réel
            </h1>
            <p className="text-muted-foreground mt-1">
              Surveillez l'activité de la plateforme en direct
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetchStats}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser les stats
            </Button>
            <RealtimeConnectionStatus 
              isConnected={isConnected} 
              isConnecting={isConnecting} 
            />
          </div>
        </div>

        {/* Stats Cards */}
        <RealtimeStatsCards stats={liveStats} />

        {/* Charts and Activity Feed */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Activité par minute</CardTitle>
              <CardDescription>
                Événements des 30 dernières minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealtimeChart data={chartData} />
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">🔴 Flux en direct</CardTitle>
              <CardDescription>
                Les 50 derniers événements
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[400px]">
              <RealtimeActivityFeed
                events={events}
                isPaused={isPaused}
                onTogglePause={togglePause}
                onClear={clearEvents}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
