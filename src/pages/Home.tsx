import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { NotificationPanel } from "@/components/NotificationPanel";
import { WhatDoYouWantCard } from "@/components/WhatDoYouWantCard";
import { PublicFundsCarousel } from "@/components/PublicFundsCarousel";
import { FeaturedExperiencesCarousel } from "@/components/FeaturedExperiencesCarousel";
import { NewsFeed } from "@/components/NewsFeed";
import { BottomNavigation } from "@/components/RecentActivitySection";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { useCart } from "@/hooks/useCart";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import logoJV from "@/assets/logo-jv.png";

const Home = () => {
  // Force rebuild - Home component 
  const navigate = useNavigate();
  const { isActiveBusinessAccount } = useBusinessAccount();
  const { itemCount } = useCart();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoJV} alt="Joie de Vivre" className="h-12 w-auto" />
            <h1 className="text-xl font-poppins font-semibold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Joie de Vivre
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ModeSwitcher />
            <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </div>
              )}
            </div>
            <NotificationPanel />
            {isActiveBusinessAccount ? <BusinessProfileDropdown /> : <ProfileDropdown />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Section 1: What do you want card */}
        <WhatDoYouWantCard />

        {/* Section 2: Public Funds Carousel */}
        <PublicFundsCarousel />

        {/* Section 3: Featured Experiences Carousel */}
        <FeaturedExperiencesCarousel />

        {/* Section 4: News Feed */}
        <NewsFeed />

        {/* Bottom padding for navigation */}
        <div className="pb-20"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default memo(Home);