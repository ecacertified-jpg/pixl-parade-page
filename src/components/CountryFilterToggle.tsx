import { Globe, Flag } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CountryFilterToggleProps {
  variant?: "default" | "compact";
  className?: string;
}

export function CountryFilterToggle({ variant = "default", className }: CountryFilterToggleProps) {
  const { country, showAllCountries, setShowAllCountries } = useCountry();

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-1 bg-muted/50 rounded-lg p-1", className)}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs transition-colors gap-1",
            !showAllCountries && "bg-background shadow-sm"
          )}
          onClick={() => setShowAllCountries(false)}
        >
          <span className="text-base">{country.flag}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs transition-colors gap-1",
            showAllCountries && "bg-background shadow-sm"
          )}
          onClick={() => setShowAllCountries(true)}
        >
          <Globe className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1 bg-muted/50 rounded-lg p-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs transition-colors gap-1.5",
          !showAllCountries && "bg-background shadow-sm"
        )}
        onClick={() => setShowAllCountries(false)}
      >
        <span className="text-base">{country.flag}</span>
        <span className="hidden sm:inline">Mon pays</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-3 text-xs transition-colors gap-1.5",
          showAllCountries && "bg-background shadow-sm"
        )}
        onClick={() => setShowAllCountries(true)}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">Tous</span>
      </Button>
    </div>
  );
}
