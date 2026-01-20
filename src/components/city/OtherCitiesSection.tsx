import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { CITY_PAGES, type CityPageData } from "@/data/city-pages";

interface OtherCitiesSectionProps {
  currentCity: CityPageData;
}

/**
 * Inter-city navigation section for SEO internal linking
 * Shows other cities from the same country first, then from other countries
 */
export function OtherCitiesSection({ currentCity }: OtherCitiesSectionProps) {
  // Get other cities from the same country
  const sameCityPages = Object.values(CITY_PAGES).filter(
    city => city.countryCode === currentCity.countryCode && city.slug !== currentCity.slug
  );

  // Get cities from other countries (max 4)
  const otherCountryPages = Object.values(CITY_PAGES)
    .filter(city => city.countryCode !== currentCity.countryCode)
    .slice(0, 4);

  // Don't render if no other cities
  if (sameCityPages.length === 0 && otherCountryPages.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-secondary/20">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-poppins font-semibold text-center mb-6">
          Découvrez aussi JOIE DE VIVRE dans
        </h2>
        
        {/* Same country cities */}
        {sameCityPages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Autres villes en {currentCity.country}
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {sameCityPages.map((city) => (
                <Link
                  key={city.slug}
                  to={`/${city.slug}`}
                  className="inline-flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-full text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {city.city}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other countries cities */}
        {otherCountryPages.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
              {sameCityPages.length > 0 ? 'Autres destinations' : 'Nos autres villes'}
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {otherCountryPages.map((city) => (
                <Link
                  key={city.slug}
                  to={`/${city.slug}`}
                  className="inline-flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-full text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {city.city}, {city.country}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
