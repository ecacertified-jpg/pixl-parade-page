import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memo, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate } from "@/contexts/AuthGateContext";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { NotificationPanel } from "@/components/NotificationPanel";
import { WhatDoYouWantCard } from "@/components/WhatDoYouWantCard";
import { PublicFundsCarousel } from "@/components/PublicFundsCarousel";
import { FeaturedVideoProductsCarousel } from "@/components/FeaturedVideoProductsCarousel";
import { FeaturedExperiencesCarousel } from "@/components/FeaturedExperiencesCarousel";
import { NewsFeed } from "@/components/NewsFeed";

import { UserSuggestionsSection } from "@/components/UserSuggestionsSection";
import { BottomNavigation } from "@/components/RecentActivitySection";
import { InstallBanner } from "@/components/InstallBanner";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { useCart } from "@/hooks/useCart";
import { FriendsCircleReminderCard } from "@/components/FriendsCircleReminderCard";
import { FriendsCircleBadgeCelebration } from "@/components/FriendsCircleBadgeCelebration";
import { useFriendsCircleBadgeCelebration } from "@/hooks/useFriendsCircleBadgeCelebration";

import { CountryBadgeHeader } from "@/components/CountryBadgeHeader";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { OrganizationSchema, WebSiteSchema } from "@/components/schema";
import { organizationData, websiteData } from "@/data/brand-schema";
import logoJV from "@/assets/logo-jv.svg";

function ToggleRevealSection({ label, hideLabel, children }: { label: string; hideLabel: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 text-sm font-semibold text-primary hover:from-primary/15 hover:to-accent/10 transition-all text-center"
      >
        {label}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      {children}
      <button
        onClick={() => setShow(false)}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {hideLabel}
      </button>
    </div>
  );
}
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isActiveBusinessAccount } = useBusinessAccount();
  const { itemCount } = useCart();
  const { openAuthGate, requireAuth } = useAuthGate();
  const { celebrationBadge, isOpen: isCelebrationOpen, closeCelebration } = useFriendsCircleBadgeCelebration();

  // Prefetch dashboard data so it's instant when user navigates
  useEffect(() => {
    if (user?.id) {
      import('@/hooks/useDashboardData').then(({ prefetchDashboardData }) => {
        prefetchDashboardData(queryClient, user.id);
      });
    }
  }, [user?.id, queryClient]);

  return (
    <>
    <SEOHead {...SEO_CONFIGS.home} />
    <OrganizationSchema {...organizationData} />
    <WebSiteSchema {...websiteData} />
    <div className="min-h-screen bg-gradient-to-b from-background via-violet-50/30 to-rose-50/20">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoJV} alt="Joie de Vivre" className="h-10 w-auto" />
            <CountryBadgeHeader />
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className="relative cursor-pointer"
              onClick={requireAuth("open_cart", () => navigate("/cart"))}
            >
              <ShoppingCart className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
              {user && itemCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </div>
              )}
            </div>
            {user ? (
              <>
                <NotificationPanel />
                {isActiveBusinessAccount ? <BusinessProfileDropdown /> : <ProfileDropdown />}
              </>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground h-9"
                onClick={() => openAuthGate("open_profile")}
              >
                S'inscrire
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Global Friends Circle Reminder (signed-in only) */}
      {user && <FriendsCircleReminderCard compact />}

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Install Banner */}
        <InstallBanner />

        {/* Section 1: What do you want card */}
        <WhatDoYouWantCard />

        {/* Section 2: User Suggestions */}
        <UserSuggestionsSection />

        {/* Section 3: Public Funds Carousel */}
        <PublicFundsCarousel />

        {/* Section 4: Featured Video Products - Hidden by default */}
        <ToggleRevealSection
          label="🎬 Découvrir les produits vedettes →"
          hideLabel="Masquer les produits vedettes"
        >
          <FeaturedVideoProductsCarousel />
        </ToggleRevealSection>

        {/* Section 5: Featured Experiences - Hidden by default */}
        <ToggleRevealSection
          label="✨ Explorer les expériences Premium →"
          hideLabel="Masquer les expériences"
        >
          <FeaturedExperiencesCarousel />
        </ToggleRevealSection>

        {/* Section 6: News Feed with mode toggle */}
        <NewsFeed />

        {/* Bottom padding for navigation */}
        <div className="pb-20"></div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Friends Circle Badge Celebration */}
      <FriendsCircleBadgeCelebration
        badge={celebrationBadge}
        isOpen={isCelebrationOpen}
        onClose={closeCelebration}
      />
    </div>
    </>
  );
};

export default memo(Home);