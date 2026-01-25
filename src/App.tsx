import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import AdminAuth from "./pages/AdminAuth";
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
import Index from "./pages/Index";
import Home from "./pages/Home";
import Install from "./pages/Install";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import BusinessAuth from "./pages/BusinessAuth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Publications from "./pages/Publications";
import BusinessAccount from "./pages/BusinessAccount";
import BusinessDashboard from "./pages/BusinessDashboard";
import Shop from "./pages/Shop";
import VendorShop from "./pages/VendorShop";
import Favorites from "./pages/Favorites";
import FollowedShops from "./pages/FollowedShops";
import Gifts from "./pages/Gifts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CollectiveCheckout from "./pages/CollectiveCheckout";
import CollectiveOrderConfirmation from "./pages/CollectiveOrderConfirmation";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotificationSettings from "./pages/NotificationSettings";
import Preferences from "./pages/Preferences";
import Community from "./pages/Community";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import UserManagement from "./pages/Admin/UserManagement";
import BusinessManagement from "./pages/Admin/BusinessManagement";
import ContentModeration from "./pages/Admin/ContentModeration";
import FinancialManagement from "./pages/Admin/FinancialManagement";
import Analytics from "./pages/Admin/Analytics";
import AdminManagement from "./pages/Admin/AdminManagement";
import AuditLogs from "./pages/Admin/AuditLogs";
import Settings from "./pages/Admin/Settings";
import ReciprocityDashboard from "./pages/Admin/ReciprocityDashboard";
import BusinessAnalytics from "./pages/Admin/BusinessAnalytics";
import RealtimeDashboard from "./pages/Admin/RealtimeDashboard";
import AlertsHistory from "./pages/Admin/AlertsHistory";
import NotificationAnalytics from "./pages/Admin/NotificationAnalytics";
import ProfileCompletionDashboard from "./pages/Admin/ProfileCompletionDashboard";
import DuplicateAccountsDashboard from "./pages/Admin/DuplicateAccountsDashboard";
import DeletedBusinesses from "./pages/Admin/DeletedBusinesses";
import DeletedClients from "./pages/Admin/DeletedClients";
import AdminPerformanceDashboard from "./pages/Admin/AdminPerformanceDashboard";
import CountryPerformanceDashboard from "./pages/Admin/CountryPerformanceDashboard";
import CountryDetailPage from "./pages/Admin/CountryDetailPage";
import CountryObjectivesPage from "./pages/Admin/CountryObjectivesPage";
import CountryMonthlyComparisonPage from "./pages/Admin/CountryMonthlyComparisonPage";
import ForecastPage from "./pages/Admin/ForecastPage";
import OrdersManagement from "./pages/Admin/OrdersManagement";
import AdminNotificationsPage from "./pages/Admin/AdminNotificationsPage";
import ShareAnalytics from "./pages/Admin/ShareAnalytics";
import IndexNowAnalytics from "./pages/Admin/IndexNowAnalytics";
import ReciprocityProfile from "./pages/ReciprocityProfile";
import UserProfile from "./pages/UserProfile";
import Invitations from "./pages/Invitations";
import ReferralCodes from "./pages/ReferralCodes";
import ProfileSettings from "./pages/ProfileSettings";
import BusinessProfileSettings from "./pages/BusinessProfileSettings";
import Orders from "./pages/Orders";
import GiftIdeas from "./pages/GiftIdeas";
import BusinessCollectiveFundsManagement from "./pages/BusinessCollectiveFundsManagement";
import { AdminRoute } from "./components/AdminRoute";
import { AIChatWidget } from "./components/AIChatWidget";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LegalNotice from "./pages/LegalNotice";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AccountLinking from "./pages/AccountLinking";
import ProductPreview from "./pages/ProductPreview";
import FundPreview from "./pages/FundPreview";
import BusinessPreview from "./pages/BusinessPreview";
import ExploreMap from "./pages/ExploreMap";

// Public pages (lazy loaded)
const PublicFundsPage = lazy(() => import("./pages/PublicFundsPage"));

// AI-only pages (lazy loaded)
const AIInfo = lazy(() => import("./pages/AIInfo"));
const AICatalog = lazy(() => import("./pages/AICatalog"));
const AIProducts = lazy(() => import("./pages/AIProducts"));

// SEO City pages (lazy loaded)
const CityPage = lazy(() => import("./pages/CityPage"));
const CitiesOverview = lazy(() => import("./pages/CitiesOverview"));

// Category page (lazy loaded for SEO)
const CategoryPage = lazy(() => import("./pages/CategoryPage"));

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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/legal-notice" element={<LegalNotice />} />
            <Route path="/faq" element={<FAQ />} />
<Route path="/about" element={<About />} />
<Route path="/contact" element={<Contact />} />
<Route path="/install" element={<Install />} />
{/* Public product preview with OG meta tags */}
<Route path="/p/:productId" element={<ProductPreview />} />
{/* Public fund preview with OG meta tags */}
<Route path="/f/:fundId" element={<FundPreview />} />
{/* Public funds listing page */}
<Route path="/cagnottes" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
    <PublicFundsPage />
  </Suspense>
} />
{/* Public business preview with OG meta tags */}
<Route path="/b/:businessId" element={<BusinessPreview />} />
{/* AI Information page with structured JSON-LD data */}
<Route path="/ai-info" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
    <AIInfo />
  </Suspense>
} />
{/* AI Catalog JSON endpoint for AI agents */}
<Route path="/api/ai-catalog" element={
  <Suspense fallback={<pre style={{ padding: "20px", fontFamily: "monospace" }}>Loading catalog...</pre>}>
    <AICatalog />
  </Suspense>
} />
{/* AI Products API with filters for AI agents */}
<Route path="/api/products" element={
  <Suspense fallback={<pre style={{ padding: "20px", fontFamily: "monospace" }}>Loading products...</pre>}>
    <AIProducts />
  </Suspense>
} />
{/* Cities Overview with Interactive Map */}
<Route path="/villes" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
    <CitiesOverview />
  </Suspense>
} />
{/* SEO City Landing Pages */}
<Route path="/:citySlug" element={
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
    <CityPage />
  </Suspense>
} />
<Route path="/auth" element={<Auth />} />
<Route path="/business-auth" element={<BusinessAuth />} />
            {/* Redirects for removed waitlist/pending pages */}
            <Route path="/business-waitlist" element={<Navigate to="/business-auth" replace />} />
            <Route path="/devenir-prestataire" element={<Navigate to="/business-auth" replace />} />
            <Route path="/admin-auth" element={<AdminAuth />} />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/index" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/publications" element={
              <ProtectedRoute>
                <Publications />
              </ProtectedRoute>
            } />
            <Route path="/business-account" element={
              <ProtectedRoute>
                <BusinessAccount />
              </ProtectedRoute>
            } />
            <Route path="/business-dashboard" element={
              <ProtectedRoute>
                <BusinessDashboard />
              </ProtectedRoute>
            } />
            <Route path="/shop" element={
              <ProtectedRoute>
                <Shop />
              </ProtectedRoute>
            } />
            <Route path="/category/:slug" element={
              <ProtectedRoute>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
                  <CategoryPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/explore-map" element={
              <ProtectedRoute>
                <ExploreMap />
              </ProtectedRoute>
            } />
            <Route path="/boutique/:businessId" element={
              <ProtectedRoute>
                <VendorShop />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            } />
            <Route path="/followed-shops" element={
              <ProtectedRoute>
                <FollowedShops />
              </ProtectedRoute>
            } />
            <Route path="/gifts" element={
              <ProtectedRoute>
                <Gifts />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/preferences" element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/collective-checkout" element={
              <ProtectedRoute>
                <CollectiveCheckout />
              </ProtectedRoute>
            } />
            <Route path="/collective-order-confirmation" element={
              <ProtectedRoute>
                <CollectiveOrderConfirmation />
              </ProtectedRoute>
            } />
            <Route path="/order-confirmation" element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            } />
            <Route path="/notification-settings" element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            } />
            <Route path="/reciprocity-profile" element={
              <ProtectedRoute>
                <ReciprocityProfile />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/invitations" element={
              <ProtectedRoute>
                <Invitations />
              </ProtectedRoute>
            } />
            <Route path="/referral-codes" element={
              <ProtectedRoute>
                <ReferralCodes />
              </ProtectedRoute>
            } />
            <Route path="/profile-settings" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            <Route path="/business-profile-settings" element={
              <ProtectedRoute>
                <BusinessProfileSettings />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/business-collective-funds" element={
              <ProtectedRoute>
                <BusinessCollectiveFundsManagement />
              </ProtectedRoute>
            } />
            <Route path="/gift-ideas/:contactId" element={
              <ProtectedRoute>
                <GiftIdeas />
              </ProtectedRoute>
            } />
            <Route path="/account-linking" element={
              <ProtectedRoute>
                <AccountLinking />
              </ProtectedRoute>
            } />
            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/realtime" element={
              <AdminRoute>
                <RealtimeDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/alerts" element={
              <AdminRoute>
                <AlertsHistory />
              </AdminRoute>
            } />
            <Route path="/admin/notifications" element={
              <AdminRoute>
                <NotificationAnalytics />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
            <Route path="/admin/profile-completion" element={
              <AdminRoute>
                <ProfileCompletionDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/duplicates" element={
              <AdminRoute>
                <DuplicateAccountsDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/businesses" element={
              <AdminRoute>
                <BusinessManagement />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <OrdersManagement />
              </AdminRoute>
            } />
            <Route path="/admin/deleted-businesses" element={
              <AdminRoute requiredRole="super_admin">
                <DeletedBusinesses />
              </AdminRoute>
            } />
            <Route path="/admin/deleted-clients" element={
              <AdminRoute requiredRole="super_admin">
                <DeletedClients />
              </AdminRoute>
            } />
            <Route path="/admin/admin-notifications" element={
              <AdminRoute>
                <AdminNotificationsPage />
              </AdminRoute>
            } />
            {/* Redirect removed waitlist admin page */}
            <Route path="/admin/waitlist" element={<Navigate to="/admin/businesses" replace />} />
            <Route path="/admin/business-analytics" element={
              <AdminRoute>
                <BusinessAnalytics />
              </AdminRoute>
            } />
            <Route path="/admin/content" element={
              <AdminRoute>
                <ContentModeration />
              </AdminRoute>
            } />
            <Route path="/admin/finances" element={
              <AdminRoute>
                <FinancialManagement />
              </AdminRoute>
            } />
            <Route path="/admin/analytics" element={
              <AdminRoute>
                <Analytics />
              </AdminRoute>
            } />
            <Route path="/admin/share-analytics" element={
              <AdminRoute>
                <ShareAnalytics />
              </AdminRoute>
            } />
            <Route path="/admin/indexnow" element={
              <AdminRoute>
                <IndexNowAnalytics />
              </AdminRoute>
            } />
            <Route path="/admin/reciprocity" element={
              <AdminRoute>
                <ReciprocityDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/settings" element={
              <AdminRoute requiredRole="super_admin">
                <Settings />
              </AdminRoute>
            } />
            <Route path="/admin/admins" element={
              <AdminRoute requiredRole="super_admin">
                <AdminManagement />
              </AdminRoute>
            } />
            <Route path="/admin/audit" element={
              <AdminRoute>
                <AuditLogs />
              </AdminRoute>
            } />
            <Route path="/admin/performance" element={
              <AdminRoute>
                <AdminPerformanceDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/countries" element={
              <AdminRoute>
                <CountryPerformanceDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/countries/:countryCode" element={
              <AdminRoute>
                <CountryDetailPage />
              </AdminRoute>
            } />
            <Route path="/admin/countries/objectives" element={
              <AdminRoute>
                <CountryObjectivesPage />
              </AdminRoute>
            } />
            <Route path="/admin/countries/comparison" element={
              <AdminRoute>
                <CountryMonthlyComparisonPage />
              </AdminRoute>
            } />
            <Route path="/admin/forecast" element={
              <AdminRoute>
                <ForecastPage />
              </AdminRoute>
            } />
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