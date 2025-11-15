import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import BusinessAuth from "./pages/BusinessAuth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Publications from "./pages/Publications";
import BusinessAccount from "./pages/BusinessAccount";
import BusinessDashboard from "./pages/BusinessDashboard";
import Shop from "./pages/Shop";
import Favorites from "./pages/Favorites";
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
import ReciprocityProfile from "./pages/ReciprocityProfile";
import UserProfile from "./pages/UserProfile";
import Invitations from "./pages/Invitations";
import ReferralCodes from "./pages/ReferralCodes";
import { AdminRoute } from "./components/AdminRoute";
import { AIChatWidget } from "./components/AIChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/business-auth" element={<BusinessAuth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
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
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites />
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
            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
            <Route path="/admin/businesses" element={
              <AdminRoute>
                <BusinessManagement />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
