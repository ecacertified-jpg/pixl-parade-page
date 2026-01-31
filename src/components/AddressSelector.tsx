import { useState, useMemo, useCallback } from "react";
import { MapPin, ChevronDown, Plus, Check, Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCountry } from "@/contexts/CountryContext";
import { 
  getMainLocations, 
  getNeighborhoodsOf, 
  getCoordinatesFor,
  isMajorCityCommune,
  getMajorCityName,
  type CityCoordinates 
} from "@/utils/countryCities";

export interface AddressResult {
  city: string;
  neighborhood: string;
  fullAddress: string;
  parentCity?: string;
  latitude: number;
  longitude: number;
  isCustomNeighborhood: boolean;
}

interface AddressSelectorProps {
  onAddressChange: (data: AddressResult) => void;
  initialCity?: string;
  initialNeighborhood?: string;
  label?: string;
  cityLabel?: string;
  neighborhoodLabel?: string;
  required?: boolean;
  disabled?: boolean;
  showCoordinates?: boolean;
  className?: string;
}

export function AddressSelector({
  onAddressChange,
  initialCity = "",
  initialNeighborhood = "",
  label = "Adresse",
  cityLabel = "Ville / Commune",
  neighborhoodLabel = "Quartier",
  required = false,
  disabled = false,
  showCoordinates = false,
  className,
}: AddressSelectorProps) {
  const { country } = useCountry();
  const countryCode = country.code;

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood);
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  // Get structured location data
  const { majorCityCommunes, majorCityName, majorCityLabel, otherCities } = useMemo(() => {
    return getMainLocations(countryCode);
  }, [countryCode]);

  // Get neighborhoods for selected city
  const neighborhoods = useMemo(() => {
    if (!selectedCity) return [];
    return getNeighborhoodsOf(countryCode, selectedCity);
  }, [countryCode, selectedCity]);

  // Check if selected city is a commune of the major city
  const isCommune = useMemo(() => {
    return isMajorCityCommune(countryCode, selectedCity);
  }, [countryCode, selectedCity]);

  // Build and emit result
  const emitChange = useCallback((city: string, neighborhood: string, isCustomNeigh: boolean) => {
    if (!city) return;

    const parentCity = isMajorCityCommune(countryCode, city) ? getMajorCityName(countryCode) : undefined;
    const coords = getCoordinatesFor(countryCode, city, neighborhood);
    
    const fullAddress = neighborhood 
      ? `${neighborhood}, ${city}${parentCity ? `, ${parentCity}` : ""}`
      : city;

    onAddressChange({
      city,
      neighborhood,
      fullAddress,
      parentCity,
      latitude: coords?.lat || 0,
      longitude: coords?.lng || 0,
      isCustomNeighborhood: isCustomNeigh,
    });
  }, [countryCode, onAddressChange]);

  // Handle city selection
  const handleCitySelect = (city: CityCoordinates) => {
    setSelectedCity(city.name);
    setSelectedNeighborhood("");
    setCustomNeighborhood("");
    setIsCustom(false);
    setCityOpen(false);
    emitChange(city.name, "", false);
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhood: CityCoordinates) => {
    setSelectedNeighborhood(neighborhood.name);
    setIsCustom(false);
    setNeighborhoodOpen(false);
    emitChange(selectedCity, neighborhood.name, false);
  };

  // Handle custom neighborhood
  const handleCustomNeighborhood = () => {
    if (!customNeighborhood.trim()) return;
    setSelectedNeighborhood(customNeighborhood.trim());
    setIsCustom(true);
    setNeighborhoodOpen(false);
    emitChange(selectedCity, customNeighborhood.trim(), true);
  };

  // Calculate coordinates for display
  const currentCoords = useMemo(() => {
    if (!selectedCity) return null;
    return getCoordinatesFor(countryCode, selectedCity, selectedNeighborhood);
  }, [countryCode, selectedCity, selectedNeighborhood]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Label principal */}
      {label && (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Sélection de ville/commune */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {cityLabel}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityOpen}
                disabled={disabled}
                className={cn(
                  "w-full justify-between font-normal",
                  !selectedCity && "text-muted-foreground"
                )}
              >
                {selectedCity ? (
                  <span className="flex items-center gap-2">
                    {isCommune ? (
                      <Building2 className="h-4 w-4 text-primary" />
                    ) : (
                      <MapPin className="h-4 w-4 text-primary" />
                    )}
                    {selectedCity}
                    {isCommune && majorCityName && (
                      <span className="text-xs text-muted-foreground">({majorCityName})</span>
                    )}
                  </span>
                ) : (
                  <span>Sélectionner une ville...</span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une ville..." />
                <CommandList>
                  <CommandEmpty>Aucune ville trouvée</CommandEmpty>
                  
                  {/* Communes de la grande ville */}
                  {majorCityCommunes.length > 0 && (
                    <CommandGroup heading={majorCityLabel}>
                      {majorCityCommunes.map((commune) => (
                        <CommandItem
                          key={commune.name}
                          value={commune.name}
                          onSelect={() => handleCitySelect(commune)}
                        >
                          <Building2 className="mr-2 h-4 w-4 text-primary" />
                          {commune.name}
                          {selectedCity === commune.name && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  <CommandSeparator />

                  {/* Autres villes */}
                  {otherCities.length > 0 && (
                    <CommandGroup heading="🏘️ Autres villes">
                      {otherCities.map((city) => (
                        <CommandItem
                          key={city.name}
                          value={city.name}
                          onSelect={() => handleCitySelect(city)}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {city.name}
                          {selectedCity === city.name && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sélection de quartier */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{neighborhoodLabel}</Label>
          <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={neighborhoodOpen}
                disabled={disabled || !selectedCity}
                className={cn(
                  "w-full justify-between font-normal",
                  !selectedNeighborhood && "text-muted-foreground"
                )}
              >
                {selectedNeighborhood ? (
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-accent" />
                    {selectedNeighborhood}
                    {isCustom && (
                      <span className="text-xs text-muted-foreground">(ajouté)</span>
                    )}
                  </span>
                ) : (
                  <span>
                    {selectedCity ? "Choisir un quartier..." : "Sélectionner d'abord une ville"}
                  </span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Rechercher ou ajouter..."
                  value={customNeighborhood}
                  onValueChange={setCustomNeighborhood}
                />
                <CommandList>
                  {/* Option d'ajout personnalisé */}
                  {customNeighborhood.trim() && (
                    <CommandGroup>
                      <CommandItem
                        value={`add-${customNeighborhood}`}
                        onSelect={handleCustomNeighborhood}
                        className="text-primary"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter "{customNeighborhood.trim()}"
                      </CommandItem>
                    </CommandGroup>
                  )}

                  {neighborhoods.length > 0 ? (
                    <CommandGroup heading="Quartiers populaires">
                      {neighborhoods.map((neighborhood) => (
                        <CommandItem
                          key={neighborhood.name}
                          value={neighborhood.name}
                          onSelect={() => handleNeighborhoodSelect(neighborhood)}
                        >
                          <Home className="mr-2 h-4 w-4" />
                          {neighborhood.name}
                          {selectedNeighborhood === neighborhood.name && !isCustom && (
                            <Check className="ml-auto h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>
                      {customNeighborhood.trim() 
                        ? "Appuyez pour ajouter ce quartier" 
                        : "Aucun quartier enregistré. Tapez pour en ajouter un."}
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Aperçu de l'adresse complète */}
      {selectedCity && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Adresse complète</p>
            <p className="text-sm font-medium">
              {selectedNeighborhood && `${selectedNeighborhood}, `}
              {selectedCity}
              {isCommune && majorCityName && `, ${majorCityName}`}
            </p>
            {showCoordinates && currentCoords && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {currentCoords.lat.toFixed(4)}° N, {Math.abs(currentCoords.lng).toFixed(4)}° W
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressSelector;
