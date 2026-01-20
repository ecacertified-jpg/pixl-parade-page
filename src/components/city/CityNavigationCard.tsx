import { Link } from "react-router-dom";
import { Store, Gift, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCountryFlag } from "@/utils/countryFlags";
import type { CityPageData } from "@/data/city-pages";

interface CityNavigationCardProps {
  city: CityPageData;
  showCountry?: boolean;
}

/**
 * Rich city card component for inter-city navigation
 * Displays city info, stats, and popular neighborhoods
 */
export function CityNavigationCard({ city, showCountry = false }: CityNavigationCardProps) {
  const flag = getCountryFlag(city.countryCode);

  // Format population for display
  const formatPopulation = (pop: string): string => {
    const num = parseInt(pop.replace(/\D/g, ''));
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M hab.`;
    }
    if (num >= 1000) {
      return `${Math.round(num / 1000)}K hab.`;
    }
    return `${pop} hab.`;
  };

  return (
    <Link 
      to={`/${city.slug}`}
      className="block group"
      aria-label={`Découvrir JOIE DE VIVRE à ${city.city}, ${city.country}`}
    >
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label={`Drapeau ${city.country}`}>
              {flag}
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-poppins truncate group-hover:text-primary transition-colors">
                {city.city}
              </CardTitle>
              {showCountry && (
                <CardDescription className="truncate">
                  {city.country}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Population */}
          <p className="text-sm text-muted-foreground font-nunito">
            {formatPopulation(city.population)}
          </p>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Store className="w-4 h-4 text-primary" />
              <span className="font-medium">{city.stats.businesses}+</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Gift className="w-4 h-4 text-gift" />
              <span className="font-medium">{city.stats.gifts}+</span>
            </span>
          </div>

          {/* Neighborhoods */}
          {city.neighborhoods && city.neighborhoods.length > 0 && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {city.neighborhoods.slice(0, 3).map((neighborhood) => (
                  <Badge 
                    key={neighborhood} 
                    variant="secondary" 
                    className="text-xs font-normal"
                  >
                    {neighborhood}
                  </Badge>
                ))}
                {city.neighborhoods.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{city.neighborhoods.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pt-1">
            <span className="text-sm text-primary font-medium group-hover:underline">
              Découvrir →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
