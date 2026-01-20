import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Package, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCityBusinesses } from "@/hooks/useCityBusinesses";
import type { CityPageData } from "@/data/city-pages";

interface LocalShopsSectionProps {
  city: CityPageData;
}

/**
 * Displays local shops for a city with internal links
 * Part of the SEO internal linking strategy
 */
export function LocalShopsSection({ city }: LocalShopsSectionProps) {
  const { businesses, loading } = useCityBusinesses(city.city, city.countryCode);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </section>
    );
  }

  // Placeholder when no shops are available yet
  if (businesses.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Store className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <h2 className="text-2xl font-poppins font-semibold mb-4">
            Boutiques à {city.city}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Nos artisans partenaires arrivent bientôt à {city.city} ! 
            Soyez parmi les premiers à rejoindre notre réseau.
          </p>
          <Button asChild variant="outline">
            <Link to="/business-registration">
              Devenir partenaire à {city.city}
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-poppins font-semibold">
              Boutiques à {city.city}
            </h2>
            <p className="text-muted-foreground">
              Découvrez nos artisans partenaires locaux
            </p>
          </div>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/shop">
              Voir toutes les boutiques <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((shop) => (
            <Link key={shop.id} to={`/boutique/${shop.id}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="w-14 h-14 flex-shrink-0">
                    <AvatarImage src={shop.logo_url || ''} alt={shop.business_name} />
                    <AvatarFallback className="bg-primary/10">
                      <Store className="w-6 h-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{shop.business_name}</h3>
                    {shop.business_type && (
                      <p className="text-sm text-muted-foreground truncate">
                        {shop.business_type}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Package className="w-3 h-3" />
                      <span>{shop.productCount} produit{shop.productCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA for vendors */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-3">
            Vous êtes artisan à {city.city} ?
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/business-registration">
              Rejoindre notre réseau
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
