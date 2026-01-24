import { ChevronDown, Home, MapPin } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { getCountryConfig } from "@/config/countries";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CountryBadgeHeaderProps {
  className?: string;
}

export function CountryBadgeHeader({ className }: CountryBadgeHeaderProps) {
  const { 
    country, 
    countryCode,
    setCountryCode,
    allCountries, 
    isVisiting, 
    profileCountryCode,
    isDetecting 
  } = useCountry();

  if (isDetecting) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 animate-pulse",
        className
      )}>
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">...</span>
      </div>
    );
  }

  const homeCountry = profileCountryCode ? getCountryConfig(profileCountryCode) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
            "bg-muted/50 hover:bg-muted transition-colors",
            "border border-border/30",
            className
          )}
        >
          <span className="text-lg leading-none">{country.flag}</span>
          {isVisiting && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              En visite
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          {/* Current location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Vous naviguez depuis
            </div>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCountries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <div className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Home country link when visiting */}
          {isVisiting && homeCountry && (
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>Votre pays d'origine</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCountryCode(profileCountryCode!)}
                  className="h-8 gap-1.5"
                >
                  <span>{homeCountry.flag}</span>
                  <span className="text-xs">{homeCountry.name}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            Le contenu local (boutiques, expériences) s'adapte à votre pays.
            Vos amis restent visibles peu importe leur localisation.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
