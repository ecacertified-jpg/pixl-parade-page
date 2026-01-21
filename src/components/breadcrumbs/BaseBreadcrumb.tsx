import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbListSchema } from "@/components/schema";

export interface BreadcrumbItemConfig {
  label: string;
  path: string;
  icon?: React.ReactNode;
  isCurrent?: boolean;
  hideTextOnMobile?: boolean;
}

interface BaseBreadcrumbProps {
  items: BreadcrumbItemConfig[];
  containerClassName?: string;
  maxWidth?: string;
  showSeoSchema?: boolean;
}

/**
 * BaseBreadcrumb - Composant générique combinant SEO (Schema.org) et UI visuel
 * 
 * Peut être utilisé directement ou étendu par des composants spécialisés
 * (ProductBreadcrumb, VendorBreadcrumb, etc.)
 */
export function BaseBreadcrumb({
  items,
  containerClassName = "container mx-auto px-4 py-3",
  maxWidth = "150px",
  showSeoSchema = true,
}: BaseBreadcrumbProps) {
  // Convertir les items pour le schema SEO
  const schemaItems = items.map((item) => ({
    name: item.label,
    path: item.path,
  }));

  return (
    <>
      {/* SEO Schema (invisible) */}
      {showSeoSchema && <BreadcrumbListSchema items={schemaItems} />}

      {/* UI Visuel */}
      <div className={containerClassName}>
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const showAsCurrent = item.isCurrent || isLast;

              return (
                <div key={item.path} className="contents">
                  <BreadcrumbItem>
                    {showAsCurrent ? (
                      <BreadcrumbPage
                        className="flex items-center gap-1.5 truncate"
                        style={{ maxWidth }}
                      >
                        {item.icon && (
                          <span className="flex-shrink-0">{item.icon}</span>
                        )}
                        <span className="truncate">{item.label}</span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          to={item.path}
                          className="flex items-center gap-1"
                        >
                          {item.icon}
                          <span
                            className={
                              item.hideTextOnMobile ? "sr-only sm:not-sr-only" : ""
                            }
                          >
                            {item.label}
                          </span>
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </>
  );
}
