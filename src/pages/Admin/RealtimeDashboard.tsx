import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { RealtimeConnectionStatus } from '@/components/admin/RealtimeConnectionStatus';
import { RealtimeStatsCards } from '@/components/admin/RealtimeStatsCards';
import { RealtimeActivityFeed } from '@/components/admin/RealtimeActivityFeed';
import { RealtimeChart } from '@/components/admin/RealtimeChart';
import { RealtimeMapCard } from '@/components/admin/RealtimeMapCard';
import { AdminCountryRestrictionAlert } from '@/components/admin/AdminCountryRestrictionAlert';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
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

  // Transform events for map (ensure correct interface)
  const mapEvents = events.map(e => ({
    id: e.id,
    type: e.type,
    title: e.title,
    subtitle: e.description,
    timestamp: e.timestamp,
    location: e.location,
    coordinates: e.coordinates,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Country Restriction Alert */}
        <AdminCountryRestrictionAlert />

        {/* Header */}
        <AdminPageHeader
          title="📡 Tableau de bord temps réel"
          description="Surveillez l'activité de la plateforme en direct"
          showCountryIndicator={false}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetchStats}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              <RealtimeConnectionStatus 
                isConnected={isConnected} 
                isConnecting={isConnecting} 
              />
            </div>
          }
        />

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

        {/* Map */}
        <RealtimeMapCard events={mapEvents} isConnected={isConnected} />
      </div>
    </AdminLayout>
  );
}
