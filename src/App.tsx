import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
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
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
