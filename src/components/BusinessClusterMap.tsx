import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import Supercluster from 'supercluster';
import { Button } from '@/components/ui/button';
import { Locate, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessMapPoint } from '@/hooks/useExploreMapData';
import 'mapbox-gl/dist/mapbox-gl.css';

interface GeoJsonFeature {
  type: 'Feature';
  properties: BusinessMapPoint & { cluster: boolean };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface BusinessClusterMapProps {
  geoJsonPoints: GeoJsonFeature[];
  onBusinessSelect: (business: BusinessMapPoint | null) => void;
  selectedBusiness: BusinessMapPoint | null;
  userLocation: { lat: number; lng: number } | null;
  onUserLocationChange: (location: { lat: number; lng: number } | null) => void;
}

export function BusinessClusterMap({
  geoJsonPoints,
  onBusinessSelect,
  selectedBusiness,
  userLocation,
  onUserLocationChange,
}: BusinessClusterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const superclusterRef = useRef<Supercluster | null>(null);
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Load Mapbox token
  useEffect(() => {
    const token = localStorage.getItem('mapbox_token');
    setMapToken(token);
  }, []);

  // Initialize Supercluster
  useEffect(() => {
    superclusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
    });
    
    if (geoJsonPoints.length > 0) {
      superclusterRef.current.load(geoJsonPoints as any);
    }
  }, [geoJsonPoints]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Update markers based on current view
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !superclusterRef.current) return;

    clearMarkers();

    const bounds = mapRef.current.getBounds();
    const zoom = Math.floor(mapRef.current.getZoom());

    const clusters = superclusterRef.current.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    );

    clusters.forEach((cluster: any) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties.cluster;

      if (isCluster) {
        // Create cluster marker
        const pointCount = cluster.properties.point_count;
        const size = pointCount < 10 ? 40 : pointCount < 50 ? 50 : 60;

        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.background = 'linear-gradient(135deg, hsl(259 58% 59%) 0%, hsl(272 76% 75%) 100%)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = pointCount < 10 ? '14px' : '16px';
        el.style.boxShadow = '0 4px 12px rgba(122, 93, 199, 0.4)';
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.transition = 'transform 0.2s';
        el.textContent = String(pointCount);

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.1)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        el.addEventListener('click', () => {
          const expansionZoom = Math.min(
            superclusterRef.current!.getClusterExpansionZoom(cluster.id),
            16
          );
          mapRef.current?.flyTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 500,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      } else {
        // Create individual business marker
        const business = cluster.properties as BusinessMapPoint;
        const isSelected = selectedBusiness?.id === business.id;

        const el = document.createElement('div');
        el.className = 'business-marker';
        el.style.width = isSelected ? '44px' : '36px';
        el.style.height = isSelected ? '44px' : '36px';
        el.style.borderRadius = '50%';
        el.style.background = isSelected 
          ? 'hsl(259 58% 59%)' 
          : 'white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.boxShadow = isSelected 
          ? '0 4px 16px rgba(122, 93, 199, 0.5)' 
          : '0 2px 8px rgba(0,0,0,0.2)';
        el.style.border = isSelected 
          ? '3px solid white' 
          : '2px solid hsl(259 58% 59%)';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.2s';
        el.style.overflow = 'hidden';

        if (business.logo) {
          const img = document.createElement('img');
          img.src = business.logo;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          el.appendChild(img);
        } else {
          const initials = business.name
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          el.textContent = initials;
          el.style.fontSize = '12px';
          el.style.fontWeight = 'bold';
          el.style.color = isSelected ? 'white' : 'hsl(259 58% 59%)';
        }

        el.addEventListener('mouseenter', () => {
          if (!isSelected) {
            el.style.transform = 'scale(1.15)';
          }
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        el.addEventListener('click', () => {
          onBusinessSelect(business);
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      }
    });
  }, [clearMarkers, selectedBusiness, onBusinessSelect]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !mapToken) return;

    mapboxgl.accessToken = mapToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-4.0083, 5.3600], // Abidjan by default
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      mapRef.current = map;
      updateMarkers();
    });

    map.on('moveend', updateMarkers);
    map.on('zoomend', updateMarkers);

    return () => {
      clearMarkers();
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [mapToken]);

  // Update markers when data or selection changes
  useEffect(() => {
    if (mapRef.current) {
      updateMarkers();
    }
  }, [geoJsonPoints, selectedBusiness, updateMarkers]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    userMarkerRef.current?.remove();

    const el = document.createElement('div');
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.background = 'hsl(217 91% 60%)';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.4)';
    
    // Pulsing effect
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.width = '40px';
    pulse.style.height = '40px';
    pulse.style.borderRadius = '50%';
    pulse.style.background = 'hsla(217 91% 60% / 0.3)';
    pulse.style.top = '-10px';
    pulse.style.left = '-10px';
    pulse.style.animation = 'pulse 2s infinite';
    el.appendChild(pulse);

    // Add animation style
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    userMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(mapRef.current);

    return () => {
      style.remove();
    };
  }, [userLocation]);

  // Handle user location request
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onUserLocationChange({ lat: latitude, lng: longitude });
        
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 13,
          duration: 1000,
        });
        
        setIsLocating(false);
        toast.success('Position trouvée');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Impossible de récupérer votre position');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out') => {
    if (!mapRef.current) return;
    const currentZoom = mapRef.current.getZoom();
    mapRef.current.zoomTo(currentZoom + (direction === 'in' ? 1 : -1), { duration: 300 });
  };

  if (!mapToken) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">Token Mapbox non configuré</p>
          <p className="text-sm text-muted-foreground">
            Ajoutez votre token dans les paramètres pour afficher la carte
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-md"
          onClick={handleLocateUser}
          disabled={isLocating}
        >
          <Locate className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
        </Button>
      </div>

      {/* Zoom controls for mobile */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-1 z-10 md:hidden">
        <Button
          variant="secondary"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-md h-10 w-10"
          onClick={() => handleZoom('in')}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-card/90 backdrop-blur-sm shadow-md h-10 w-10"
          onClick={() => handleZoom('out')}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
