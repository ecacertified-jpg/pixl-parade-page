import { Button } from "@/components/ui/button";

interface CountryFilterBarProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  cityCounts: Record<string, number>;
}

const COUNTRIES = [
  { code: "all", label: "Tous les pays", flag: "🌍" },
  { code: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "BJ", label: "Bénin", flag: "🇧🇯" },
  { code: "SN", label: "Sénégal", flag: "🇸🇳" },
];

export function CountryFilterBar({ selectedCountry, onCountryChange, cityCounts }: CountryFilterBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {COUNTRIES.map((country) => {
            const count = cityCounts[country.code] || 0;
            const isSelected = selectedCountry === country.code;
            
            return (
              <Button
                key={country.code}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onCountryChange(country.code)}
                className="gap-2"
              >
                <span>{country.flag}</span>
                <span className="hidden sm:inline">{country.label}</span>
                <span className="sm:hidden">{country.code === "all" ? "Tous" : country.code}</span>
                <span className="text-xs opacity-70">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
