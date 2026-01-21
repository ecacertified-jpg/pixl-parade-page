import { Home, User } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface AccountBreadcrumbProps {
  currentPage: string;
  currentPath: string;
  icon?: React.ReactNode;
}

/**
 * AccountBreadcrumb - For user account pages (Orders, Favorites, Settings, Preferences, Publications)
 * Path: Accueil > Mon compte > [Page]
 */
export function AccountBreadcrumb({ currentPage, currentPath, icon }: AccountBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: "Mon compte", 
      path: "/dashboard", 
      icon: <User className="h-3.5 w-3.5" /> 
    },
    { 
      label: currentPage, 
      path: currentPath, 
      icon, 
      isCurrent: true 
    }
  ];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/30">
      <BaseBreadcrumb 
        items={items} 
        containerClassName="max-w-4xl mx-auto px-4 py-2" 
      />
    </div>
  );
}
