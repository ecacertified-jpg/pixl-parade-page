import { Home, Heart } from "lucide-react";
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

interface FundsBreadcrumbProps {
  occasionFilter?: string | null;
  containerClassName?: string;
}

/**
 * FundsBreadcrumb - Fil d'Ariane pour la page liste des cagnottes publiques
 * 
 * Affiche: Accueil > Cagnottes > [Occasion]
 * Utilise seoLabel pour le JSON-LD sans emojis
 */
export function FundsBreadcrumb({
  occasionFilter,
  containerClassName = "max-w-lg mx-auto px-4 py-2",
}: FundsBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    {
      label: "Accueil",
      path: "/",
      icon: <Home className="h-3.5 w-3.5" />,
      hideTextOnMobile: true,
    },
    {
      label: "Cagnottes",
      seoLabel: "Cagnottes",
      path: "/cagnottes",
      icon: <Heart className="h-3.5 w-3.5" />,
      isCurrent: !occasionFilter,
    },
  ];

  // Ajouter le filtre occasion si présent
  if (occasionFilter && OCCASION_LABELS[occasionFilter]) {
    items[1].isCurrent = false; // Le niveau précédent n'est plus current
    items.push({
      label: `${OCCASION_EMOJIS[occasionFilter]} ${OCCASION_LABELS[occasionFilter]}`,
      seoLabel: OCCASION_LABELS[occasionFilter], // SEO sans emoji
      path: `/cagnottes?occasion=${occasionFilter}`,
      isCurrent: true,
    });
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/30">
      <BaseBreadcrumb items={items} containerClassName={containerClassName} />
    </div>
  );
}
