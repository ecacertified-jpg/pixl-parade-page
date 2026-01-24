import { ChevronDown, Home, LocateFixed, MapPin, MapPinHouse } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

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
    isDetecting,
    detectCurrentLocation,
    setAsHomeCountry
  } = useCountry();

  if (isDetecting) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 animate-pulse",
        className
      )}>
        <LocateFixed className="h-4 w-4 text-muted-foreground animate-spin" />
        <span className="text-xs text-muted-foreground">Détection...</span>
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
            <Select value={countryCode} onValueChange={(code) => setCountryCode(code)}>
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

          {/* Detection button */}
          <Button
            variant="outline"
            size="sm"
            onClick={detectCurrentLocation}
            disabled={isDetecting}
            className="w-full gap-2"
          >
            <LocateFixed className="h-4 w-4" />
            Détecter ma position
          </Button>

          <Separator />

          {/* Home country section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Home className="h-4 w-4 text-muted-foreground" />
              Pays d'origine
            </div>
            
            {homeCountry ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span>{homeCountry.flag}</span>
                  <span>{homeCountry.name}</span>
                </div>
                {isVisiting && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCountryCode(profileCountryCode!)}
                    className="h-7 text-xs"
                  >
                    Y aller
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Non défini</p>
            )}
            
            {/* Set as home button (if visiting or no home set) */}
            {(isVisiting || !homeCountry) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={setAsHomeCountry}
                className="w-full gap-2 mt-2"
              >
                <MapPinHouse className="h-4 w-4" />
                Définir {country.flag} comme origine
              </Button>
            )}
          </div>

          <Separator />

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
