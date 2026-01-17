import { useState, useEffect, useRef } from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findCityInCountry, type CityCoordinates } from "@/utils/countryCities";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface VendorLocationMapProps {
  address: string;
  businessName: string;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

const MAPBOX_TOKEN_KEY = "joie_de_vivre_mapbox_token";

export function VendorLocationMap({ 
  address, 
  businessName, 
  countryCode = "CI",
  latitude,
  longitude 
}: VendorLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [cityData, setCityData] = useState<CityCoordinates | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isExactLocation, setIsExactLocation] = useState(false);

  // Load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  // Determine coordinates - prioritize provided lat/lng over address lookup
  useEffect(() => {
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      // Use provided GPS coordinates
      setCityData({ lat: latitude, lng: longitude, name: address || "Position exacte", aliases: [] });
      setIsExactLocation(true);
    } else if (address) {
      // Fallback to address lookup
      const found = findCityInCountry(address, countryCode);
      setCityData(found);
      setIsExactLocation(false);
    } else {
      setCityData(null);
      setIsExactLocation(false);
    }
  }, [address, countryCode, latitude, longitude]);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !cityData || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [cityData.lng, cityData.lat],
        zoom: 13,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right"
      );

      map.current.on("load", () => {
        setMapLoaded(true);
        
        // Add marker
        if (cityData && map.current) {
          const el = document.createElement("div");
          el.className = "vendor-marker";
          el.innerHTML = `
            <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, hsl(259, 58%, 59%), hsl(272, 76%, 75%));
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `;

          marker.current = new mapboxgl.Marker({ element: el })
            .setLngLat([cityData.lng, cityData.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px; font-family: system-ui;">
                  <strong style="color: #7A5DC7;">${businessName}</strong>
                  <p style="margin: 4px 0 0; color: #666; font-size: 13px;">${address}</p>
                </div>
              `)
            )
            .addTo(map.current);
        }
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, cityData, businessName, address]);

  const openInGoogleMaps = () => {
    if (cityData) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${cityData.lat},${cityData.lng}`,
        "_blank"
      );
    } else {
      // Fallback: search by address
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        "_blank"
      );
    }
  };

  const openNavigation = () => {
    if (cityData) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${cityData.lat},${cityData.lng}`,
        "_blank"
      );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Localisation
          {isExactLocation && (
            <span className="ml-auto text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Position exacte
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Map or fallback */}
        {mapboxToken && cityData ? (
          <div
            ref={mapContainer}
            className="w-full h-48 rounded-lg overflow-hidden border border-border"
          />
        ) : (
          <div className="w-full h-32 rounded-lg bg-muted/50 flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {!cityData ? "Localisation non disponible" : "Carte non configurée"}
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{address}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={openInGoogleMaps}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir sur Maps
          </Button>
          {cityData && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={openNavigation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Itinéraire
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
