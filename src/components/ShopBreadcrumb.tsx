import { Home, ShoppingBag } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface ShopBreadcrumbProps {
  showHomeIcon?: boolean;
  showShopIcon?: boolean;
  containerClassName?: string;
}

/**
 * ShopBreadcrumb - Fil d'Ariane pour la page boutique principale
 * 
 * Affiche: Accueil > Boutique
 * Utilise BaseBreadcrumb pour la logique SEO + UI
 */
export function ShopBreadcrumb({
  showHomeIcon = true,
  showShopIcon = false,
  containerClassName = "max-w-md mx-auto px-4 py-2",
}: ShopBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    {
      label: "Accueil",
      path: "/",
      icon: showHomeIcon ? <Home className="h-3.5 w-3.5" /> : undefined,
      hideTextOnMobile: showHomeIcon,
    },
    {
      label: "Boutique",
      path: "/shop",
      icon: showShopIcon ? <ShoppingBag className="h-3.5 w-3.5" /> : undefined,
      isCurrent: true,
    },
  ];

  return (
    <BaseBreadcrumb
      items={items}
      containerClassName={containerClassName}
    />
  );
}
