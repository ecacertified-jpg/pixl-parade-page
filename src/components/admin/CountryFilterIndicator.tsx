import { Globe, MapPin } from 'lucide-react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { getCountryFlag } from '@/utils/countryFlags';

interface CountryFilterIndicatorProps {
  className?: string;
}

export function CountryFilterIndicator({ className }: CountryFilterIndicatorProps) {
  const { selectedCountry, accessibleCountries, isRestricted } = useAdminCountry();

  // If no country selected and not restricted, show "all countries"
  if (!selectedCountry && !isRestricted) {
    return (
      <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
        <Globe className="h-4 w-4" />
        <span>Tous les pays</span>
      </div>
    );
  }

  // Find the selected country details
  const country = accessibleCountries.find(c => c.code === selectedCountry);

  if (!country && !selectedCountry) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
      <MapPin className="h-4 w-4" />
      <span>
        Données filtrées : {getCountryFlag(selectedCountry || '')} {country?.name || selectedCountry}
      </span>
    </div>
  );
}
