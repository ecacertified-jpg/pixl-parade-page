import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { type CityPageData } from "@/data/city-pages";
import { Loader2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useMapboxToken } from "@/hooks/useMapboxToken";

interface CityMapSectionProps {
  cities: CityPageData[];
  hoveredCity: string | null;
  onCityHover: (citySlug: string | null) => void;
}

const COUNTRY_COLORS: Record<string, string> = {
  CI: "#F97316", // Orange for Ivory Coast
  BJ: "#22C55E", // Green for Benin
  SN: "#3B82F6", // Blue for Senegal
};

const COUNTRY_FLAGS: Record<string, string> = {
  CI: "🇨🇮",
  BJ: "🇧🇯",
  SN: "🇸🇳",
};

export function CityMapSection({ cities, hoveredCity, onCityHover }: CityMapSectionProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const { token: mapboxToken } = useMapboxToken();

  // Calculate map bounds from cities
  const getBounds = () => {
    if (cities.length === 0) return null;
    
    const lngs = cities.map(c => c.coordinates.lng);
    const lats = cities.map(c => c.coordinates.lat);
    
    return new mapboxgl.LngLatBounds(
      [Math.min(...lngs) - 1, Math.min(...lats) - 1],
      [Math.max(...lngs) + 1, Math.max(...lats) + 1]
    );
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-2, 8], // West Africa center
        zoom: 4.5,
        attributionControl: false,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      
      map.current.on("load", () => {
        setIsLoading(false);
        
        // Fit bounds to show all cities
        const bounds = getBounds();
        if (bounds && map.current) {
          map.current.fitBounds(bounds, { padding: 50 });
        }
      });

      map.current.on("error", () => {
        setMapError("Impossible de charger la carte");
        setIsLoading(false);
      });

    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Erreur d'initialisation de la carte");
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update markers when cities change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each city
    cities.forEach(city => {
      const color = COUNTRY_COLORS[city.countryCode] || "#7A5DC7";
      const isHovered = hoveredCity === city.slug;

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "city-marker";
      el.style.cssText = `
        width: ${isHovered ? "40px" : "32px"};
        height: ${isHovered ? "40px" : "32px"};
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;
        ${isHovered ? "transform: scale(1.2); z-index: 100;" : ""}
      `;
      el.innerHTML = COUNTRY_FLAGS[city.countryCode] || "📍";

      // Create marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([city.coordinates.lng, city.coordinates.lat])
        .addTo(map.current!);

      // Hover events
      el.addEventListener("mouseenter", () => {
        onCityHover(city.slug);
        showPopup(city);
      });

      el.addEventListener("mouseleave", () => {
        onCityHover(null);
        if (popupRef.current) {
          popupRef.current.remove();
        }
      });

      // Click to navigate
      el.addEventListener("click", () => {
        window.location.href = `/${city.slug}`;
      });

      markersRef.current.push(marker);
    });
  }, [cities, hoveredCity, onCityHover]);

  // Show popup for city
  const showPopup = (city: CityPageData) => {
    if (!map.current) return;

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
    }

    const popupContent = `
      <div style="padding: 8px; min-width: 180px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 20px;">${COUNTRY_FLAGS[city.countryCode]}</span>
          <div>
            <div style="font-weight: 600; font-size: 14px;">${city.city}</div>
            <div style="font-size: 11px; color: #666;">${city.country}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 8px;">
          <div>🏪 ${city.stats.businesses} boutiques</div>
          <div>🎁 ${city.stats.gifts} cadeaux</div>
          <div>👥 ${city.stats.users} users</div>
          <div>📍 ${city.neighborhoods.length} quartiers</div>
        </div>
        <a href="/${city.slug}" style="
          display: block;
          text-align: center;
          background: #7A5DC7;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
        ">
          Découvrir ${city.city} →
        </a>
      </div>
    `;

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 20,
    })
      .setLngLat([city.coordinates.lng, city.coordinates.lat])
      .setHTML(popupContent)
      .addTo(map.current);
  };

  // Update bounds when cities filter changes
  useEffect(() => {
    if (!map.current || cities.length === 0) return;
    
    const bounds = getBounds();
    if (bounds) {
      map.current.fitBounds(bounds, { padding: 50, duration: 500 });
    }
  }, [cities]);

  if (mapError) {
    return (
      <div className="h-[400px] bg-muted flex flex-col items-center justify-center gap-4">
        <MapPin className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">{mapError}</p>
        <div className="flex flex-wrap gap-2 justify-center max-w-lg">
          {cities.slice(0, 6).map(city => (
            <Link 
              key={city.slug}
              to={`/${city.slug}`}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
            >
              {COUNTRY_FLAGS[city.countryCode]} {city.city}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] md:h-[500px]"
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement de la carte...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <p className="text-xs font-medium text-foreground mb-2">Légende</p>
        <div className="space-y-1">
          {Object.entries(COUNTRY_FLAGS).map(([code, flag]) => (
            <div key={code} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COUNTRY_COLORS[code] }}
              />
              <span>{flag} {code === "CI" ? "Côte d'Ivoire" : code === "BJ" ? "Bénin" : "Sénégal"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
