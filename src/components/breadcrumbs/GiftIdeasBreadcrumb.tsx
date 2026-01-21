import { Home, Users, Gift } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface GiftIdeasBreadcrumbProps {
  contactName: string;
  contactId: string;
}

/**
 * GiftIdeasBreadcrumb - For gift ideas pages
 * Path: Accueil > Mes amis > [Contact] > Idées cadeaux
 */
export function GiftIdeasBreadcrumb({ contactName, contactId }: GiftIdeasBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: "Mes amis", 
      path: "/contacts", 
      icon: <Users className="h-3.5 w-3.5" />,
      hideTextOnMobile: true
    },
    { 
      label: contactName, 
      path: `/contacts/${contactId}`, 
      hideTextOnMobile: true
    },
    { 
      label: "Idées cadeaux", 
      path: `/gift-ideas/${contactId}`, 
      icon: <Gift className="h-3.5 w-3.5" />, 
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
