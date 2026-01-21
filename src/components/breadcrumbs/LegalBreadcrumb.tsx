import { Home, Info, Shield, FileText, Building2, HelpCircle } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

type LegalPage = "about" | "privacy" | "terms" | "legal" | "faq";

interface LegalBreadcrumbProps {
  page: LegalPage;
}

const LEGAL_PAGES: Record<LegalPage, { label: string; path: string; icon: React.ReactNode }> = {
  about: { 
    label: "À propos", 
    path: "/about", 
    icon: <Info className="h-3.5 w-3.5" /> 
  },
  privacy: { 
    label: "Confidentialité", 
    path: "/privacy-policy", 
    icon: <Shield className="h-3.5 w-3.5" /> 
  },
  terms: { 
    label: "CGU", 
    path: "/terms-of-service", 
    icon: <FileText className="h-3.5 w-3.5" /> 
  },
  legal: { 
    label: "Mentions légales", 
    path: "/legal-notice", 
    icon: <Building2 className="h-3.5 w-3.5" /> 
  },
  faq: { 
    label: "FAQ", 
    path: "/faq", 
    icon: <HelpCircle className="h-3.5 w-3.5" /> 
  }
};

/**
 * LegalBreadcrumb - For legal pages (About, Privacy, Terms, Legal Notice, FAQ)
 * Path: Accueil > [Page]
 */
export function LegalBreadcrumb({ page }: LegalBreadcrumbProps) {
  const pageInfo = LEGAL_PAGES[page];

  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: pageInfo.label, 
      path: pageInfo.path, 
      icon: pageInfo.icon, 
      isCurrent: true 
    }
  ];

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/30">
      <BaseBreadcrumb 
        items={items} 
        containerClassName="max-w-4xl mx-auto px-4 py-2" 
      />
    </div>
  );
}
