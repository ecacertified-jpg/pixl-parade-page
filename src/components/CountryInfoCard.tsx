import { useCountry } from "@/contexts/CountryContext";
import { getMajorCities } from "@/utils/countryCities";
import { CountrySelector } from "@/components/CountrySelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Phone, 
  Building2, 
  MapPin, 
  CreditCard,
  Landmark,
  type LucideIcon
} from "lucide-react";

interface CountryInfoCardProps {
  variant?: "default" | "compact" | "detailed";
  showSelector?: boolean;
  showCities?: boolean;
  showPaymentMethods?: boolean;
  className?: string;
}

// Sous-composant pour les tuiles d'info
function InfoTile({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: LucideIcon; 
  label: string; 
  value: string; 
}) {
  return (
    <div className="flex flex-col items-center p-3 bg-background/60 dark:bg-muted/40 
      rounded-lg border border-primary/10 dark:border-primary/20">
      <Icon className="h-5 w-5 text-primary mb-1" />
      <span className="font-semibold text-sm truncate max-w-full">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function CountryInfoCard({ 
  variant = "default",
  showSelector = false,
  showCities = true,
  showPaymentMethods = true,
  className = ""
}: CountryInfoCardProps) {
  const { country, countryCode } = useCountry();
  const majorCities = getMajorCities(countryCode);

  // Version compact - juste le drapeau et le nom
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg ${className}`}>
        <span className="text-2xl">{country.flag}</span>
        <div>
          <span className="font-medium">{country.name}</span>
          <span className="text-sm text-muted-foreground ml-2">
            {country.currencySymbol}
          </span>
        </div>
      </div>
    );
  }

  // Déterminer la région (simplifiée pour l'instant)
  const getRegion = () => {
    return "Afrique de l'Ouest";
  };

  return (
    <Card className={`bg-gradient-to-br from-primary/5 to-accent/5 
      dark:from-primary/10 dark:to-accent/10 border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{country.flag}</span>
            <div>
              <CardTitle className="text-xl font-poppins">{country.name}</CardTitle>
              <CardDescription>{getRegion()}</CardDescription>
            </div>
          </div>
          {showSelector && (
            <CountrySelector variant="compact" showWelcomeToast={false} />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Grille d'informations principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InfoTile icon={Coins} label="Devise" value={country.currencySymbol} />
          <InfoTile icon={Phone} label="Préfixe" value={country.phonePrefix} />
          <InfoTile icon={Landmark} label="Capitale" value={country.capital} />
          <InfoTile icon={Building2} label="Économique" value={country.economicCapital} />
        </div>
        
        {/* Villes principales (si detailed ou showCities) */}
        {(variant === "detailed" || showCities) && majorCities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Villes principales</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {majorCities.slice(0, 5).map((city) => (
                <Badge key={city.name} variant="secondary" className="text-xs">
                  {city.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Modes de paiement (si detailed ou showPaymentMethods) */}
        {(variant === "detailed" || showPaymentMethods) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Modes de paiement</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {country.mobileMoneyProviders.map((provider) => (
                <Badge key={provider} variant="outline" className="text-xs">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
