import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Store, Gift, Users, ArrowRight, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbListSchema } from "@/components/schema/SchemaOrg";
import { CITY_PAGES, type CityPageData } from "@/data/city-pages";
import { CityMapSection } from "@/components/city/CityMapSection";
import { CountryFilterBar } from "@/components/city/CountryFilterBar";

const COUNTRY_FLAGS: Record<string, string> = {
  CI: "🇨🇮",
  BJ: "🇧🇯",
  SN: "🇸🇳",
};

export default function CitiesOverview() {
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const cities = useMemo(() => Object.values(CITY_PAGES), []);

  const filteredCities = useMemo(() => {
    if (selectedCountry === "all") return cities;
    return cities.filter(city => city.countryCode === selectedCountry);
  }, [cities, selectedCountry]);

  const globalStats = useMemo(() => {
    const parseNumber = (str: string) => parseInt(str.replace(/[^0-9]/g, ""), 10) || 0;
    
    return {
      totalCities: cities.length,
      totalCountries: new Set(cities.map(c => c.countryCode)).size,
      totalBusinesses: cities.reduce((acc, city) => acc + parseNumber(city.stats.businesses), 0),
      totalGifts: cities.reduce((acc, city) => acc + parseNumber(city.stats.gifts), 0),
      totalUsers: cities.reduce((acc, city) => acc + parseNumber(city.stats.users), 0),
    };
  }, [cities]);

  const breadcrumbItems = [
    { name: "Accueil", path: "/" },
    { name: "Nos Villes", path: "/villes" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Nos Villes | JOIE DE VIVRE - Cadeaux Collaboratifs en Afrique"
        description={`Découvrez les ${globalStats.totalCities} villes couvertes par JOIE DE VIVRE en Côte d'Ivoire, Bénin et Sénégal. Boutiques locales, cadeaux collectifs et livraison dans toutes les communes.`}
        keywords="villes JOIE DE VIVRE, cadeaux Afrique, cagnotte Abidjan, cagnotte Dakar, cadeaux Cotonou, boutiques locales Afrique"
        url="https://joiedevivre-africa.com/villes"
      />
      <BreadcrumbListSchema items={breadcrumbItems} />

      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-poppins text-foreground">
                Nos Villes
              </h1>
              <p className="text-muted-foreground">
                {globalStats.totalCities} villes dans {globalStats.totalCountries} pays
              </p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Explorez les villes couvertes par JOIE DE VIVRE. Découvrez les boutiques locales, 
            créez des cagnottes et célébrez les moments de joie partout en Afrique francophone.
          </p>
        </div>
      </header>

      {/* Map Section */}
      <CityMapSection 
        cities={filteredCities} 
        hoveredCity={hoveredCity}
        onCityHover={setHoveredCity}
      />

      {/* Country Filter */}
      <CountryFilterBar 
        selectedCountry={selectedCountry} 
        onCountryChange={setSelectedCountry}
        cityCounts={{
          all: cities.length,
          CI: cities.filter(c => c.countryCode === "CI").length,
          BJ: cities.filter(c => c.countryCode === "BJ").length,
          SN: cities.filter(c => c.countryCode === "SN").length,
        }}
      />

      {/* Global Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{globalStats.totalCities}</p>
              <p className="text-sm text-muted-foreground">Villes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/50 to-secondary border-secondary/50">
            <CardContent className="p-4 text-center">
              <Store className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{globalStats.totalBusinesses}+</p>
              <p className="text-sm text-muted-foreground">Boutiques</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/20 border-accent/20">
            <CardContent className="p-4 text-center">
              <Gift className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">{globalStats.totalGifts}+</p>
              <p className="text-sm text-muted-foreground">Cadeaux</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-heart/10 to-heart/20 border-heart/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-heart" />
              <p className="text-2xl font-bold text-foreground">{globalStats.totalUsers}+</p>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold font-poppins mb-6 text-foreground">
          {selectedCountry === "all" ? "Toutes les villes" : `Villes en ${selectedCountry === "CI" ? "Côte d'Ivoire" : selectedCountry === "BJ" ? "Bénin" : "Sénégal"}`}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCities.map((city) => (
            <CityCard 
              key={city.slug} 
              city={city} 
              isHovered={hoveredCity === city.slug}
              onHover={() => setHoveredCity(city.slug)}
              onLeave={() => setHoveredCity(null)}
            />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold font-poppins mb-4">
            Votre ville n'est pas encore couverte ?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Nous nous développons rapidement en Afrique francophone. 
            Inscrivez-vous et nous vous préviendrons dès que nous arrivons chez vous !
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="font-semibold">
              Créer mon compte
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

interface CityCardProps {
  city: CityPageData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function CityCard({ city, isHovered, onHover, onLeave }: CityCardProps) {
  const flag = COUNTRY_FLAGS[city.countryCode] || "🌍";

  return (
    <Link to={`/${city.slug}`}>
      <Card 
        className={`h-full transition-all duration-200 cursor-pointer group ${
          isHovered ? "border-primary shadow-lg scale-[1.02]" : "hover:border-primary/50 hover:shadow-md"
        }`}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{flag}</span>
              <CardTitle className="text-lg font-poppins">{city.city}</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {city.countryCode}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {city.population} habitants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Store className="w-4 h-4" />
              <span>{city.stats.businesses} boutiques</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Gift className="w-4 h-4" />
              <span>{city.stats.gifts}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {city.neighborhoods.slice(0, 3).map((neighborhood) => (
              <Badge key={neighborhood} variant="outline" className="text-xs">
                {neighborhood}
              </Badge>
            ))}
            {city.neighborhoods.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{city.neighborhoods.length - 3}
              </Badge>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            Découvrir <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
