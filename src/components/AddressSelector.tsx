import { useState, useMemo, useCallback, useEffect } from "react";
import { MapPin, ChevronDown, Plus, Check, Building2, Home, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
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
import { getAllCountries, getCountryConfig } from "@/config/countries";
import { 
  getMainLocations, 
  getNeighborhoodsOf, 
  getCoordinatesFor,
  isMajorCityCommune,
  getMajorCityName,
  type CityCoordinates 
} from "@/utils/countryCities";
import { toast } from "sonner";

export interface AddressResult {
  city: string;
  neighborhood: string;
  fullAddress: string;
  parentCity?: string;
  latitude: number;
  longitude: number;
  isCustomNeighborhood: boolean;
  countryCode: string;
}

interface AddressSelectorProps {
  onAddressChange: (data: AddressResult) => void;
  initialCity?: string;
  initialNeighborhood?: string;
  initialCountryCode?: string;
  label?: string;
  cityLabel?: string;
  neighborhoodLabel?: string;
  required?: boolean;
  disabled?: boolean;
  showCoordinates?: boolean;
  allowCountryOverride?: boolean;
  onCountryChange?: (countryCode: string) => void;
  className?: string;
}

export function AddressSelector({
  onAddressChange,
  initialCity = "",
  initialNeighborhood = "",
  initialCountryCode,
  label = "Adresse",
  cityLabel = "Ville / Commune",
  neighborhoodLabel = "Quartier",
  required = false,
  disabled = false,
  showCoordinates = false,
  allowCountryOverride = true,
  onCountryChange,
  className,
}: AddressSelectorProps) {
  const { country } = useCountry();
  const globalCountryCode = country.code;
  
  // Local country state for override functionality
  const [localCountryCode, setLocalCountryCode] = useState(
    initialCountryCode || globalCountryCode
  );
  const [countryOpen, setCountryOpen] = useState(false);
  
  // Use local country code for all location operations
  const activeCountryCode = localCountryCode;
  const activeCountryConfig = getCountryConfig(activeCountryCode);
  const availableCountries = getAllCountries();

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood);
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);

  // Sync with global country if no initial override was provided
  useEffect(() => {
    if (!initialCountryCode && globalCountryCode !== localCountryCode) {
      setLocalCountryCode(globalCountryCode);
    }
  }, [globalCountryCode, initialCountryCode]);

  // Handle country change
  const handleCountryChange = (newCountryCode: string) => {
    if (newCountryCode === localCountryCode) {
      setCountryOpen(false);
      return;
    }
    
    setLocalCountryCode(newCountryCode);
    // Reset city and neighborhood when country changes
    setSelectedCity("");
    setSelectedNeighborhood("");
    setCustomNeighborhood("");
    setIsCustom(false);
    setCountryOpen(false);
    
    const newCountryConfig = getCountryConfig(newCountryCode);
    toast.info(`Villes mises à jour pour ${newCountryConfig.name}`);
    
    onCountryChange?.(newCountryCode);
  };

  // Get structured location data
  const { majorCityCommunes, majorCityName, majorCityLabel, otherCities } = useMemo(() => {
    return getMainLocations(activeCountryCode);
  }, [activeCountryCode]);

  // Get neighborhoods for selected city
  const neighborhoods = useMemo(() => {
    if (!selectedCity) return [];
    return getNeighborhoodsOf(activeCountryCode, selectedCity);
  }, [activeCountryCode, selectedCity]);

  // Check if selected city is a commune of the major city
  const isCommune = useMemo(() => {
    return isMajorCityCommune(activeCountryCode, selectedCity);
  }, [activeCountryCode, selectedCity]);

  // Build and emit result
  const emitChange = useCallback((city: string, neighborhood: string, isCustomNeigh: boolean) => {
    if (!city) return;

    const parentCity = isMajorCityCommune(activeCountryCode, city) ? getMajorCityName(activeCountryCode) : undefined;
    const coords = getCoordinatesFor(activeCountryCode, city, neighborhood);
    
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
      countryCode: activeCountryCode,
    });
  }, [activeCountryCode, onAddressChange]);

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
    return getCoordinatesFor(activeCountryCode, selectedCity, selectedNeighborhood);
  }, [activeCountryCode, selectedCity, selectedNeighborhood]);

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

      {/* Sélecteur de pays (si override autorisé) */}
      {allowCountryOverride && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pays</Label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={countryOpen}
                disabled={disabled}
                className="w-full justify-between font-normal h-9"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{activeCountryConfig.flag}</span>
                  <span>{activeCountryConfig.name}</span>
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup heading="Sélectionner un pays">
                    {availableCountries.map((c) => (
                      <CommandItem
                        key={c.code}
                        value={c.code}
                        onSelect={() => handleCountryChange(c.code)}
                      >
                        <span className="mr-2 text-base">{c.flag}</span>
                        {c.name}
                        {activeCountryCode === c.code && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
