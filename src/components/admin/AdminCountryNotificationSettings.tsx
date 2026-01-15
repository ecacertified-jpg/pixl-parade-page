import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe } from 'lucide-react';
import { COUNTRIES, type CountryConfig } from '@/config/countries';

interface AdminCountryNotificationSettingsProps {
  selectedCountries: string[] | null;
  onCountriesChange: (countries: string[] | null) => void;
}

export function AdminCountryNotificationSettings({
  selectedCountries,
  onCountriesChange,
}: AdminCountryNotificationSettingsProps) {
  const [monitorAll, setMonitorAll] = useState(!selectedCountries || selectedCountries.length === 0);

  useEffect(() => {
    setMonitorAll(!selectedCountries || selectedCountries.length === 0);
  }, [selectedCountries]);

  const handleMonitorAllChange = (checked: boolean) => {
    setMonitorAll(checked);
    if (checked) {
      // Null means all countries
      onCountriesChange(null);
    } else {
      // When unchecking "all", select all countries individually
      onCountriesChange(Object.keys(COUNTRIES));
    }
  };

  const handleCountryChange = (countryCode: string, checked: boolean) => {
    if (monitorAll) return;

    const currentCountries = selectedCountries || Object.keys(COUNTRIES);
    
    if (checked) {
      onCountriesChange([...currentCountries, countryCode]);
    } else {
      const newCountries = currentCountries.filter(c => c !== countryCode);
      // Don't allow empty selection - at least one country must be selected
      if (newCountries.length > 0) {
        onCountriesChange(newCountries);
      }
    }
  };

  const isCountrySelected = (countryCode: string): boolean => {
    if (monitorAll) return true;
    return selectedCountries?.includes(countryCode) ?? false;
  };

  return (
    <div className="space-y-4">
      {/* Monitor all switch */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <Label htmlFor="monitor_all" className="font-medium cursor-pointer">
              Surveiller tous les pays
            </Label>
            <p className="text-xs text-muted-foreground">
              Recevoir les notifications de tous les pays sans filtre
            </p>
          </div>
        </div>
        <Switch
          id="monitor_all"
          checked={monitorAll}
          onCheckedChange={handleMonitorAllChange}
        />
      </div>

      {/* Individual country selection */}
      <div className={`space-y-3 ${monitorAll ? 'opacity-50 pointer-events-none' : ''}`}>
        <p className="text-sm text-muted-foreground">
          Ou sélectionnez les pays à surveiller :
        </p>
        
        <div className="grid gap-3">
          {(Object.entries(COUNTRIES) as [string, CountryConfig][]).map(([code, country]) => (
            <div
              key={code}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={`country_${code}`}
                checked={isCountrySelected(code)}
                onCheckedChange={(checked) => handleCountryChange(code, checked === true)}
                disabled={monitorAll}
              />
              <Label
                htmlFor={`country_${code}`}
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <span className="text-lg">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
                <span className="text-xs text-muted-foreground">({code})</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {!monitorAll && selectedCountries && selectedCountries.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {selectedCountries.length} pays sélectionné{selectedCountries.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
