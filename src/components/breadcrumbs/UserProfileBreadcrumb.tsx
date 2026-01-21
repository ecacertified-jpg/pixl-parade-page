import { Home, Users, User } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

interface UserProfileBreadcrumbProps {
  userName: string;
  userId: string;
}

/**
 * UserProfileBreadcrumb - For public user profile pages
 * Path: Accueil > Communauté > [Nom]
 */
export function UserProfileBreadcrumb({ userName, userId }: UserProfileBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: "Communauté", 
      path: "/community", 
      icon: <Users className="h-3.5 w-3.5" />,
      hideTextOnMobile: true
    },
    { 
      label: userName || "Profil", 
      path: `/user/${userId}`, 
      icon: <User className="h-3.5 w-3.5" />, 
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
