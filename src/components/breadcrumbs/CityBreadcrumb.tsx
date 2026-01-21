import { Home, Globe, MapPin } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface CityBreadcrumbProps {
  cityName?: string;
  citySlug?: string;
  isList?: boolean;
}

/**
 * CityBreadcrumb - For city pages and cities overview
 * Path: Accueil > Villes (for list)
 * Path: Accueil > Villes > [City] (for detail)
 */
export function CityBreadcrumb({ cityName, citySlug, isList = false }: CityBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: "Villes", 
      path: "/cities", 
      icon: <Globe className="h-3.5 w-3.5" />,
      isCurrent: isList
    }
  ];

  if (!isList && cityName && citySlug) {
    items.push({ 
      label: cityName, 
      path: `/${citySlug}`, 
      icon: <MapPin className="h-3.5 w-3.5" />, 
      isCurrent: true 
    });
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/30">
      <BaseBreadcrumb 
        items={items} 
        containerClassName="container mx-auto px-4 py-2" 
      />
    </div>
  );
}
