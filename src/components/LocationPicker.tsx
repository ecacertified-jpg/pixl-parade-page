import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Crosshair, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CitySelector } from "@/components/CitySelector";
import { findCityInCountry } from "@/utils/countryCities";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationPickerProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number | null, lng: number | null) => void;
  countryCode?: string;
  disabled?: boolean;
  label?: string;
}

export function LocationPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordinatesChange,
  countryCode = "CI",
  disabled = false,
  label = "Localisation de votre entreprise",
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  const { token: mapboxToken } = useMapboxToken();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Determine initial coordinates
  const getInitialCoordinates = useCallback((): { lat: number; lng: number } | null => {
    // Priority 1: Use provided coordinates
    if (latitude !== null && longitude !== null) {
      return { lat: latitude, lng: longitude };
    }

    // Priority 2: Derive from address
    if (address) {
      const cityData = findCityInCountry(address, countryCode);
      if (cityData) {
        return { lat: cityData.lat, lng: cityData.lng };
      }
    }

    // Default: Abidjan center
    return { lat: 5.3364, lng: -4.0267 };
  }, [latitude, longitude, address, countryCode]);

  // Update marker position
  const updateMarkerPosition = useCallback((lat: number, lng: number) => {
    if (marker.current && map.current) {
      marker.current.setLngLat([lng, lat]);
    }
    onCoordinatesChange(lat, lng);
  }, [onCoordinatesChange]);

  // Create draggable marker
  const createMarker = useCallback((coords: { lat: number; lng: number }) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create custom marker element
    const el = document.createElement("div");
    el.className = "location-picker-marker";
    el.innerHTML = `
      <div style="
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, hsl(259, 58%, 59%), hsl(272, 76%, 75%));
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="transform: rotate(45deg);">
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
        </svg>
      </div>
    `;

    marker.current = new mapboxgl.Marker({
      element: el,
      draggable: !disabled,
      anchor: "bottom-left",
    })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map.current);

    // Listen for drag end
    marker.current.on("dragend", () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        onCoordinatesChange(lngLat.lat, lngLat.lng);
      }
    });
  }, [disabled, onCoordinatesChange]);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    const coords = getInitialCoordinates();
    if (!coords) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [coords.lng, coords.lat],
        zoom: 14,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right"
      );

      map.current.on("load", () => {
        setMapLoaded(true);
        if (coords) {
          createMarker(coords);
        }
      });

      // Click on map to reposition marker
      map.current.on("click", (e) => {
        if (disabled) return;
        const { lat, lng } = e.lngLat;
        updateMarkerPosition(lat, lng);
        createMarker({ lat, lng });
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
      setMapLoaded(false);
    };
  }, [mapboxToken, getInitialCoordinates, createMarker, updateMarkerPosition, disabled]);

  // Update marker when coordinates change externally
  useEffect(() => {
    if (map.current && mapLoaded && latitude !== null && longitude !== null) {
      createMarker({ lat: latitude, lng: longitude });
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [latitude, longitude, mapLoaded, createMarker]);

  // Handle address change from CitySelector
  const handleAddressChange = (newAddress: string) => {
    onAddressChange(newAddress);

    // Try to get coordinates from city name
    const cityData = findCityInCountry(newAddress, countryCode);
    if (cityData && map.current && mapLoaded) {
      onCoordinatesChange(cityData.lat, cityData.lng);
      createMarker({ lat: cityData.lat, lng: cityData.lng });
      map.current.flyTo({
        center: [cityData.lng, cityData.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  };

  // Geolocation
  const handleUseCurrentPosition = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setGeolocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onCoordinatesChange(lat, lng);

        if (map.current && mapLoaded) {
          createMarker({ lat, lng });
          map.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            duration: 1000,
          });
        }

        setGeolocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Permission de géolocalisation refusée");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Position non disponible");
            break;
          case error.TIMEOUT:
            setGeoError("Délai de géolocalisation dépassé");
            break;
          default:
            setGeoError("Erreur de géolocalisation");
        }
        setGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Center map on current marker
  const handleRecenter = () => {
    if (map.current && latitude !== null && longitude !== null) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 500,
      });
    }
  };

  const hasValidCoordinates = latitude !== null && longitude !== null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        {mapboxToken ? (
          <div
            ref={mapContainer}
            className="w-full h-56 rounded-lg overflow-hidden border border-border"
            style={{ cursor: disabled ? "default" : "crosshair" }}
          />
        ) : (
          <div className="w-full h-32 rounded-lg bg-muted/50 flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Carte non configurée</p>
              <p className="text-xs">Token Mapbox non trouvé</p>
            </div>
          </div>
        )}

        {/* Address selector */}
        <CitySelector
          value={address}
          onChange={handleAddressChange}
          label="Adresse / Ville"
          placeholder="Sélectionnez l'emplacement"
          allowCustom
          showRegions
          disabled={disabled}
        />

        {/* Coordinates display */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {hasValidCoordinates ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  {latitude?.toFixed(6)}° N, {longitude?.toFixed(6)}° {longitude && longitude >= 0 ? 'E' : 'W'}
                </span>
                <Badge variant="secondary" className="text-xs">Position GPS</Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Position non définie</span>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {geoError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {geoError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentPosition}
            disabled={disabled || geolocating}
            className="flex-1"
          >
            {geolocating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4 mr-2" />
            )}
            Ma position GPS
          </Button>
          {hasValidCoordinates && mapboxToken && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRecenter}
              disabled={disabled}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Recentrer
            </Button>
          )}
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          💡 Cliquez sur la carte ou déplacez le marqueur pour définir la position exacte de votre entreprise.
        </p>
      </CardContent>
    </Card>
  );
}
