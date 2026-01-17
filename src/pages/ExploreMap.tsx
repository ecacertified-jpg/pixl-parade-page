import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map, Filter, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BusinessClusterMap } from '@/components/BusinessClusterMap';
import { BusinessMapCard } from '@/components/BusinessMapCard';
import { useExploreMapData, type BusinessMapPoint, type ExploreMapFilters } from '@/hooks/useExploreMapData';
import { Loader2 } from 'lucide-react';

const PROXIMITY_OPTIONS = [
  { value: 'all', label: 'Toutes distances', radius: null },
  { value: '1', label: '1 km', radius: 1 },
  { value: '5', label: '5 km', radius: 5 },
  { value: '10', label: '10 km', radius: 10 },
  { value: '25', label: '25 km', radius: 25 },
];

const COUNTRY_OPTIONS = [
  { value: 'all', label: 'Tous les pays' },
  { value: 'CI', label: '🇨🇮 Côte d\'Ivoire' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'SN', label: '🇸🇳 Sénégal' },
];

export default function ExploreMap() {
  const navigate = useNavigate();
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessMapPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProximity, setSelectedProximity] = useState<string>('all');

  // Build filters object
  const filters: ExploreMapFilters = {};
  
  if (selectedCountry !== 'all') {
    filters.countryCode = selectedCountry;
  }
  
  if (selectedType !== 'all') {
    filters.businessType = selectedType;
  }
  
  if (selectedProximity !== 'all' && userLocation) {
    const proximity = PROXIMITY_OPTIONS.find(p => p.value === selectedProximity);
    if (proximity?.radius) {
      filters.nearMe = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm: proximity.radius,
      };
    }
  }

  const { businesses, geoJsonPoints, businessTypes, loading, error } = useExploreMapData(filters);

  // Count active filters
  const activeFilterCount = [
    selectedCountry !== 'all',
    selectedType !== 'all',
    selectedProximity !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCountry('all');
    setSelectedType('all');
    setSelectedProximity('all');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3 z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1">
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Découvrir les boutiques
          </h1>
          <p className="text-xs text-muted-foreground">
            {loading ? 'Chargement...' : `${businesses.length} boutique${businesses.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filter button */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtrer les boutiques
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-6 py-4">
              {/* Country filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pays</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Business type filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de boutique</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {businessTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proximity filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Proximité
                  {!userLocation && (
                    <span className="text-xs text-muted-foreground">(nécessite la géolocalisation)</span>
                  )}
                </label>
                <Select 
                  value={selectedProximity} 
                  onValueChange={setSelectedProximity}
                  disabled={!userLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Distance maximale" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROXIMITY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!userLocation && (
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur le bouton de localisation sur la carte pour activer ce filtre
                  </p>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={() => setIsFilterOpen(false)}
              >
                Appliquer les filtres
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Active filters bar */}
      {activeFilterCount > 0 && (
        <div className="bg-card/50 border-b border-border px-4 py-2 flex items-center gap-2 overflow-x-auto z-20">
          {selectedCountry !== 'all' && (
            <Badge variant="secondary" className="shrink-0">
              {COUNTRY_OPTIONS.find(c => c.value === selectedCountry)?.label}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setSelectedCountry('all')}
              >
                ×
              </button>
            </Badge>
          )}
          {selectedType !== 'all' && (
            <Badge variant="secondary" className="shrink-0">
              {selectedType}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setSelectedType('all')}
              >
                ×
              </button>
            </Badge>
          )}
          {selectedProximity !== 'all' && (
            <Badge variant="secondary" className="shrink-0">
              {PROXIMITY_OPTIONS.find(p => p.value === selectedProximity)?.label}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => setSelectedProximity('all')}
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des boutiques...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <div className="text-center p-6">
              <p className="text-destructive mb-2">Erreur lors du chargement</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : (
          <BusinessClusterMap
            geoJsonPoints={geoJsonPoints}
            onBusinessSelect={setSelectedBusiness}
            selectedBusiness={selectedBusiness}
            userLocation={userLocation}
            onUserLocationChange={setUserLocation}
          />
        )}

        {/* Selected business card */}
        <BusinessMapCard
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          userLocation={userLocation}
        />
      </div>
    </div>
  );
}
