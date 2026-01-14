import { useCountry } from "@/contexts/CountryContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface CountrySelectorProps {
  variant?: "default" | "compact" | "minimal";
  className?: string;
}

export function CountrySelector({ variant = "default", className = "" }: CountrySelectorProps) {
  const { countryCode, setCountryCode, allCountries, country } = useCountry();

  if (variant === "minimal") {
    return (
      <button
        onClick={() => {
          // Toggle between countries
          const currentIndex = allCountries.findIndex(c => c.code === countryCode);
          const nextIndex = (currentIndex + 1) % allCountries.length;
          setCountryCode(allCountries[nextIndex].code);
        }}
        className={`flex items-center gap-1 text-sm hover:opacity-80 transition-opacity ${className}`}
        title={`Changer de pays (actuel: ${country.name})`}
      >
        <span className="text-lg">{country.flag}</span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <Select value={countryCode} onValueChange={setCountryCode}>
        <SelectTrigger className={`w-auto gap-2 ${className}`}>
          <span className="text-lg">{country.flag}</span>
        </SelectTrigger>
        <SelectContent>
          {allCountries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.flag}</span>
                <span>{c.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={countryCode} onValueChange={setCountryCode}>
      <SelectTrigger className={`w-[200px] ${className}`}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Sélectionner un pays" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {allCountries.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{c.flag}</span>
              <span>{c.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
