import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Crosshair, Loader2, CheckCircle, AlertCircle, X, RefreshCw, ShieldAlert, Wifi, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CitySelector } from "@/components/CitySelector";
import { findCityInCountry } from "@/utils/countryCities";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Type for structured geolocation error info
interface GeoErrorInfo {
  title: string;
  description: string;
  instructions: string[];
  icon: 'permission' | 'signal' | 'timeout';
}

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
  const initialCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const { token: mapboxToken } = useMapboxToken();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [geolocating, setGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<GeoErrorInfo | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Determine initial coordinates - memoized and stable
  const getInitialCoordinates = useCallback((): { lat: number; lng: number } => {
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

  // Store initial coordinates once
  useEffect(() => {
    if (!initialCoordsRef.current) {
      initialCoordsRef.current = getInitialCoordinates();
    }
  }, [getInitialCoordinates]);

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

  // Clear GPS accuracy circle
  const clearAccuracyCircle = useCallback(() => {
    if (!map.current) return;
    
    if (map.current.getLayer('accuracy-circle-fill')) {
      map.current.removeLayer('accuracy-circle-fill');
    }
    if (map.current.getLayer('accuracy-circle-border')) {
      map.current.removeLayer('accuracy-circle-border');
    }
    if (map.current.getSource('accuracy-circle')) {
      map.current.removeSource('accuracy-circle');
    }
    setGpsAccuracy(null);
  }, []);

  // Draw GPS accuracy circle
  const updateAccuracyCircle = useCallback((lat: number, lng: number, accuracy: number) => {
    if (!map.current || !mapLoaded) return;

    // Clear existing circle first
    clearAccuracyCircle();

    // Create a GeoJSON circle using turf-like calculation
    // Convert accuracy (meters) to a circle polygon
    const steps = 64;
    const coordinates: [number, number][] = [];
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      // Convert meters to degrees (approximate)
      const latOffset = (accuracy / 111320) * Math.cos(angle);
      const lngOffset = (accuracy / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
      coordinates.push([lng + lngOffset, lat + latOffset]);
    }
    coordinates.push(coordinates[0]); // Close the polygon

    const circleGeoJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };

    // Add source
    map.current.addSource('accuracy-circle', {
      type: 'geojson',
      data: circleGeoJSON
    });

    // Add fill layer
    map.current.addLayer({
      id: 'accuracy-circle-fill',
      type: 'fill',
      source: 'accuracy-circle',
      paint: {
        'fill-color': 'hsl(259, 58%, 59%)',
        'fill-opacity': 0.15
      }
    });

    // Add border layer
    map.current.addLayer({
      id: 'accuracy-circle-border',
      type: 'line',
      source: 'accuracy-circle',
      paint: {
        'line-color': 'hsl(259, 58%, 59%)',
        'line-width': 2,
        'line-opacity': 0.5
      }
    });

    setGpsAccuracy(accuracy);
  }, [mapLoaded, clearAccuracyCircle]);

  // Update marker position (clears accuracy circle for manual positioning)
  const updateMarkerPosition = useCallback((lat: number, lng: number) => {
    if (marker.current && map.current) {
      marker.current.setLngLat([lng, lat]);
    }
    clearAccuracyCircle();
    onCoordinatesChange(lat, lng);
  }, [onCoordinatesChange, clearAccuracyCircle]);

  // Initialize map - stable dependencies
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    const coords = initialCoordsRef.current || { lat: 5.3364, lng: -4.0267 };

    mapboxgl.accessToken = mapboxToken;
    setMapError(null);
    setTilesLoading(true);

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

      // Handle Mapbox errors (token issues, network errors)
      map.current.on("error", (e) => {
        console.error("Mapbox error:", e.error);
        const error = e.error as { status?: number; message?: string; url?: string };
        
        // Ignore non-critical errors (fonts, icons, sprites)
        if (error?.url && (
          error.url.includes('fonts') ||
          error.url.includes('sprite') ||
          error.url.includes('glyphs')
        )) {
          console.warn("Non-critical Mapbox resource error:", error.url);
          return;
        }
        
        // Only show critical errors (token, style)
        if (error?.status === 401 || error?.status === 403) {
          setMapError("Erreur d'authentification - token invalide ou domaine non autorisé");
        }
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        
        // Verify style loaded correctly
        const style = map.current?.getStyle();
        if (!style?.sources || Object.keys(style.sources).length === 0) {
          console.warn("Map style has no sources, attempting reload...");
          map.current?.setStyle("mapbox://styles/mapbox/streets-v12");
        }
        
        createMarker(coords);
      });

      // Track when tiles are fully loaded
      map.current.on("idle", () => {
        setTilesLoading(false);
        // Clear any minor errors if tiles loaded successfully
        setMapError(null);
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
      setMapError("Erreur d'initialisation de la carte");
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
      setTilesLoading(true);
    };
  }, [mapboxToken, disabled, createMarker, updateMarkerPosition]);

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
    clearAccuracyCircle(); // Clear GPS circle on manual selection

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
  const handleUseCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        instructions: [
          "Utilisez un navigateur plus récent (Chrome, Firefox, Safari)",
          "Mettez à jour votre navigateur",
          "Sélectionnez manuellement votre position sur la carte"
        ],
        icon: 'signal'
      });
      return;
    }

    setGeolocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        onCoordinatesChange(lat, lng);

        if (map.current && mapLoaded) {
          createMarker({ lat, lng });
          updateAccuracyCircle(lat, lng, accuracy);
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
            setGeoError({
              title: "Permission de géolocalisation refusée",
              description: "Votre navigateur a bloqué l'accès à votre position.",
              instructions: [
                "Cliquez sur l'icône 🔒 dans la barre d'adresse",
                "Trouvez 'Localisation' ou 'Position'",
                "Sélectionnez 'Autoriser'",
                "Rechargez la page si nécessaire"
              ],
              icon: 'permission'
            });
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError({
              title: "Signal GPS non disponible",
              description: "Impossible de déterminer votre position actuelle.",
              instructions: [
                "Vérifiez que le GPS est activé sur votre appareil",
                "Si vous êtes en intérieur, essayez près d'une fenêtre",
                "Désactivez le mode avion si activé",
                "Attendez quelques secondes et réessayez"
              ],
              icon: 'signal'
            });
            break;
          case error.TIMEOUT:
            setGeoError({
              title: "Délai de géolocalisation dépassé",
              description: "La recherche de votre position a pris trop de temps.",
              instructions: [
                "Vérifiez votre connexion internet",
                "Déplacez-vous vers un endroit avec meilleur signal",
                "Fermez les autres applications utilisant le GPS",
                "Réessayez dans quelques instants"
              ],
              icon: 'timeout'
            });
            break;
          default:
            setGeoError({
              title: "Erreur de géolocalisation",
              description: "Une erreur inattendue s'est produite.",
              instructions: [
                "Vérifiez les autorisations de localisation",
                "Redémarrez votre navigateur",
                "Réessayez dans quelques instants"
              ],
              icon: 'signal'
            });
        }
        setGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [mapLoaded, createMarker, updateAccuracyCircle, onCoordinatesChange]);

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
          <div className="relative">
            <div
              ref={mapContainer}
              className="w-full h-56 rounded-lg overflow-hidden border border-border"
              style={{ cursor: disabled ? "default" : "crosshair" }}
            />
            {/* Tiles loading indicator */}
            {tilesLoading && mapLoaded && !mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Chargement de la carte...</span>
                </div>
              </div>
            )}
            {/* Map error overlay - only show if tiles haven't loaded */}
            {mapError && tilesLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 rounded-lg">
                <div className="flex flex-col items-center gap-2 text-destructive p-4 text-center">
                  <AlertCircle className="h-6 w-6" />
                  <span className="text-sm font-medium">{mapError}</span>
                </div>
              </div>
            )}
          </div>
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
          <div className="flex items-center gap-2 flex-wrap">
            {hasValidCoordinates ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  {latitude?.toFixed(6)}° N, {longitude?.toFixed(6)}° {longitude && longitude >= 0 ? 'E' : 'W'}
                </span>
                <Badge variant="secondary" className="text-xs">Position GPS</Badge>
                {gpsAccuracy !== null && (
                  <Badge variant="outline" className="text-xs">
                    ± {gpsAccuracy < 1000 ? `${Math.round(gpsAccuracy)}m` : `${(gpsAccuracy / 1000).toFixed(1)}km`}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Position non définie</span>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Geolocation Error Card */}
        {geoError && (
          <div className={`rounded-lg border p-4 space-y-3 ${
            geoError.icon === 'permission' 
              ? 'bg-destructive/10 border-destructive/30' 
              : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
          }`}>
            {/* Error Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {geoError.icon === 'permission' && (
                  <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0" />
                )}
                {geoError.icon === 'signal' && (
                  <Wifi className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                )}
                {geoError.icon === 'timeout' && (
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`font-medium text-sm ${
                    geoError.icon === 'permission' ? 'text-destructive' : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    {geoError.title}
                  </h4>
                  <p className={`text-xs mt-0.5 ${
                    geoError.icon === 'permission' ? 'text-destructive/80' : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {geoError.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => setGeoError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Instructions */}
            <div className={`text-xs space-y-1 ${
              geoError.icon === 'permission' ? 'text-destructive/90' : 'text-amber-700 dark:text-amber-300'
            }`}>
              <p className="font-medium">Pour résoudre ce problème :</p>
              <ol className="list-decimal list-inside space-y-0.5 pl-1">
                {geoError.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            {/* Retry Button */}
            <Button
              variant={geoError.icon === 'permission' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => {
                setGeoError(null);
                handleUseCurrentPosition();
              }}
              disabled={geolocating}
              className="w-full"
            >
              {geolocating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Réessayer la géolocalisation
            </Button>
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
