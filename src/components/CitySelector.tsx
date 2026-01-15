import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCountry } from "@/contexts/CountryContext";
import { getCitiesForCountry, getCitiesGroupedByCountry } from "@/utils/countryCities";
import type { CityCoordinates, CountryCitiesGroup } from "@/utils/countryCities";
import { Badge } from "@/components/ui/badge";

interface CitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showRegions?: boolean;
  allowCustom?: boolean;
  countryCode?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showAllCountries?: boolean;
}

export function CitySelector({
  value,
  onChange,
  label = "Ville",
  placeholder = "Rechercher une ville...",
  showRegions = true,
  allowCustom = false,
  countryCode: overrideCountryCode,
  disabled = false,
  required = false,
  className,
  showAllCountries = false,
}: CitySelectorProps) {
  const { countryCode: contextCountryCode } = useCountry();
  const countryCode = overrideCountryCode || contextCountryCode;
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get cities grouped by country when showAllCountries is true
  const countryGroups = useMemo(() => {
    if (!showAllCountries) return null;
    return getCitiesGroupedByCountry(countryCode);
  }, [showAllCountries, countryCode]);

  // Get cities for a single country (original behavior)
  const cities = useMemo(() => {
    if (showAllCountries) return [];
    return getCitiesForCountry(countryCode);
  }, [countryCode, showAllCountries]);

  // Group cities by region (single country mode)
  const { majorCities, neighborhoodGroups } = useMemo(() => {
    if (showAllCountries) return { majorCities: [], neighborhoodGroups: {} };
    
    const major = cities.filter(city => !city.region);
    const neighborhoods: Record<string, CityCoordinates[]> = {};
    
    cities.filter(city => city.region).forEach(city => {
      if (!neighborhoods[city.region!]) {
        neighborhoods[city.region!] = [];
      }
      neighborhoods[city.region!].push(city);
    });
    
    return { majorCities: major, neighborhoodGroups: neighborhoods };
  }, [cities, showAllCountries]);

  // Filter for single country mode
  const filteredMajorCities = useMemo(() => {
    if (showAllCountries) return [];
    if (!searchQuery.trim()) return majorCities;
    
    const query = searchQuery.toLowerCase().trim();
    return majorCities.filter(city => 
      city.name.toLowerCase().includes(query) ||
      city.aliases.some(alias => alias.toLowerCase().includes(query))
    );
  }, [majorCities, searchQuery, showAllCountries]);

  const filteredNeighborhoods = useMemo(() => {
    if (showAllCountries) return {};
    if (!searchQuery.trim()) return neighborhoodGroups;
    
    const query = searchQuery.toLowerCase().trim();
    const filtered: Record<string, CityCoordinates[]> = {};
    
    Object.entries(neighborhoodGroups).forEach(([region, neighborhoods]) => {
      const matchingNeighborhoods = neighborhoods.filter(n =>
        n.name.toLowerCase().includes(query) ||
        n.aliases.some(alias => alias.toLowerCase().includes(query)) ||
        region.toLowerCase().includes(query)
      );
      if (matchingNeighborhoods.length > 0) {
        filtered[region] = matchingNeighborhoods;
      }
    });
    
    return filtered;
  }, [neighborhoodGroups, searchQuery, showAllCountries]);

  // Filter for multi-country mode
  const filteredCountryGroups = useMemo(() => {
    if (!showAllCountries || !countryGroups) return null;
    if (!searchQuery.trim()) return countryGroups;
    
    const query = searchQuery.toLowerCase().trim();
    
    return countryGroups.map(group => ({
      ...group,
      cities: group.cities.filter(city =>
        city.name.toLowerCase().includes(query) ||
        city.aliases.some(a => a.toLowerCase().includes(query)) ||
        group.countryName.toLowerCase().includes(query)
      )
    })).filter(group => group.cities.length > 0);
  }, [countryGroups, searchQuery, showAllCountries]);

  // Check if there are results
  const hasResults = showAllCountries
    ? (filteredCountryGroups && filteredCountryGroups.some(g => g.cities.length > 0))
    : (filteredMajorCities.length > 0 || Object.keys(filteredNeighborhoods).length > 0);

  const handleSelect = (cityName: string) => {
    onChange(cityName);
    setOpen(false);
    setSearchQuery("");
  };

  const handleCustomSelect = () => {
    if (searchQuery.trim()) {
      handleSelect(searchQuery.trim());
    }
  };

  // Helper to render cities for a country group
  const renderCountryGroup = (group: CountryCitiesGroup) => {
    const majorCitiesInGroup = group.cities.filter(c => !c.region);
    const neighborhoodsInGroup: Record<string, CityCoordinates[]> = {};
    
    if (showRegions) {
      group.cities.filter(c => c.region).forEach(city => {
        if (!neighborhoodsInGroup[city.region!]) {
          neighborhoodsInGroup[city.region!] = [];
        }
        neighborhoodsInGroup[city.region!].push(city);
      });
    }

    return (
      <CommandGroup
        key={group.countryCode}
        heading={
          <span className="flex items-center gap-2">
            <span className="text-base">{group.flag}</span>
            <span className="font-medium">{group.countryName}</span>
            {group.isUserCountry && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                Votre pays
              </Badge>
            )}
          </span>
        }
      >
        {/* Major cities */}
        {majorCitiesInGroup.map((city) => (
          <CommandItem
            key={`${group.countryCode}-${city.name}`}
            value={`${group.countryCode}-${city.name}`}
            onSelect={() => handleSelect(city.name)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4 shrink-0",
                value === city.name ? "opacity-100" : "opacity-0"
              )}
            />
            <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{city.name}</span>
          </CommandItem>
        ))}

        {/* Neighborhoods */}
        {showRegions && Object.entries(neighborhoodsInGroup).map(([region, neighborhoods]) => (
          <div key={`${group.countryCode}-${region}`} className="ml-4">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Quartiers de {region}
            </div>
            {neighborhoods.map((neighborhood) => (
              <CommandItem
                key={`${group.countryCode}-${neighborhood.name}`}
                value={`${group.countryCode}-${neighborhood.name}`}
                onSelect={() => handleSelect(neighborhood.name)}
                className="cursor-pointer pl-4"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    value === neighborhood.name ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{neighborhood.name}</span>
              </CommandItem>
            ))}
          </div>
        ))}
      </CommandGroup>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal h-10",
              !value && "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{value || placeholder}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 pointer-events-auto" 
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-10"
            />
            <CommandList className="max-h-[300px] overflow-auto">
              {!hasResults && (
                <CommandEmpty className="py-4 text-center text-sm">
                  {allowCustom && searchQuery.trim() ? (
                    <button
                      onClick={handleCustomSelect}
                      className="w-full px-4 py-2 text-left hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Utiliser "{searchQuery}"</span>
                    </button>
                  ) : (
                    <span className="text-muted-foreground">Aucune ville trouvée</span>
                  )}
                </CommandEmpty>
              )}
              
              {/* Multi-country mode */}
              {showAllCountries && filteredCountryGroups?.map(renderCountryGroup)}

              {/* Single country mode - Major cities */}
              {!showAllCountries && filteredMajorCities.length > 0 && (
                <CommandGroup heading="Villes principales">
                  {filteredMajorCities.map((city) => (
                    <CommandItem
                      key={city.name}
                      value={city.name}
                      onSelect={() => handleSelect(city.name)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === city.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{city.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Single country mode - Neighborhoods by region */}
              {!showAllCountries && showRegions && Object.entries(filteredNeighborhoods).map(([region, neighborhoods]) => (
                <CommandGroup key={region} heading={`Quartiers de ${region}`}>
                  {neighborhoods.map((neighborhood) => (
                    <CommandItem
                      key={neighborhood.name}
                      value={neighborhood.name}
                      onSelect={() => handleSelect(neighborhood.name)}
                      className="cursor-pointer pl-6"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === neighborhood.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{neighborhood.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}

              {/* Custom input option when there are results but user wants to use custom value */}
              {allowCustom && searchQuery.trim() && hasResults && (
                <CommandGroup heading="Autre">
                  <CommandItem
                    value={`custom-${searchQuery}`}
                    onSelect={handleCustomSelect}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>Utiliser "{searchQuery}"</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CitySelector;
