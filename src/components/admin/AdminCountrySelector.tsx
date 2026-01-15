import { Globe } from 'lucide-react';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AdminCountrySelector() {
  const { selectedCountry, setSelectedCountry, allCountries } = useAdminCountry();

  return (
    <Select
      value={selectedCountry || 'all'}
      onValueChange={(value) => setSelectedCountry(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[180px] h-9 text-sm">
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-lg">{allCountries.find(c => c.code === selectedCountry)?.flag}</span>
              <SelectValue />
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <SelectValue placeholder="Tous les pays" />
            </>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Tous les pays</span>
          </div>
        </SelectItem>
        {allCountries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
