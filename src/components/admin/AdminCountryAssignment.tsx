import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin } from "lucide-react";
import { COUNTRIES } from "@/config/countries";

interface AdminCountryAssignmentProps {
  selectedCountries: string[];
  onChange: (countries: string[]) => void;
  disabled?: boolean;
  showAllCountriesOption?: boolean;
  allCountriesSelected?: boolean;
  onAllCountriesChange?: (allSelected: boolean) => void;
}

const countryList = Object.values(COUNTRIES);

export function AdminCountryAssignment({
  selectedCountries,
  onChange,
  disabled = false,
  showAllCountriesOption = false,
  allCountriesSelected = false,
  onAllCountriesChange,
}: AdminCountryAssignmentProps) {
  const toggleCountry = (code: string) => {
    if (disabled) return;
    
    if (selectedCountries.includes(code)) {
      onChange(selectedCountries.filter(c => c !== code));
    } else {
      onChange([...selectedCountries, code]);
    }
  };

  const handleAllCountriesChange = (checked: boolean) => {
    if (onAllCountriesChange) {
      onAllCountriesChange(checked);
      if (checked) {
        onChange([]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Pays assignés
      </Label>
      <p className="text-xs text-muted-foreground">
        Sélectionnez les pays que cet administrateur pourra gérer
      </p>
      
      <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
        {showAllCountriesOption && (
          <div className="flex items-center space-x-2 pb-2 border-b mb-2">
            <Checkbox
              id="all-countries"
              checked={allCountriesSelected}
              onCheckedChange={handleAllCountriesChange}
              disabled={disabled}
            />
            <label
              htmlFor="all-countries"
              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
            >
              <Globe className="h-4 w-4 text-primary" />
              Tous les pays
              <Badge variant="outline" className="text-xs">Super Admin</Badge>
            </label>
          </div>
        )}
        
        {countryList.map(country => (
          <div key={country.code} className="flex items-center space-x-2">
            <Checkbox
              id={`country-${country.code}`}
              checked={allCountriesSelected || selectedCountries.includes(country.code)}
              onCheckedChange={() => toggleCountry(country.code)}
              disabled={disabled || allCountriesSelected}
            />
            <label
              htmlFor={`country-${country.code}`}
              className={`text-sm font-medium leading-none cursor-pointer flex items-center gap-2 ${
                allCountriesSelected ? 'text-muted-foreground' : ''
              }`}
            >
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
              <Badge variant="secondary" className="text-xs font-mono">
                {country.code}
              </Badge>
            </label>
          </div>
        ))}
      </div>

      {!allCountriesSelected && selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedCountries.map(code => {
            const country = COUNTRIES[code];
            return country ? (
              <Badge key={code} variant="default" className="text-xs">
                {country.flag} {country.code}
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {!allCountriesSelected && selectedCountries.length === 0 && (
        <p className="text-xs text-destructive">
          Veuillez sélectionner au moins un pays
        </p>
      )}
    </div>
  );
}
