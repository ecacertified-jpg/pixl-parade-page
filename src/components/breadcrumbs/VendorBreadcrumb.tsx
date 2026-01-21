import { Home, Store } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface VendorBreadcrumbProps {
  vendorId: string;
  vendorName: string;
  maxWidth?: string;
  showHomeIcon?: boolean;
  showVendorIcon?: boolean;
  containerClassName?: string;
}

/**
 * VendorBreadcrumb - Fil d'Ariane pour les pages boutique/vendeur
 * 
 * Affiche: Accueil > Boutique > Vendeur
 * Utilise BaseBreadcrumb pour la logique SEO + UI
 */
export function VendorBreadcrumb({
  vendorId,
  vendorName,
  maxWidth = "150px",
  showHomeIcon = true,
  showVendorIcon = false,
  containerClassName = "max-w-md mx-auto px-4 py-2",
}: VendorBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    {
      label: "Accueil",
      path: "/",
      icon: showHomeIcon ? <Home className="h-3.5 w-3.5" /> : undefined,
      hideTextOnMobile: showHomeIcon,
    },
    { label: "Boutique", path: "/shop" },
    {
      label: vendorName,
      path: `/boutique/${vendorId}`,
      icon: showVendorIcon ? <Store className="h-3.5 w-3.5" /> : undefined,
      isCurrent: true,
    },
  ];

  return (
    <BaseBreadcrumb
      items={items}
      containerClassName={containerClassName}
      maxWidth={maxWidth}
    />
  );
}
