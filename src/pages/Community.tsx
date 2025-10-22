import { memo } from "react";
import { ShoppingCart, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { NotificationPanel } from "@/components/NotificationPanel";
import { BottomNavigation } from "@/components/RecentActivitySection";
import { CommunityStatsBar } from "@/components/CommunityStatsBar";
import { CommunityLeaderboards } from "@/components/CommunityLeaderboards";
import { GratitudeWallSection } from "@/components/GratitudeWallSection";
import { NewsFeed } from "@/components/NewsFeed";
import { PublicFundsCarousel } from "@/components/PublicFundsCarousel";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { useCart } from "@/hooks/useCart";
import logoJV from "@/assets/logo-jv.png";

const Community = () => {
  const navigate = useNavigate();
  const { hasBusinessAccount } = useBusinessAccount();
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logoJV} alt="Joie de Vivre" className="h-8 w-auto" />
            <div>
              <h1 className="text-base font-poppins font-semibold text-foreground leading-tight">
                Communauté
              </h1>
              <p className="text-xs text-muted-foreground">
                Moments de joie partagés
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                  {itemCount}
                </Badge>
              )}
            </Button>
            
            <NotificationPanel />

            {hasBusinessAccount ? <BusinessProfileDropdown /> : <ProfileDropdown />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Real-time Community Statistics */}
        <CommunityStatsBar />

        {/* Leaderboards & Gamification */}
        <CommunityLeaderboards />

        {/* Extended Gratitude Wall */}
        <GratitudeWallSection />

        {/* Public Collective Funds */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>💰</span>
            Cagnottes Actives
          </h2>
          <PublicFundsCarousel />
        </div>

        {/* Community News Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🎉</span>
            Moments de Joie
          </h2>
          <NewsFeed />
        </div>

        {/* Bottom padding for navigation */}
        <div className="pb-20"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default memo(Community);