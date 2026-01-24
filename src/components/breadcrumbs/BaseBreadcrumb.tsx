import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
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
  label: string;           // Label affiché dans l'UI (peut contenir des emojis)
  seoLabel?: string;       // Label pour le Schema SEO (sans emojis, optionnel)
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

const separatorVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2 },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -45 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
};

// Reduced motion variants (no animations)
const noMotionVariants = {
  hidden: {},
  visible: {},
};

/**
 * BaseBreadcrumb - Composant générique combinant SEO (Schema.org) et UI visuel
 * avec animations Framer Motion subtiles
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
  const shouldReduceMotion = useReducedMotion();

  // Use empty variants if user prefers reduced motion
  const activeContainerVariants = shouldReduceMotion ? noMotionVariants : containerVariants;
  const activeItemVariants = shouldReduceMotion ? noMotionVariants : itemVariants;
  const activeSeparatorVariants = shouldReduceMotion ? noMotionVariants : separatorVariants;
  const activeIconVariants = shouldReduceMotion ? noMotionVariants : iconVariants;

  // Convertir les items pour le schema SEO (utiliser seoLabel si disponible, sans emojis)
  const schemaItems = items.map((item) => ({
    name: item.seoLabel || item.label,
    path: item.path,
  }));

  return (
    <>
      {/* SEO Schema (invisible) */}
      {showSeoSchema && <BreadcrumbListSchema items={schemaItems} />}

      {/* UI Visuel avec animations */}
      <motion.div
        className={containerClassName}
        initial="hidden"
        animate="visible"
        variants={activeContainerVariants}
      >
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const showAsCurrent = item.isCurrent || isLast;

              return (
                <div key={item.path} className="contents">
                  <motion.div variants={activeItemVariants} className="contents">
                    <BreadcrumbItem>
                      {showAsCurrent ? (
                        <BreadcrumbPage
                          className="flex items-center gap-1.5 truncate"
                          style={{ maxWidth }}
                        >
                          {item.icon && (
                            <motion.span
                              className="flex-shrink-0"
                              variants={activeIconVariants}
                            >
                              {item.icon}
                            </motion.span>
                          )}
                          <span className="truncate">{item.label}</span>
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            to={item.path}
                            className="flex items-center gap-1 transition-colors duration-200 hover:text-primary"
                          >
                            <motion.span
                              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                              className="flex items-center gap-1"
                            >
                              {item.icon && (
                                <motion.span variants={activeIconVariants}>
                                  {item.icon}
                                </motion.span>
                              )}
                              <span
                                className={
                                  item.hideTextOnMobile ? "sr-only sm:not-sr-only" : ""
                                }
                              >
                                {item.label}
                              </span>
                            </motion.span>
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </motion.div>
                  {!isLast && (
                    <motion.div variants={activeSeparatorVariants} className="contents">
                      <BreadcrumbSeparator />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>
    </>
  );
}
