import { Home } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface ProductBreadcrumbProps {
  productId: string;
  productName: string;
  vendorId?: string | null;
  vendorName?: string;
  maxWidth?: string;
  showHomeIcon?: boolean;
  containerClassName?: string;
}

/**
 * ProductBreadcrumb - Fil d'Ariane pour les pages produits
 * 
 * Affiche: Accueil > Boutique > [Vendeur] > Produit
 * Utilise BaseBreadcrumb pour la logique SEO + UI
 */
export function ProductBreadcrumb({
  productId,
  productName,
  vendorId,
  vendorName = "Vendeur",
  maxWidth = "150px",
  showHomeIcon = true,
  containerClassName = "container mx-auto px-4 py-3 max-w-2xl",
}: ProductBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    {
      label: "Accueil",
      path: "/",
      icon: showHomeIcon ? <Home className="h-3.5 w-3.5" /> : undefined,
      hideTextOnMobile: showHomeIcon,
    },
    { label: "Boutique", path: "/shop" },
    ...(vendorId
      ? [{ label: vendorName, path: `/boutique/${vendorId}` }]
      : []),
    { label: productName, path: `/p/${productId}`, isCurrent: true },
  ];

  return (
    <BaseBreadcrumb
      items={items}
      containerClassName={containerClassName}
      maxWidth={maxWidth}
    />
  );
}
