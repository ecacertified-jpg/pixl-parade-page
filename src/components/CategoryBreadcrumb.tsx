import { Home, Tag } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface CategoryBreadcrumbProps {
  categorySlug: string;
  categoryName: string;
  categoryIcon?: React.ReactNode;
  showHomeIcon?: boolean;
  showCategoryIcon?: boolean;
  containerClassName?: string;
}

/**
 * CategoryBreadcrumb - Fil d'Ariane pour les pages de catégories produits
 * 
 * Affiche: Accueil > Boutique > [Catégorie]
 * Utilise BaseBreadcrumb pour la logique SEO + UI
 */
export function CategoryBreadcrumb({
  categorySlug,
  categoryName,
  categoryIcon,
  showHomeIcon = true,
  showCategoryIcon = true,
  containerClassName = "max-w-md mx-auto px-4 py-2",
}: CategoryBreadcrumbProps) {
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
    },
    {
      label: categoryName,
      path: `/shop?category=${encodeURIComponent(categorySlug)}`,
      icon: showCategoryIcon 
        ? (categoryIcon || <Tag className="h-3.5 w-3.5" />) 
        : undefined,
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
