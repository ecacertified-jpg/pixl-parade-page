import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbListSchema } from "@/components/schema";

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
 * ProductBreadcrumb - Composant réutilisable combinant SEO (Schema.org) et UI visuel
 * 
 * Affiche un fil d'Ariane pour les pages produits avec:
 * - BreadcrumbListSchema pour le SEO (données structurées JSON-LD)
 * - UI Breadcrumb visuel pour la navigation utilisateur
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
  // Construire le fil d'Ariane dynamiquement
  const breadcrumbItems = [
    { name: "Accueil", path: "/" },
    { name: "Boutique", path: "/shop" },
    ...(vendorId ? [{ name: vendorName, path: `/boutique/${vendorId}` }] : []),
    { name: productName, path: `/p/${productId}` },
  ];

  return (
    <>
      {/* SEO Schema (invisible) */}
      <BreadcrumbListSchema items={breadcrumbItems} />

      {/* UI Visuel */}
      <div className={containerClassName}>
        <Breadcrumb>
          <BreadcrumbList>
            {/* Accueil */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  {showHomeIcon && <Home className="h-3.5 w-3.5" />}
                  <span className={showHomeIcon ? "sr-only sm:not-sr-only" : ""}>
                    Accueil
                  </span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {/* Boutique */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/shop">Boutique</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {/* Vendeur (conditionnel) */}
            {vendorId && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/boutique/${vendorId}`}>{vendorName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}

            {/* Page actuelle (produit) */}
            <BreadcrumbItem>
              <BreadcrumbPage 
                className="truncate" 
                style={{ maxWidth }}
              >
                {productName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </>
  );
}
