import { useMemo } from "react";
import { Globe } from "lucide-react";
import { CITY_PAGES, type CityPageData } from "@/data/city-pages";
import { getCountryFlag } from "@/utils/countryFlags";
import { CityNavigationCard } from "./CityNavigationCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface OtherCitiesSectionProps {
  currentCity: CityPageData;
}

/**
 * Inter-city navigation section with rich cards and responsive layout
 * Shows cities from the same country first, then from other countries
 * Mobile: swipeable carousel | Desktop: responsive grid
 */
export function OtherCitiesSection({ currentCity }: OtherCitiesSectionProps) {
  // Get cities from same country (excluding current)
  const sameCityCities = useMemo(() => 
    Object.values(CITY_PAGES).filter(
      city => city.countryCode === currentCity.countryCode && city.slug !== currentCity.slug
    ),
    [currentCity.countryCode, currentCity.slug]
  );

  // Get cities from other countries, grouped by country
  const otherCountryCities = useMemo(() => {
    const cities = Object.values(CITY_PAGES).filter(
      city => city.countryCode !== currentCity.countryCode
    );
    
    // Group by country
    const grouped = cities.reduce((acc, city) => {
      const key = city.countryCode;
      if (!acc[key]) {
        acc[key] = {
          country: city.country,
          countryCode: city.countryCode,
          cities: [],
        };
      }
      acc[key].cities.push(city);
      return acc;
    }, {} as Record<string, { country: string; countryCode: string; cities: CityPageData[] }>);
    
    return Object.values(grouped);
  }, [currentCity.countryCode]);

  // Don't render if no other cities
  if (sameCityCities.length === 0 && otherCountryCities.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-secondary/20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-poppins font-semibold">
              Découvrez JOIE DE VIVRE ailleurs
            </h2>
          </div>
          <p className="text-muted-foreground font-nunito">
            Explorez nos autres villes partenaires
          </p>
        </div>

        {/* Same Country Cities */}
        {sameCityCities.length > 0 && (
          <div className="mb-10">
            <h3 className="flex items-center gap-2 font-poppins font-medium text-lg mb-4">
              <span className="text-xl">{getCountryFlag(currentCity.countryCode)}</span>
              Autres villes en {currentCity.country}
            </h3>

            {/* Mobile: Carousel */}
            <div className="md:hidden">
              <Carousel
                opts={{
                  align: "start",
                  loop: sameCityCities.length > 2,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {sameCityCities.map((city) => (
                    <CarouselItem key={city.slug} className="pl-2 basis-[85%] sm:basis-[70%]">
                      <CityNavigationCard city={city} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {sameCityCities.length > 1 && (
                  <>
                    <CarouselPrevious className="left-0 -translate-x-1/2" />
                    <CarouselNext className="right-0 translate-x-1/2" />
                  </>
                )}
              </Carousel>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sameCityCities.map((city) => (
                <CityNavigationCard key={city.slug} city={city} />
              ))}
            </div>
          </div>
        )}

        {/* Other Countries Cities */}
        {otherCountryCities.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 font-poppins font-medium text-lg mb-4">
              <span className="text-xl">🌍</span>
              {sameCityCities.length > 0 ? 'Autres destinations' : 'Nos villes partenaires'}
            </h3>

            {otherCountryCities.map((countryGroup) => (
              <div key={countryGroup.countryCode} className="mb-6 last:mb-0">
                {/* Country sub-header (only if multiple countries) */}
                {otherCountryCities.length > 1 && (
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                    <span>{getCountryFlag(countryGroup.countryCode)}</span>
                    {countryGroup.country}
                  </h4>
                )}

                {/* Mobile: Carousel */}
                <div className="md:hidden">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: countryGroup.cities.length > 2,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2">
                      {countryGroup.cities.map((city) => (
                        <CarouselItem key={city.slug} className="pl-2 basis-[85%] sm:basis-[70%]">
                          <CityNavigationCard 
                            city={city} 
                            showCountry={otherCountryCities.length === 1}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {countryGroup.cities.length > 1 && (
                      <>
                        <CarouselPrevious className="left-0 -translate-x-1/2" />
                        <CarouselNext className="right-0 translate-x-1/2" />
                      </>
                    )}
                  </Carousel>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {countryGroup.cities.map((city) => (
                    <CityNavigationCard 
                      key={city.slug} 
                      city={city}
                      showCountry={otherCountryCities.length === 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
