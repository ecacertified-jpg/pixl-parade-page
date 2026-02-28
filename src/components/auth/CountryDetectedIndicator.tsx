import { MapPin } from 'lucide-react';
import { getCountryCodeByPhonePrefix, getCountryConfig } from '@/config/countries';

interface CountryDetectedIndicatorProps {
  phonePrefix: string;
}

export function CountryDetectedIndicator({ phonePrefix }: CountryDetectedIndicatorProps) {
  const countryCode = getCountryCodeByPhonePrefix(phonePrefix);
  const country = getCountryConfig(countryCode);

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
      <MapPin className="h-3 w-3 shrink-0" />
      <span>{country.flag}</span>
      <span>{country.name}</span>
    </div>
  );
}
