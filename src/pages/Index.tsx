import { Bell, User, Gift, ShoppingCart, Settings, LogOut, UserCircle } from "lucide-react";
import { NotificationCard } from "@/components/NotificationCard";
import { WelcomeSection } from "@/components/WelcomeSection";
import { ActionCard } from "@/components/ActionCard";
import { FavoriteArticlesSection } from "@/components/FavoriteArticlesSection";
import { FavoritesSuggestions } from "@/components/FavoritesSuggestions";
import { OccasionSection } from "@/components/OccasionSection";
import { PopularCategoriesSection } from "@/components/PopularCategoriesSection";
import { CollaborativeOfferSection } from "@/components/CollaborativeOfferSection";
import { RecentActivitySection, BottomNavigation } from "@/components/RecentActivitySection";
import { BusinessEntryPoint } from "@/components/BusinessEntryPoint";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur JOIE DE VIVRE !"
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };
  return <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Joie de vivre </h1>
            <p className="text-sm text-muted-foreground">Célébrez ensemble</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                2
              </div>
            </div>
            <div className="relative">
              <Bell className="h-6 w-6 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                1
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative cursor-pointer p-2 rounded-full hover:bg-muted/50 transition-colors">
                  <User className="h-6 w-6 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50 bg-background border shadow-md">
                <DropdownMenuLabel>
                  Mon compte
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Mon profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Notification Card */}
        <NotificationCard title="Anniversaire de Fatou" subtitle="Événement à venir" daysLeft={5} onAction={handleGiftAction} />

        {/* Welcome Section */}
        <WelcomeSection userName="Aminata" />

        {/* Business Entry Point */}
        <BusinessEntryPoint />

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ActionCard title="Mon Tableau de Bord" subtitle="Gérez vos amis et événements" icon={User} variant="primary" onClick={handleDashboard} />
          
          <ActionCard title="Offrir un Cadeau" subtitle="Parcourez et offrez" icon={Gift} variant="success" onClick={handleOfferGift} />
        </div>

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