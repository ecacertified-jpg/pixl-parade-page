import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RealtimeMap } from './RealtimeMap';
import { useRealtimeMapData, RealtimeEvent } from '@/hooks/useRealtimeMapData';
import { MapPin, RotateCcw, Maximize2 } from 'lucide-react';

interface RealtimeMapCardProps {
  events: RealtimeEvent[];
  isConnected: boolean;
}

const MAPBOX_TOKEN_KEY = 'joie_de_vivre_mapbox_token';

export function RealtimeMapCard({ events, isConnected }: RealtimeMapCardProps) {
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { markers, statistics } = useRealtimeMapData(events);

  useEffect(() => {
    const savedToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  const handleTokenSubmit = (token: string) => {
    setMapboxToken(token);
    localStorage.setItem(MAPBOX_TOKEN_KEY, token);
  };

  const handleResetToken = () => {
    setMapboxToken('');
    localStorage.removeItem(MAPBOX_TOKEN_KEY);
  };

  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              🗺️ Carte des activités
            </CardTitle>
            <CardDescription>
              {statistics.citiesCount} villes actives • {statistics.eventsWithLocation}/{statistics.totalEvents} événements localisés
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {mapboxToken && (
              <Button variant="ghost" size="sm" onClick={handleResetToken}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className={isFullscreen ? 'h-[calc(100%-80px)]' : 'h-[400px]'}>
        <RealtimeMap 
          markers={markers}
          mapboxToken={mapboxToken}
          onTokenSubmit={handleTokenSubmit}
        />
      </CardContent>
    </Card>
  );
}
