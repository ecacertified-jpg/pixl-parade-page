import { useMemo, useState, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AddressSelector, type AddressResult } from "@/components/AddressSelector";

export interface AddressData {
  city: string;
  neighborhood: string;
  streetAddress: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  label?: string;
  cityLabel?: string;
  neighborhoodLabel?: string;
  streetLabel?: string;
  streetPlaceholder?: string;
  countryCode?: string;
  showPreview?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  layout?: 'stacked' | 'inline';
}

export function AddressInput({
  value,
  onChange,
  label = "Adresse de livraison",
  cityLabel = "Ville / Commune",
  neighborhoodLabel = "Quartier",
  streetLabel = "Précisions (rue, repères...)",
  streetPlaceholder = "Numéro, rue, points de repère...",
  showPreview = true,
  required = false,
  disabled = false,
  className,
  layout = 'stacked',
}: AddressInputProps) {
  
  // Formater l'adresse complète
  const formatFullAddress = (city: string, neighborhood: string, street: string): string => {
    const locationParts = [neighborhood, city].filter(Boolean);
    const locationStr = locationParts.join(', ');
    const parts = [street, locationStr].filter(Boolean);
    return parts.join(', ');
  };

  // Adresse complète calculée
  const fullAddress = useMemo(() => {
    return formatFullAddress(value.city, value.neighborhood, value.streetAddress);
  }, [value.city, value.neighborhood, value.streetAddress]);

  // Gérer le changement d'adresse depuis AddressSelector
  const handleAddressChange = (result: AddressResult) => {
    const newFullAddress = formatFullAddress(result.city, result.neighborhood, value.streetAddress);
    onChange({ 
      ...value, 
      city: result.city,
      neighborhood: result.neighborhood,
      latitude: result.latitude,
      longitude: result.longitude,
      fullAddress: newFullAddress 
    });
  };

  // Gérer le changement d'adresse précise
  const handleStreetChange = (streetAddress: string) => {
    const newFullAddress = formatFullAddress(value.city, value.neighborhood, streetAddress);
    onChange({ ...value, streetAddress, fullAddress: newFullAddress });
  };

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

      {/* AddressSelector for City + Neighborhood */}
      <AddressSelector
        onAddressChange={handleAddressChange}
        initialCity={value.city}
        initialNeighborhood={value.neighborhood}
        label=""
        cityLabel={cityLabel}
        neighborhoodLabel={neighborhoodLabel}
        required={required}
        disabled={disabled}
      />

      {/* Adresse précise */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {streetLabel}
        </Label>
        <Input
          value={value.streetAddress}
          onChange={(e) => handleStreetChange(e.target.value)}
          placeholder={streetPlaceholder}
          disabled={disabled}
          className="bg-background"
        />
      </div>

      {/* Aperçu de l'adresse complète */}
      {showPreview && fullAddress && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
          <Navigation className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Adresse complète</p>
            <p className="text-sm font-medium">{fullAddress}</p>
            {value.latitude && value.longitude && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {value.latitude.toFixed(4)}° N, {Math.abs(value.longitude).toFixed(4)}° W
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressInput;
