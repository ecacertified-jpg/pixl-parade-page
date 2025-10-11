import { Bell, User, Gift, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPanel } from "@/components/NotificationPanel";
import { WelcomeSection } from "@/components/WelcomeSection";
import { ActionCard } from "@/components/ActionCard";
import { FavoriteArticlesSection } from "@/components/FavoriteArticlesSection";
import { FavoritesSuggestions } from "@/components/FavoritesSuggestions";
import { OccasionSection } from "@/components/OccasionSection";
import { PopularCategoriesSection } from "@/components/PopularCategoriesSection";
import { CollaborativeOfferSection } from "@/components/CollaborativeOfferSection";
import { RecentActivitySection, BottomNavigation } from "@/components/RecentActivitySection";
import { BusinessEntryPoint } from "@/components/BusinessEntryPoint";
import { GratitudeWallSection } from "@/components/GratitudeWallSection";
import { SmartNotificationsSection } from "@/components/SmartNotificationsSection";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import logoJV from "@/assets/logo-jv.png";
const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActiveBusinessAccount } = useBusinessAccount();

  const handleGiftAction = () => {
    toast({
      title: "Cadeau sélectionné !",
      description: "Redirection vers les options de cadeaux..."
    });
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  const handleOfferGift = () => {
    navigate("/shop");
  };

  return <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoJV} alt="Joie de Vivre" className="h-12 w-auto" />
            <h1 className="text-xl font-poppins font-semibold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Joie de Vivre
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <NotificationPanel />
            {isActiveBusinessAccount ? <BusinessProfileDropdown /> : <ProfileDropdown />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Welcome Section */}
        <WelcomeSection userName="Aminata" />

        {/* Business Entry Point */}
        <BusinessEntryPoint />

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ActionCard title="Mon Tableau de Bord" subtitle="Gérez vos amis et événements" icon={User} variant="primary" onClick={handleDashboard} />
          
          <ActionCard title="Offrir un Cadeau" subtitle="Parcourez et offrez" icon={Gift} variant="success" onClick={handleOfferGift} />
        </div>

      {/* Mur de Gratitude */}
      <GratitudeWallSection />

      {/* Suggestions Intelligentes */}
      <SmartNotificationsSection />

        {/* Favorite Articles Section */}
        <FavoriteArticlesSection />

        {/* Favorites Suggestions */}
        <FavoritesSuggestions />

        {/* Occasions Section */}
        <OccasionSection />

        {/* Popular Categories */}
        <PopularCategoriesSection />

        {/* Collaborative Offer */}
        <CollaborativeOfferSection />

        {/* Recent Activity */}
        <RecentActivitySection />

        {/* Bottom padding for navigation */}
        <div className="pb-20"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>;
};
export default memo(Index);