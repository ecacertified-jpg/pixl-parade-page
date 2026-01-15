import { Badge } from "@/components/ui/badge";
import { getCountryConfig, isValidCountryCode } from "@/config/countries";
import { cn } from "@/lib/utils";

interface CountryBadgeProps {
  countryCode: string | null | undefined;
  variant?: "default" | "compact" | "minimal";
  className?: string;
}

export function CountryBadge({ 
  countryCode, 
  variant = "default",
  className 
}: CountryBadgeProps) {
  // Si pas de code pays ou code invalide, ne rien afficher
  if (!countryCode || !isValidCountryCode(countryCode)) {
    return null;
  }

  const country = getCountryConfig(countryCode);

  // Version minimale - juste le drapeau
  if (variant === "minimal") {
    return (
      <span className={cn("text-base", className)} title={country.name}>
        {country.flag}
      </span>
    );
  }

  // Version compacte - drapeau + code
  if (variant === "compact") {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs px-1.5 py-0 h-5 gap-1 bg-background/80 border-border/50",
          className
        )}
      >
        <span>{country.flag}</span>
        <span className="font-normal">{country.code}</span>
      </Badge>
    );
  }

  // Version par défaut - drapeau + nom
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "text-xs px-2 py-0.5 gap-1.5",
        className
      )}
    >
      <span>{country.flag}</span>
      <span>{country.name}</span>
    </Badge>
  );
}
