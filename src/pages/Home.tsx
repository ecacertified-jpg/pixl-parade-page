import { Bell, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { WhatDoYouWantCard } from "@/components/WhatDoYouWantCard";
import { PublicFundsCarousel } from "@/components/PublicFundsCarousel";
import { NewsFeed } from "@/components/NewsFeed";
import { BottomNavigation } from "@/components/RecentActivitySection";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Joie de vivre
            </h1>
            <p className="text-sm text-muted-foreground">Célébrez ensemble</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                2
              </div>
            </div>
            <div className="relative">
              <Bell className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                1
              </div>
            </div>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Section 1: What do you want card */}
        <WhatDoYouWantCard />

        {/* Section 2: Public Funds Carousel */}
        <PublicFundsCarousel />

        {/* Section 3: News Feed */}
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