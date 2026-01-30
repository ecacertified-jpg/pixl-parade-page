import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RealtimeMap } from './RealtimeMap';
import { useRealtimeMapData, RealtimeEvent } from '@/hooks/useRealtimeMapData';
import { MapPin, RotateCcw, Maximize2 } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface RealtimeMapCardProps {
  events: RealtimeEvent[];
  isConnected: boolean;
}

export function RealtimeMapCard({ events, isConnected }: RealtimeMapCardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { markers, statistics } = useRealtimeMapData(events);
  
  // Admin dashboard: useDefault=false to require explicit token configuration
  const { token: mapboxToken, setToken, clearToken } = useMapboxToken({ useDefault: false });

  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              🗺️ Carte des activités
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {statistics.citiesCount} villes actives • {statistics.eventsWithLocation}/{statistics.totalEvents} localisés
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {mapboxToken && (
              <Button variant="ghost" size="sm" onClick={clearToken} title="Réinitialiser le token">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Plein écran"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div 
              className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
              title={isConnected ? 'Connecté' : 'Déconnecté'}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? 'h-[calc(100%-80px)]' : 'h-[400px]'}>
        <RealtimeMap 
          markers={markers}
          mapboxToken={mapboxToken || undefined}
          onTokenSubmit={setToken}
        />
      </CardContent>
    </Card>
  );
}
