import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Navigate, useSearchParams } from "react-router-dom";
import { AnimatedRoutes } from "@/components/transitions";
import { AnimatedPageTransition } from "@/components/transitions/AnimatedPageTransition";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedBusinessProvider } from "@/contexts/SelectedBusinessContext";
import { CountryProvider } from "@/contexts/CountryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { AuthGateProvider } from "@/contexts/AuthGateContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdateToast } from "@/components/pwa/UpdateToast";
import { NetworkQualityHint } from "@/components/pwa/NetworkQualityHint";
import { NotificationSoundProvider } from "@/components/NotificationSoundProvider";
import { AdminRoute } from "./components/AdminRoute";
import { AIChatWidget } from "./components/AIChatWidget";
import { LoadingTransition } from "@/components/transitions/LoadingTransition";

// Critical pages - kept as eager imports (first render)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Preload high-traffic routes after idle
const preloadRoutes = () => {
  import("./pages/Home");
  import("./pages/Dashboard");
  import("./pages/Shop");
  import("./pages/Index");
};
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadRoutes);
  } else {
    setTimeout(preloadRoutes, 2000);
  }
}

// All other pages - lazy loaded
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Install = lazy(() => import("./pages/Install"));
const BusinessAuth = lazy(() => import("./pages/BusinessAuth"));
const JoinAdmin = lazy(() => import("./pages/JoinAdmin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Publications = lazy(() => import("./pages/Publications"));
const UserPagesPage = lazy(() => import("./pages/UserPagesPage"));
const BusinessAccount = lazy(() => import("./pages/BusinessAccount"));
const BusinessSetup = lazy(() => import("./pages/BusinessSetup"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
const BusinessFundOrderView = lazy(() => import("./pages/BusinessFundOrderView"));
const Shop = lazy(() => import("./pages/Shop"));
const VendorShop = lazy(() => import("./pages/VendorShop"));
const Favorites = lazy(() => import("./pages/Favorites"));
const FollowedShops = lazy(() => import("./pages/FollowedShops"));
const Gifts = lazy(() => import("./pages/Gifts"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CollectiveCheckout = lazy(() => import("./pages/CollectiveCheckout"));
const CollectiveOrderConfirmation = lazy(() => import("./pages/CollectiveOrderConfirmation"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const NotificationHistory = lazy(() => import("./pages/NotificationHistory"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Community = lazy(() => import("./pages/Community"));
const Celebrer = lazy(() => import("./pages/Celebrer"));
const ReciprocityProfile = lazy(() => import("./pages/ReciprocityProfile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Invitations = lazy(() => import("./pages/Invitations"));
const ReferralCodes = lazy(() => import("./pages/ReferralCodes"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const BusinessProfileSettings = lazy(() => import("./pages/BusinessProfileSettings"));
const Orders = lazy(() => import("./pages/Orders"));
const GiftIdeas = lazy(() => import("./pages/GiftIdeas"));
const WishlistCatalog = lazy(() => import("./pages/WishlistCatalog"));
const BusinessCollectiveFundsManagement = lazy(() => import("./pages/BusinessCollectiveFundsManagement"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const FAQ = lazy(() => import("./pages/FAQ"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const AccountLinking = lazy(() => import("./pages/AccountLinking"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProductPreview = lazy(() => import("./pages/ProductPreview"));
const FundPreview = lazy(() => import("./pages/FundPreview"));
const BusinessPreview = lazy(() => import("./pages/BusinessPreview"));
const ExploreMap = lazy(() => import("./pages/ExploreMap"));
const PublicFundsPage = lazy(() => import("./pages/PublicFundsPage"));
const AIInfo = lazy(() => import("./pages/AIInfo"));
const AICatalog = lazy(() => import("./pages/AICatalog"));
const AIProducts = lazy(() => import("./pages/AIProducts"));
const CityPage = lazy(() => import("./pages/CityPage"));
const CitiesOverview = lazy(() => import("./pages/CitiesOverview"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const OccasionPage = lazy(() => import("./pages/OccasionPage"));
const VendorSectorPage = lazy(() => import("./pages/VendorSectorPage"));
const SeasonalPage = lazy(() => import("./pages/SeasonalPage"));
const FillFriendForm = lazy(() => import("./pages/FillFriendForm"));
const GiftReceived = lazy(() => import("./pages/GiftReceived"));
const BirthdayPage = lazy(() => import("./pages/BirthdayPage"));
const EventPage = lazy(() => import("./pages/EventPage"));
const CreateEventPage = lazy(() => import("./pages/CreateEventPage"));
const Souvenirs = lazy(() => import("./pages/Souvenirs"));
const SouvenirsRetrospective = lazy(() => import("./pages/SouvenirsRetrospective"));
const SouvenirsCapsule = lazy(() => import("./pages/SouvenirsCapsule"));
const OrganizerAccept = lazy(() => import("./pages/OrganizerAccept"));
const RsvpPage = lazy(() => import("./pages/RsvpPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Subscription = lazy(() => import("./pages/Subscription"));
// Admin pages
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/Admin/UserManagement"));
const BusinessManagement = lazy(() => import("./pages/Admin/BusinessManagement"));
const ContentModeration = lazy(() => import("./pages/Admin/ContentModeration"));
const FinancialManagement = lazy(() => import("./pages/Admin/FinancialManagement"));
const ExternalPurchases = lazy(() => import("./pages/Admin/ExternalPurchases"));
const Analytics = lazy(() => import("./pages/Admin/Analytics"));
const AdminManagement = lazy(() => import("./pages/Admin/AdminManagement"));
const AuditLogs = lazy(() => import("./pages/Admin/AuditLogs"));
const Settings = lazy(() => import("./pages/Admin/Settings"));
const ReciprocityDashboard = lazy(() => import("./pages/Admin/ReciprocityDashboard"));
const BusinessAnalytics = lazy(() => import("./pages/Admin/BusinessAnalytics"));
const RealtimeDashboard = lazy(() => import("./pages/Admin/RealtimeDashboard"));
const AlertsHistory = lazy(() => import("./pages/Admin/AlertsHistory"));
const NotificationAnalytics = lazy(() => import("./pages/Admin/NotificationAnalytics"));
const ProfileCompletionDashboard = lazy(() => import("./pages/Admin/ProfileCompletionDashboard"));
const DuplicateAccountsDashboard = lazy(() => import("./pages/Admin/DuplicateAccountsDashboard"));
const DeletedBusinesses = lazy(() => import("./pages/Admin/DeletedBusinesses"));
const DeletedClients = lazy(() => import("./pages/Admin/DeletedClients"));
const AdminPerformanceDashboard = lazy(() => import("./pages/Admin/AdminPerformanceDashboard"));
const CountryPerformanceDashboard = lazy(() => import("./pages/Admin/CountryPerformanceDashboard"));
const CountryDetailPage = lazy(() => import("./pages/Admin/CountryDetailPage"));
const CountryUsersPage = lazy(() => import("./pages/Admin/CountryUsersPage"));
const CountryBusinessesPage = lazy(() => import("./pages/Admin/CountryBusinessesPage"));
const CountryFundsPage = lazy(() => import("./pages/Admin/CountryFundsPage"));
const CountryObjectivesPage = lazy(() => import("./pages/Admin/CountryObjectivesPage"));
const CountryMonthlyComparisonPage = lazy(() => import("./pages/Admin/CountryMonthlyComparisonPage"));
const ForecastPage = lazy(() => import("./pages/Admin/ForecastPage"));
const AdminBirthdays = lazy(() => import("./pages/Admin/AdminBirthdays"));
const AdminCoverVideos = lazy(() => import("./pages/Admin/AdminCoverVideos"));
const OrdersManagement = lazy(() => import("./pages/Admin/OrdersManagement"));
const AdminNotificationsPage = lazy(() => import("./pages/Admin/AdminNotificationsPage"));
const ShareAnalytics = lazy(() => import("./pages/Admin/ShareAnalytics"));
const IndexNowAnalytics = lazy(() => import("./pages/Admin/IndexNowAnalytics"));
const SocialPreviewDebug = lazy(() => import("./pages/Admin/SocialPreviewDebug"));
const WhatsAppOtpAnalytics = lazy(() => import("./pages/Admin/WhatsAppOtpAnalytics"));
const MessagingDeliveryDashboard = lazy(() => import("./pages/Admin/MessagingDeliveryDashboard"));
const WhatsAppTemplateDashboard = lazy(() => import("./pages/Admin/WhatsAppTemplateDashboard"));
const BusinessFundWhatsAppLogs = lazy(() => import("./pages/Admin/BusinessFundWhatsAppLogs"));
const MyAssignments = lazy(() => import("./pages/Admin/MyAssignments"));
const CommissionsDashboard = lazy(() => import("./pages/Admin/CommissionsDashboard"));
const WhatsAppAIChat = lazy(() => import("./pages/Admin/WhatsAppAIChat"));
const AdminFundDetail = lazy(() => import("./pages/Admin/AdminFundDetail"));
const OnboardingProgressDashboard = lazy(() => import("./pages/Admin/OnboardingProgressDashboard"));
const WaveSubscriptionsAdmin = lazy(() => import("./pages/Admin/WaveSubscriptionsAdmin"));
const CelebrationPremiumOrders = lazy(() => import("./pages/Admin/CelebrationPremiumOrders"));
const LiveRoom = lazy(() => import("./pages/LiveRoom"));
const Rooms = lazy(() => import("./pages/Rooms"));

// Deep link redirect that preserves query params (e.g. ?for=Name)
const DeepLinkRedirect = ({ occasion }: { occasion: string }) => {
  const [params] = useSearchParams();
  const forParam = params.get('for');
  let url = `/auth?tab=signup&redirect=create-fund&occasion=${occasion}&utm_source=deep_link`;
  if (forParam) {
    url += `&beneficiaryName=${encodeURIComponent(forParam)}`;
  }
  return <Navigate to={url} replace />;
};

// Suspense wrapper helper
const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingTransition />}>{children}</Suspense>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CountryProvider>
      <AuthProvider>
        <SelectedBusinessProvider>
          <NotificationSoundProvider>
            <TooltipProvider>
              <OfflineIndicator />
              <NetworkQualityHint />
              <UpdateToast />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GoogleAnalytics />
            <AuthGateProvider>
            <AnimatedRoutes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy-policy" element={<L><PrivacyPolicy /></L>} />
            <Route path="/terms-of-service" element={<L><TermsOfService /></L>} />
            <Route path="/legal-notice" element={<L><LegalNotice /></L>} />
            <Route path="/faq" element={<L><FAQ /></L>} />
            <Route path="/about" element={<L><About /></L>} />
            <Route path="/contact" element={<L><Contact /></L>} />
            <Route path="/data-deletion" element={<L><DataDeletion /></L>} />
            <Route path="/install" element={<L><Install /></L>} />
            <Route path="/p/:productId" element={<L><ProductPreview /></L>} />
            <Route path="/f/:fundId" element={<L><FundPreview /></L>} />
            <Route path="/cagnottes" element={<L><PublicFundsPage /></L>} />
            <Route path="/b/:businessId" element={<L><BusinessPreview /></L>} />
            <Route path="/ai-info" element={<L><AIInfo /></L>} />
            <Route path="/api/ai-catalog" element={<L><AICatalog /></L>} />
            <Route path="/api/products" element={<L><AIProducts /></L>} />
            <Route path="/villes" element={<L><CitiesOverview /></L>} />
            <Route path="/cagnotte-:occasionSlug" element={<L><OccasionPage /></L>} />
            <Route path="/devenir-vendeur/:sectorSlug" element={<L><VendorSectorPage /></L>} />
            <Route path="/:eventSlug-:year" element={<L><SeasonalPage /></L>} />
            <Route path="/fill-friend-info/:token" element={<L><FillFriendForm /></L>} />
            <Route path="/:citySlug" element={<L><CityPage /></L>} />

            {/* Deep Links for Social Sharing & AI Referrals */}
            <Route path="/go/signup" element={<Navigate to="/auth?tab=signup&utm_source=deep_link" replace />} />
            <Route path="/go/birthday" element={<DeepLinkRedirect occasion="birthday" />} />
            <Route path="/go/wedding" element={<DeepLinkRedirect occasion="wedding" />} />
            <Route path="/go/baby" element={<DeepLinkRedirect occasion="baby" />} />
            <Route path="/go/graduation" element={<DeepLinkRedirect occasion="graduation" />} />
            <Route path="/go/promotion" element={<DeepLinkRedirect occasion="promotion" />} />
            <Route path="/go/sell" element={<Navigate to="/business-auth?utm_source=deep_link" replace />} />
            <Route path="/go/sell/patisserie" element={<Navigate to="/business-auth?sector=patisserie&utm_source=deep_link" replace />} />
            <Route path="/go/sell/fleuriste" element={<Navigate to="/business-auth?sector=fleuriste&utm_source=deep_link" replace />} />
            <Route path="/go/sell/mode" element={<Navigate to="/business-auth?sector=mode&utm_source=deep_link" replace />} />
            <Route path="/go/sell/bijoux" element={<Navigate to="/business-auth?sector=bijoux&utm_source=deep_link" replace />} />
            <Route path="/go/sell/spa" element={<Navigate to="/business-auth?sector=spa&utm_source=deep_link" replace />} />
            <Route path="/go/sell/traiteur" element={<Navigate to="/business-auth?sector=traiteur&utm_source=deep_link" replace />} />
            <Route path="/go/shop" element={<Navigate to="/shop?utm_source=deep_link" replace />} />
            <Route path="/go/funds" element={<Navigate to="/cagnottes?utm_source=deep_link" replace />} />

            <Route path="/gift-received/:orderId" element={<L><GiftReceived /></L>} />
            <Route path="/birthday/:slug" element={<L><BirthdayPage /></L>} />
            <Route path="/anniversaire/:slug" element={<L><BirthdayPage /></L>} />
            <Route path="/event/create" element={<ProtectedRoute><L><CreateEventPage /></L></ProtectedRoute>} />
            <Route path="/live/:roomId" element={<ProtectedRoute><L><LiveRoom /></L></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute><L><Rooms /></L></ProtectedRoute>} />
            <Route path="/event/:slug" element={<L><EventPage /></L>} />
            <Route path="/evenement/:slug" element={<L><EventPage /></L>} />
            <Route path="/organisation/accept/:token" element={<L><OrganizerAccept /></L>} />
            <Route path="/organisation/inviter/:token" element={<L><OrganizerAccept /></L>} />
            <Route path="/rsvp/:token" element={<L><RsvpPage /></L>} />
            <Route path="/join/:code" element={<L><JoinAdmin /></L>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<L><ResetPassword /></L>} />
            <Route path="/business-auth" element={<L><BusinessAuth /></L>} />
            <Route path="/business-waitlist" element={<Navigate to="/business-auth" replace />} />
            <Route path="/devenir-prestataire" element={<Navigate to="/business-auth" replace />} />
            <Route path="/admin-auth" element={<L><AdminAuth /></L>} />
            <Route path="/home" element={<PublicRoute><L><Home /></L></PublicRoute>} />
            <Route path="/index" element={<PublicRoute><L><AnimatedPageTransition mode="fade" duration={0.2}><Index /></AnimatedPageTransition></L></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><L><AnimatedPageTransition mode="fade" duration={0.2}><Dashboard /></AnimatedPageTransition></L></ProtectedRoute>} />
            <Route path="/souvenirs" element={<ProtectedRoute><L><Souvenirs /></L></ProtectedRoute>} />
            <Route path="/memories" element={<ProtectedRoute><L><Souvenirs /></L></ProtectedRoute>} />
            <Route path="/souvenirs/retrospective/:year" element={<ProtectedRoute><L><SouvenirsRetrospective /></L></ProtectedRoute>} />
            <Route path="/souvenirs/capsule/:id" element={<ProtectedRoute><L><SouvenirsCapsule /></L></ProtectedRoute>} />
            <Route path="/publications" element={<PublicRoute><L><Publications /></L></PublicRoute>} />
            <Route path="/business-account" element={<ProtectedRoute><L><BusinessAccount /></L></ProtectedRoute>} />
            <Route path="/business/setup" element={<ProtectedRoute><L><BusinessSetup /></L></ProtectedRoute>} />
            <Route path="/business-dashboard" element={<ProtectedRoute><L><BusinessDashboard /></L></ProtectedRoute>} />
            <Route path="/shop" element={<PublicRoute><L><AnimatedPageTransition mode="fade" duration={0.2}><Shop /></AnimatedPageTransition></L></PublicRoute>} />
            <Route path="/category/:slug" element={<PublicRoute><L><CategoryPage /></L></PublicRoute>} />
            <Route path="/explore-map" element={<PublicRoute><L><ExploreMap /></L></PublicRoute>} />
            <Route path="/boutique/:businessId" element={<PublicRoute><L><VendorShop /></L></PublicRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><L><Favorites /></L></ProtectedRoute>} />
            <Route path="/followed-shops" element={<ProtectedRoute><L><FollowedShops /></L></ProtectedRoute>} />
            <Route path="/gifts" element={<ProtectedRoute><L><AnimatedPageTransition mode="fade" duration={0.2}><Gifts /></AnimatedPageTransition></L></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><L><Cart /></L></ProtectedRoute>} />
            <Route path="/preferences" element={<ProtectedRoute><L><Preferences /></L></ProtectedRoute>} />
            <Route path="/pricing" element={<L><Pricing /></L>} />
            <Route path="/tarifs" element={<L><Pricing /></L>} />
            <Route path="/subscription" element={<ProtectedRoute><L><Subscription /></L></ProtectedRoute>} />
            <Route path="/abonnement" element={<ProtectedRoute><L><Subscription /></L></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><L><Checkout /></L></ProtectedRoute>} />
            <Route path="/collective-checkout" element={<ProtectedRoute><L><CollectiveCheckout /></L></ProtectedRoute>} />
            <Route path="/collective-order-confirmation" element={<ProtectedRoute><L><CollectiveOrderConfirmation /></L></ProtectedRoute>} />
            <Route path="/order-confirmation" element={<ProtectedRoute><L><OrderConfirmation /></L></ProtectedRoute>} />
            <Route path="/notification-settings" element={<ProtectedRoute><L><NotificationSettings /></L></ProtectedRoute>} />
            <Route path="/notifications/history" element={<ProtectedRoute><L><NotificationHistory /></L></ProtectedRoute>} />
            <Route path="/community" element={<PublicRoute><L><Community /></L></PublicRoute>} />
            <Route path="/celebrer" element={<PublicRoute><L><Celebrer /></L></PublicRoute>} />
            <Route path="/celebrate" element={<PublicRoute><L><Celebrer /></L></PublicRoute>} />
            <Route path="/reciprocity-profile" element={<ProtectedRoute><L><ReciprocityProfile /></L></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<PublicRoute><L><UserProfile /></L></PublicRoute>} />
            <Route path="/u/:userId/pages" element={<PublicRoute><L><UserPagesPage /></L></PublicRoute>} />
            <Route path="/invitations" element={<ProtectedRoute><L><Invitations /></L></ProtectedRoute>} />
            <Route path="/referral-codes" element={<ProtectedRoute><L><ReferralCodes /></L></ProtectedRoute>} />
            <Route path="/profile-settings" element={<ProtectedRoute><L><ProfileSettings /></L></ProtectedRoute>} />
            <Route path="/business-profile-settings" element={<ProtectedRoute><L><BusinessProfileSettings /></L></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><L><Orders /></L></ProtectedRoute>} />
            <Route path="/business-collective-funds" element={<ProtectedRoute><L><BusinessCollectiveFundsManagement /></L></ProtectedRoute>} />
            <Route path="/gift-ideas/:contactId" element={<ProtectedRoute><L><GiftIdeas /></L></ProtectedRoute>} />
            <Route path="/account-linking" element={<ProtectedRoute><L><AccountLinking /></L></ProtectedRoute>} />
            <Route path="/wishlist-catalog" element={<ProtectedRoute><L><WishlistCatalog /></L></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><L><AdminDashboard /></L></AdminRoute>} />
            <Route path="/admin/realtime" element={<AdminRoute><L><RealtimeDashboard /></L></AdminRoute>} />
            <Route path="/admin/alerts" element={<AdminRoute><L><AlertsHistory /></L></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><L><NotificationAnalytics /></L></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><L><UserManagement /></L></AdminRoute>} />
            <Route path="/admin/profile-completion" element={<AdminRoute><L><ProfileCompletionDashboard /></L></AdminRoute>} />
            <Route path="/admin/duplicates" element={<AdminRoute><L><DuplicateAccountsDashboard /></L></AdminRoute>} />
            <Route path="/admin/businesses" element={<AdminRoute><L><BusinessManagement /></L></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><L><OrdersManagement /></L></AdminRoute>} />
            <Route path="/admin/deleted-businesses" element={<AdminRoute requiredRole="super_admin"><L><DeletedBusinesses /></L></AdminRoute>} />
            <Route path="/admin/deleted-clients" element={<AdminRoute requiredRole="super_admin"><L><DeletedClients /></L></AdminRoute>} />
            <Route path="/admin/admin-notifications" element={<AdminRoute><L><AdminNotificationsPage /></L></AdminRoute>} />
            <Route path="/admin/waitlist" element={<Navigate to="/admin/businesses" replace />} />
            <Route path="/admin/business-analytics" element={<AdminRoute><L><BusinessAnalytics /></L></AdminRoute>} />
            <Route path="/admin/content" element={<AdminRoute><L><ContentModeration /></L></AdminRoute>} />
            <Route path="/admin/finances" element={<AdminRoute><L><FinancialManagement /></L></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><L><Analytics /></L></AdminRoute>} />
            <Route path="/admin/share-analytics" element={<AdminRoute><L><ShareAnalytics /></L></AdminRoute>} />
            <Route path="/admin/indexnow" element={<AdminRoute><L><IndexNowAnalytics /></L></AdminRoute>} />
            <Route path="/admin/social-preview" element={<AdminRoute><L><SocialPreviewDebug /></L></AdminRoute>} />
            <Route path="/admin/whatsapp-otp" element={<AdminRoute><L><WhatsAppOtpAnalytics /></L></AdminRoute>} />
            <Route path="/admin/messaging-delivery" element={<AdminRoute><L><MessagingDeliveryDashboard /></L></AdminRoute>} />
            <Route path="/admin/whatsapp-templates" element={<AdminRoute><L><WhatsAppTemplateDashboard /></L></AdminRoute>} />
            <Route path="/admin/business-fund-wa" element={<AdminRoute><L><BusinessFundWhatsAppLogs /></L></AdminRoute>} />
            <Route path="/admin/reciprocity" element={<AdminRoute><L><ReciprocityDashboard /></L></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute requiredRole="super_admin"><L><Settings /></L></AdminRoute>} />
            <Route path="/admin/admins" element={<AdminRoute requiredRole="super_admin"><L><AdminManagement /></L></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><L><AuditLogs /></L></AdminRoute>} />
            <Route path="/admin/my-assignments" element={<AdminRoute><L><MyAssignments /></L></AdminRoute>} />
            <Route path="/admin/performance" element={<AdminRoute><L><AdminPerformanceDashboard /></L></AdminRoute>} />
            <Route path="/admin/countries" element={<AdminRoute><L><CountryPerformanceDashboard /></L></AdminRoute>} />
            <Route path="/admin/countries/:countryCode" element={<AdminRoute><L><CountryDetailPage /></L></AdminRoute>} />
            <Route path="/admin/countries/:countryCode/users" element={<AdminRoute><L><CountryUsersPage /></L></AdminRoute>} />
            <Route path="/admin/countries/:countryCode/businesses" element={<AdminRoute><L><CountryBusinessesPage /></L></AdminRoute>} />
            <Route path="/admin/countries/:countryCode/funds" element={<AdminRoute><L><CountryFundsPage /></L></AdminRoute>} />
            <Route path="/admin/countries/objectives" element={<AdminRoute><L><CountryObjectivesPage /></L></AdminRoute>} />
            <Route path="/admin/countries/comparison" element={<AdminRoute><L><CountryMonthlyComparisonPage /></L></AdminRoute>} />
            <Route path="/admin/forecast" element={<AdminRoute><L><ForecastPage /></L></AdminRoute>} />
            <Route path="/admin/commissions" element={<AdminRoute><L><CommissionsDashboard /></L></AdminRoute>} />
            <Route path="/admin/external-purchases" element={<AdminRoute><L><ExternalPurchases /></L></AdminRoute>} />
            <Route path="/admin/birthdays" element={<AdminRoute><L><AdminBirthdays /></L></AdminRoute>} />
            <Route path="/admin/cover-videos" element={<AdminRoute><L><AdminCoverVideos /></L></AdminRoute>} />
            <Route path="/admin/whatsapp-ai" element={<AdminRoute><L><WhatsAppAIChat /></L></AdminRoute>} />
            <Route path="/admin/onboarding" element={<AdminRoute><L><OnboardingProgressDashboard /></L></AdminRoute>} />
            <Route path="/admin/funds/:fundId" element={<AdminRoute><L><AdminFundDetail /></L></AdminRoute>} />
            <Route path="/admin/abonnements-wave" element={<AdminRoute><L><WaveSubscriptionsAdmin /></L></AdminRoute>} />
            <Route path="/admin/celebrer-premium" element={<AdminRoute><L><CelebrationPremiumOrders /></L></AdminRoute>} />

            {/* Dedicated page for WhatsApp CTA link - loads specific fund directly */}
            <Route path="/business/orders/:fundId" element={<ProtectedRoute><L><BusinessFundOrderView /></L></ProtectedRoute>} />
            <Route path="/business/orders" element={<ProtectedRoute><Navigate to="/business-collective-funds" replace /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </AnimatedRoutes>
          </AuthGateProvider>
            <AIChatWidget />
          </BrowserRouter>
          </TooltipProvider>
          </NotificationSoundProvider>
        </SelectedBusinessProvider>
      </AuthProvider>
    </CountryProvider>
  </QueryClientProvider>
);

export default App;
