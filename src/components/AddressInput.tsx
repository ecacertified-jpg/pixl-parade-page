import { useMemo } from "react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CitySelector } from "@/components/CitySelector";

export interface AddressData {
  city: string;
  streetAddress: string;
  fullAddress: string;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  label?: string;
  cityLabel?: string;
  streetLabel?: string;
  cityPlaceholder?: string;
  streetPlaceholder?: string;
  countryCode?: string;
  showPreview?: boolean;
  required?: boolean;
  disabled?: boolean;
  allowCustomCity?: boolean;
  showRegions?: boolean;
  className?: string;
  layout?: 'stacked' | 'inline';
}

export function AddressInput({
  value,
  onChange,
  label = "Adresse de livraison",
  cityLabel = "Ville / Quartier",
  streetLabel = "Adresse précise",
  cityPlaceholder = "Sélectionner une ville...",
  streetPlaceholder = "Numéro, rue, points de repère...",
  countryCode,
  showPreview = true,
  required = false,
  disabled = false,
  allowCustomCity = true,
  showRegions = true,
  className,
  layout = 'stacked',
}: AddressInputProps) {
  
  // Formater l'adresse complète
  const formatFullAddress = (city: string, street: string): string => {
    const parts = [street, city].filter(Boolean);
    return parts.join(', ');
  };

  // Adresse complète calculée
  const fullAddress = useMemo(() => {
    return formatFullAddress(value.city, value.streetAddress);
  }, [value.city, value.streetAddress]);

  // Gérer le changement de ville
  const handleCityChange = (city: string) => {
    const newFullAddress = formatFullAddress(city, value.streetAddress);
    onChange({ ...value, city, fullAddress: newFullAddress });
  };

  // Gérer le changement d'adresse précise
  const handleStreetChange = (streetAddress: string) => {
    const newFullAddress = formatFullAddress(value.city, streetAddress);
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

      {/* Layout flexible */}
      <div className={cn(
        layout === 'inline' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'
      )}>
        {/* Sélection de ville */}
        <CitySelector
          value={value.city}
          onChange={handleCityChange}
          label={cityLabel}
          placeholder={cityPlaceholder}
          countryCode={countryCode}
          allowCustom={allowCustomCity}
          showRegions={showRegions}
          disabled={disabled}
          required={required}
        />

        {/* Adresse précise */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {streetLabel}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            value={value.streetAddress}
            onChange={(e) => handleStreetChange(e.target.value)}
            placeholder={streetPlaceholder}
            disabled={disabled}
            className="bg-background"
          />
        </div>
      </div>

      {/* Aperçu de l'adresse complète */}
      {showPreview && fullAddress && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
          <Navigation className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Adresse complète</p>
            <p className="text-sm font-medium">{fullAddress}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddressInput;
