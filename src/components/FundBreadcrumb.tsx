import { Home, Gift } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

// Labels français pour les occasions
const OCCASION_LABELS: Record<string, string> = {
  birthday: "Anniversaire",
  wedding: "Mariage",
  graduation: "Diplôme",
  baby: "Naissance",
  retirement: "Retraite",
  promotion: "Promotion",
  other: "Autre",
};

// Emojis pour les occasions
const OCCASION_EMOJIS: Record<string, string> = {
  birthday: "🎂",
  wedding: "💒",
  graduation: "🎓",
  baby: "👶",
  retirement: "🎉",
  promotion: "🚀",
  other: "🎁",
};

interface FundBreadcrumbProps {
  fundId: string;
  fundTitle: string;
  occasion?: string | null;
  showHomeIcon?: boolean;
  showFundsIcon?: boolean;
  containerClassName?: string;
  maxWidth?: string;
}

/**
 * FundBreadcrumb - Fil d'Ariane pour les pages de cagnottes collectives
 * 
 * Affiche: Accueil > Cagnottes > [Occasion] > [Titre]
 * Utilise BaseBreadcrumb pour la logique SEO + UI
 */
export function FundBreadcrumb({
  fundId,
  fundTitle,
  occasion,
  showHomeIcon = true,
  showFundsIcon = true,
  containerClassName = "max-w-lg mx-auto px-4 py-2",
  maxWidth = "150px",
}: FundBreadcrumbProps) {
  const occasionKey = occasion || "other";
  const occasionLabel = OCCASION_LABELS[occasionKey] || OCCASION_LABELS.other;
  const occasionEmoji = OCCASION_EMOJIS[occasionKey] || OCCASION_EMOJIS.other;

  const items: BreadcrumbItemConfig[] = [
    {
      label: "Accueil",
      path: "/",
      icon: showHomeIcon ? <Home className="h-3.5 w-3.5" /> : undefined,
      hideTextOnMobile: showHomeIcon,
    },
    {
      label: "Cagnottes",
      path: "/dashboard",
      icon: showFundsIcon ? <Gift className="h-3.5 w-3.5" /> : undefined,
    },
    {
      label: `${occasionEmoji} ${occasionLabel}`,
      path: `/dashboard?occasion=${occasionKey}`,
    },
    {
      label: fundTitle,
      path: `/f/${fundId}`,
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
