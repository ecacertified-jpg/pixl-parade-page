import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapMarker } from '@/hooks/useRealtimeMapData';
import { IVORY_COAST_CENTER, IVORY_COAST_BOUNDS, getCityColor } from '@/utils/ivoryCoastCities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';

interface RealtimeMapProps {
  markers: MapMarker[];
  mapboxToken?: string;
  onTokenSubmit?: (token: string) => void;
}

export function RealtimeMap({ markers, mapboxToken, onTokenSubmit }: RealtimeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [tokenInput, setTokenInput] = useState('');
  const [hasValidToken, setHasValidToken] = useState(!!mapboxToken);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: IVORY_COAST_CENTER,
        zoom: 5.5,
        maxBounds: IVORY_COAST_BOUNDS,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: false }),
        'top-right'
      );

      map.current.on('load', () => {
        setHasValidToken(true);
      });

      map.current.on('error', () => {
        setHasValidToken(false);
      });

    } catch (error) {
      console.error('Mapbox initialization error:', error);
      setHasValidToken(false);
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers
  useEffect(() => {
    if (!map.current || !hasValidToken) return;

    // Remove old markers not in current data
    const currentIds = new Set(markers.map(m => m.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    markers.forEach(markerData => {
      const existingMarker = markersRef.current.get(markerData.id);
      
      if (existingMarker) {
        // Update existing marker element
        const el = existingMarker.getElement();
        updateMarkerElement(el, markerData);
      } else {
        // Create new marker
        const el = createMarkerElement(markerData);
        
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(createPopupContent(markerData));

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(markerData.coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.set(markerData.id, marker);
      }
    });
  }, [markers, hasValidToken]);

  const handleTokenSubmit = () => {
    if (tokenInput.trim() && onTokenSubmit) {
      onTokenSubmit(tokenInput.trim());
    }
  };

  if (!mapboxToken || !hasValidToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gradient-to-br from-muted/40 to-muted/10 rounded-lg p-4 sm:p-6 gap-4 sm:gap-5">
        <div className="p-3 sm:p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-base sm:text-lg font-semibold">Token Mapbox requis</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
            Pour afficher la carte, entrez votre token Mapbox public.
          </p>
          <a 
            href="https://mapbox.com" 
            target="_blank" 
            rel="noopener" 
            className="inline-block text-xs sm:text-sm text-primary hover:underline"
          >
            → Obtenir un token gratuit sur mapbox.com
          </a>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
          <Input
            placeholder="pk.eyJ1Ijo..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleTokenSubmit} disabled={!tokenInput.trim()} className="gap-2">
            <MapPin className="h-4 w-4" />
            <span>Activer la carte</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getCityColor('user') }} />
          <span>Inscriptions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getCityColor('business') }} />
          <span>Business</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getCityColor('order') }} />
          <span>Commandes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getCityColor('fund') }} />
          <span>Cagnottes</span>
        </div>
      </div>
    </div>
  );
}

function createMarkerElement(markerData: MapMarker): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'realtime-map-marker';
  updateMarkerElement(el, markerData);
  return el;
}

function updateMarkerElement(el: HTMLElement, markerData: MapMarker): void {
  const size = Math.min(20 + markerData.totalCount * 3, 50);
  const dominantType = Object.entries(markerData.counts)
    .sort(([, a], [, b]) => b - a)[0][0];
  
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = '50%';
  el.style.backgroundColor = getCityColor(dominantType);
  el.style.border = '3px solid white';
  el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  el.style.cursor = 'pointer';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.color = 'white';
  el.style.fontWeight = 'bold';
  el.style.fontSize = '12px';
  el.style.transition = 'transform 0.2s ease';
  el.textContent = markerData.totalCount > 0 ? String(markerData.totalCount) : '';
  
  if (markerData.isNew) {
    el.classList.add('marker-pulse');
  } else {
    el.classList.remove('marker-pulse');
  }
}

function createPopupContent(markerData: MapMarker): string {
  const counts = Object.entries(markerData.counts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => {
      const emoji = type === 'user' ? '👥' : type === 'business' ? '🏪' : type === 'order' ? '📦' : type === 'fund' ? '🎁' : '💰';
      return `<div>${emoji} ${count}</div>`;
    })
    .join('');

  return `
    <div style="font-family: system-ui; padding: 4px;">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">
        📍 ${markerData.city.name}
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 12px;">
        ${counts}
      </div>
      <div style="font-size: 11px; color: #888; margin-top: 8px;">
        Total: ${markerData.totalCount} événements
      </div>
    </div>
  `;
}
