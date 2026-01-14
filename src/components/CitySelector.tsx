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
import { getCitiesForCountry } from "@/utils/countryCities";
import type { CityCoordinates } from "@/utils/countryCities";

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
}: CitySelectorProps) {
  const { countryCode: contextCountryCode } = useCountry();
  const countryCode = overrideCountryCode || contextCountryCode;
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get cities for the country
  const cities = useMemo(() => {
    return getCitiesForCountry(countryCode);
  }, [countryCode]);

  // Group cities by region
  const { majorCities, neighborhoodGroups } = useMemo(() => {
    const major = cities.filter(city => !city.region);
    const neighborhoods: Record<string, CityCoordinates[]> = {};
    
    cities.filter(city => city.region).forEach(city => {
      if (!neighborhoods[city.region!]) {
        neighborhoods[city.region!] = [];
      }
      neighborhoods[city.region!].push(city);
    });
    
    return { majorCities: major, neighborhoodGroups: neighborhoods };
  }, [cities]);

  // Filter cities based on search query
  const filteredMajorCities = useMemo(() => {
    if (!searchQuery.trim()) return majorCities;
    
    const query = searchQuery.toLowerCase().trim();
    return majorCities.filter(city => 
      city.name.toLowerCase().includes(query) ||
      city.aliases.some(alias => alias.toLowerCase().includes(query))
    );
  }, [majorCities, searchQuery]);

  const filteredNeighborhoods = useMemo(() => {
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
  }, [neighborhoodGroups, searchQuery]);

  const hasResults = filteredMajorCities.length > 0 || Object.keys(filteredNeighborhoods).length > 0;

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
              
              {/* Major cities */}
              {filteredMajorCities.length > 0 && (
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

              {/* Neighborhoods by region */}
              {showRegions && Object.entries(filteredNeighborhoods).map(([region, neighborhoods]) => (
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
