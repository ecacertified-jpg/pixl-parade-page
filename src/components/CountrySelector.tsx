import { useEffect, useRef } from "react";
import { useCountry } from "@/contexts/CountryContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

const WELCOMED_KEY = "joiedevivre_country_welcomed";

interface CountrySelectorProps {
  variant?: "default" | "compact" | "minimal";
  className?: string;
  showWelcomeToast?: boolean;
}

export function CountrySelector({ 
  variant = "default", 
  className = "",
  showWelcomeToast = true 
}: CountrySelectorProps) {
  const { countryCode, setCountryCode, allCountries, country, isDetecting, wasAutoDetected } = useCountry();
  const hasShownWelcome = useRef(false);

  // Show welcome toast when country is auto-detected
  useEffect(() => {
    if (showWelcomeToast && wasAutoDetected && !hasShownWelcome.current) {
      const alreadyWelcomed = localStorage.getItem(WELCOMED_KEY);
      
      if (!alreadyWelcomed) {
        hasShownWelcome.current = true;
        
        // Small delay for better UX
        setTimeout(() => {
          toast.success(`Bienvenue depuis ${country.flag} ${country.name} !`, {
            description: "Vous pouvez changer de pays à tout moment.",
            duration: 5000,
          });
          localStorage.setItem(WELCOMED_KEY, 'true');
        }, 500);
      }
    }
  }, [wasAutoDetected, country, showWelcomeToast]);

  // Show loading state during detection
  if (isDetecting) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Détection...</span>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={() => {
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
