import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Navigate } from "react-router-dom";
import { AnimatedRoutes } from "@/components/transitions";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedBusinessProvider } from "@/contexts/SelectedBusinessContext";
import { CountryProvider } from "@/contexts/CountryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { NotificationSoundProvider } from "@/components/NotificationSoundProvider";
import { AdminRoute } from "./components/AdminRoute";
import { AIChatWidget } from "./components/AIChatWidget";
import { LoadingTransition } from "@/components/transitions/LoadingTransition";

// Critical pages - kept as eager imports (first render)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// All other pages - lazy loaded
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Install = lazy(() => import("./pages/Install"));
const BusinessAuth = lazy(() => import("./pages/BusinessAuth"));
const JoinAdmin = lazy(() => import("./pages/JoinAdmin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Publications = lazy(() => import("./pages/Publications"));
const BusinessAccount = lazy(() => import("./pages/BusinessAccount"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard"));
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
const Preferences = lazy(() => import("./pages/Preferences"));
const Community = lazy(() => import("./pages/Community"));
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

// Admin pages
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const UserManagement = lazy(() => import("./pages/Admin/UserManagement"));
const BusinessManagement = lazy(() => import("./pages/Admin/BusinessManagement"));
const ContentModeration = lazy(() => import("./pages/Admin/ContentModeration"));
const FinancialManagement = lazy(() => import("./pages/Admin/FinancialManagement"));
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
const OrdersManagement = lazy(() => import("./pages/Admin/OrdersManagement"));
const AdminNotificationsPage = lazy(() => import("./pages/Admin/AdminNotificationsPage"));
const ShareAnalytics = lazy(() => import("./pages/Admin/ShareAnalytics"));
const IndexNowAnalytics = lazy(() => import("./pages/Admin/IndexNowAnalytics"));
const WhatsAppOtpAnalytics = lazy(() => import("./pages/Admin/WhatsAppOtpAnalytics"));
const MessagingDeliveryDashboard = lazy(() => import("./pages/Admin/MessagingDeliveryDashboard"));
const WhatsAppTemplateDashboard = lazy(() => import("./pages/Admin/WhatsAppTemplateDashboard"));
const BusinessFundWhatsAppLogs = lazy(() => import("./pages/Admin/BusinessFundWhatsAppLogs"));
const MyAssignments = lazy(() => import("./pages/Admin/MyAssignments"));

// Suspense wrapper helper
const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingTransition />}>{children}</Suspense>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CountryProvider>
      <AuthProvider>
        <SelectedBusinessProvider>
          <NotificationSoundProvider>
            <TooltipProvider>
              <OfflineIndicator />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GoogleAnalytics />
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
            <Route path="/:citySlug" element={<L><CityPage /></L>} />

            {/* Deep Links for Social Sharing & AI Referrals */}
            <Route path="/go/signup" element={<Navigate to="/auth?tab=signup&utm_source=deep_link" replace />} />
            <Route path="/go/birthday" element={<Navigate to="/auth?tab=signup&redirect=create-fund&occasion=birthday&utm_source=deep_link" replace />} />
            <Route path="/go/wedding" element={<Navigate to="/auth?tab=signup&redirect=create-fund&occasion=wedding&utm_source=deep_link" replace />} />
            <Route path="/go/baby" element={<Navigate to="/auth?tab=signup&redirect=create-fund&occasion=baby&utm_source=deep_link" replace />} />
            <Route path="/go/graduation" element={<Navigate to="/auth?tab=signup&redirect=create-fund&occasion=graduation&utm_source=deep_link" replace />} />
            <Route path="/go/promotion" element={<Navigate to="/auth?tab=signup&redirect=create-fund&occasion=promotion&utm_source=deep_link" replace />} />
            <Route path="/go/sell" element={<Navigate to="/business-auth?utm_source=deep_link" replace />} />
            <Route path="/go/sell/patisserie" element={<Navigate to="/business-auth?sector=patisserie&utm_source=deep_link" replace />} />
            <Route path="/go/sell/fleuriste" element={<Navigate to="/business-auth?sector=fleuriste&utm_source=deep_link" replace />} />
            <Route path="/go/sell/mode" element={<Navigate to="/business-auth?sector=mode&utm_source=deep_link" replace />} />
            <Route path="/go/sell/bijoux" element={<Navigate to="/business-auth?sector=bijoux&utm_source=deep_link" replace />} />
            <Route path="/go/sell/spa" element={<Navigate to="/business-auth?sector=spa&utm_source=deep_link" replace />} />
            <Route path="/go/sell/traiteur" element={<Navigate to="/business-auth?sector=traiteur&utm_source=deep_link" replace />} />
            <Route path="/go/shop" element={<Navigate to="/shop?utm_source=deep_link" replace />} />
            <Route path="/go/funds" element={<Navigate to="/cagnottes?utm_source=deep_link" replace />} />

            <Route path="/join/:code" element={<L><JoinAdmin /></L>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<L><ResetPassword /></L>} />
            <Route path="/business-auth" element={<L><BusinessAuth /></L>} />
            <Route path="/business-waitlist" element={<Navigate to="/business-auth" replace />} />
            <Route path="/devenir-prestataire" element={<Navigate to="/business-auth" replace />} />
            <Route path="/admin-auth" element={<L><AdminAuth /></L>} />
            <Route path="/home" element={<ProtectedRoute><L><Home /></L></ProtectedRoute>} />
            <Route path="/index" element={<ProtectedRoute><L><Index /></L></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><L><Dashboard /></L></ProtectedRoute>} />
            <Route path="/publications" element={<ProtectedRoute><L><Publications /></L></ProtectedRoute>} />
            <Route path="/business-account" element={<ProtectedRoute><L><BusinessAccount /></L></ProtectedRoute>} />
            <Route path="/business-dashboard" element={<ProtectedRoute><L><BusinessDashboard /></L></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><L><Shop /></L></ProtectedRoute>} />
            <Route path="/category/:slug" element={<ProtectedRoute><L><CategoryPage /></L></ProtectedRoute>} />
            <Route path="/explore-map" element={<ProtectedRoute><L><ExploreMap /></L></ProtectedRoute>} />
            <Route path="/boutique/:businessId" element={<ProtectedRoute><L><VendorShop /></L></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><L><Favorites /></L></ProtectedRoute>} />
            <Route path="/followed-shops" element={<ProtectedRoute><L><FollowedShops /></L></ProtectedRoute>} />
            <Route path="/gifts" element={<ProtectedRoute><L><Gifts /></L></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><L><Cart /></L></ProtectedRoute>} />
            <Route path="/preferences" element={<ProtectedRoute><L><Preferences /></L></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><L><Checkout /></L></ProtectedRoute>} />
            <Route path="/collective-checkout" element={<ProtectedRoute><L><CollectiveCheckout /></L></ProtectedRoute>} />
            <Route path="/collective-order-confirmation" element={<ProtectedRoute><L><CollectiveOrderConfirmation /></L></ProtectedRoute>} />
            <Route path="/order-confirmation" element={<ProtectedRoute><L><OrderConfirmation /></L></ProtectedRoute>} />
            <Route path="/notification-settings" element={<ProtectedRoute><L><NotificationSettings /></L></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><L><Community /></L></ProtectedRoute>} />
            <Route path="/reciprocity-profile" element={<ProtectedRoute><L><ReciprocityProfile /></L></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><L><UserProfile /></L></ProtectedRoute>} />
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

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </AnimatedRoutes>
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
