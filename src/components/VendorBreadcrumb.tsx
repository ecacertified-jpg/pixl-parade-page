import { Link } from "react-router-dom";
import { Home, Store } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbListSchema } from "@/components/schema";

interface VendorBreadcrumbProps {
  vendorId: string;
  vendorName: string;
  maxWidth?: string;
  showHomeIcon?: boolean;
  showVendorIcon?: boolean;
  containerClassName?: string;
}

/**
 * VendorBreadcrumb - Composant réutilisable combinant SEO (Schema.org) et UI visuel
 * 
 * Affiche un fil d'Ariane pour les pages boutique/vendeur avec:
 * - BreadcrumbListSchema pour le SEO (données structurées JSON-LD)
 * - UI Breadcrumb visuel pour la navigation utilisateur
 */
export function VendorBreadcrumb({
  vendorId,
  vendorName,
  maxWidth = "150px",
  showHomeIcon = true,
  showVendorIcon = false,
  containerClassName = "max-w-md mx-auto px-4 py-2",
}: VendorBreadcrumbProps) {
  // Construire le fil d'Ariane
  const breadcrumbItems = [
    { name: "Accueil", path: "/" },
    { name: "Boutique", path: "/shop" },
    { name: vendorName, path: `/boutique/${vendorId}` },
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

            {/* Boutique (Shop) */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/shop">Boutique</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            {/* Page actuelle (vendeur) */}
            <BreadcrumbItem>
              <BreadcrumbPage 
                className="flex items-center gap-1.5 truncate" 
                style={{ maxWidth }}
              >
                {showVendorIcon && <Store className="h-3.5 w-3.5 flex-shrink-0" />}
                <span className="truncate">{vendorName}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </>
  );
}
