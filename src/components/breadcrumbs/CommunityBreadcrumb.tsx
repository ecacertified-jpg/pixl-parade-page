import { Home, Users } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

/**
 * CommunityBreadcrumb - For the community page
 * Path: Accueil > Communauté
 */
export function CommunityBreadcrumb() {
  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: "Communauté", 
      path: "/community", 
      icon: <Users className="h-3.5 w-3.5" />, 
      isCurrent: true 
    }
  ];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/30">
      <BaseBreadcrumb 
        items={items} 
        containerClassName="max-w-md mx-auto px-4 py-2" 
      />
    </div>
  );
}
