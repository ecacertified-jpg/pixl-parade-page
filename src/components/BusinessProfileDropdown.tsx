import { User, Store, LayoutDashboard, Package, LogOut, TrendingUp, Settings2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cleanupCorruptedSession } from "@/utils/authErrorHandler";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";

export const BusinessProfileDropdown = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { businessAccount } = useBusinessAccount();
  const { stats, loading: statsLoading } = useBusinessAnalytics(businessAccount?.id);

  // Simulate pending orders count (in production, this would come from a hook)
  const pendingOrdersCount = stats?.monthlyOrders && stats.monthlyOrders > 0 ? Math.min(stats.monthlyOrders, 5) : 0;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Sign out error:', error);
      await cleanupCorruptedSession();
    } finally {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur JOIE DE VIVRE !"
      });
      navigate("/auth", { replace: true });
    }
  };

  const businessName = businessAccount?.business_name || "Mon Business";
  const businessHandle = `@${businessName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative cursor-pointer p-2 rounded-full hover:bg-muted/50 transition-colors">
          <Store className="h-6 w-6 text-primary" />
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full animate-pulse">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 sm:w-80 p-0 bg-background border shadow-lg rounded-xl z-[100] flex flex-col max-h-[80vh]"
        sideOffset={5}
      >
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          {/* Business Profile Header - Compact */}
          <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base truncate">{businessName}</h3>
                <p className="text-muted-foreground text-xs truncate">{businessHandle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={businessAccount?.is_active ? "default" : "secondary"}
                    className={`text-xs py-0 ${businessAccount?.is_active ? 'bg-green-500/90 hover:bg-green-500' : ''}`}
                  >
                    {businessAccount?.is_active ? "✓ Actif" : "Inactif"}
                  </Badge>
                  <span className="text-muted-foreground text-xs truncate">
                    {businessAccount?.business_type || ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Statistics - Compact */}
          <div className="px-4 py-3 bg-background border-b border-border">
            <div className="flex justify-between text-center">
              <div className="flex-1">
                {statsLoading ? (
                  <Skeleton className="h-5 w-10 mx-auto mb-1" />
                ) : (
                  <div className="font-bold text-foreground">{stats?.activeProducts || 0}</div>
                )}
                <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                  <Package className="h-3 w-3 text-blue-500" />
                  Produits
                </div>
              </div>
              <div className="flex-1">
                {statsLoading ? (
                  <Skeleton className="h-5 w-10 mx-auto mb-1" />
                ) : (
                  <div className="font-bold text-foreground flex items-center justify-center gap-1">
                    {stats?.monthlyOrders || 0}
                    {pendingOrdersCount > 0 && (
                      <span className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                    )}
                  </div>
                )}
                <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                  <ShoppingBag className="h-3 w-3 text-orange-500" />
                  Commandes
                </div>
              </div>
              <div className="flex-1">
                {statsLoading ? (
                  <Skeleton className="h-5 w-10 mx-auto mb-1" />
                ) : (
                  <div className="font-bold text-foreground">
                    {stats?.averageProductRating ? stats.averageProductRating.toFixed(1) : '-'}
                  </div>
                )}
                <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                  <span className="text-yellow-500">★</span>
                  Note
                </div>
              </div>
            </div>
          </div>

          {/* Business Navigation Menu - Compact */}
          <div className="p-2 bg-background">
            <button 
              onClick={() => navigate("/business-account")}
              className="w-full flex items-center px-3 py-2.5 text-left text-foreground hover:bg-primary/10 rounded-lg transition-colors group"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center mr-2.5 group-hover:bg-primary/20 transition-colors">
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium">Tableau de bord</span>
            </button>
            
            <button 
              onClick={() => navigate("/business-account")}
              className="w-full flex items-center px-3 py-2.5 text-left text-foreground hover:bg-blue-500/10 rounded-lg transition-colors group"
            >
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center mr-2.5 group-hover:bg-blue-500/20 transition-colors">
                <Package className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="text-sm font-medium">Mes produits</span>
              {stats?.activeProducts && stats.activeProducts > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs py-0 px-1.5">
                  {stats.activeProducts}
                </Badge>
              )}
            </button>
            
            <button 
              onClick={() => navigate("/business-account")}
              className="w-full flex items-center px-3 py-2.5 text-left text-foreground hover:bg-green-500/10 rounded-lg transition-colors group"
            >
              <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center mr-2.5 group-hover:bg-green-500/20 transition-colors">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              </div>
              <span className="text-sm font-medium">Statistiques</span>
            </button>

            <button 
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center px-3 py-2.5 text-left text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors group"
            >
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center mr-2.5 group-hover:bg-muted/80 transition-colors">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">Mode client</span>
            </button>

            <button 
              onClick={() => navigate("/business-profile-settings")}
              className="w-full flex items-center px-3 py-2.5 text-left text-foreground hover:bg-orange-500/10 rounded-lg transition-colors group"
            >
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center mr-2.5 group-hover:bg-orange-500/20 transition-colors">
                <Settings2 className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <span className="text-sm font-medium">Paramètres entreprise</span>
            </button>
          </div>
        </ScrollArea>

        {/* Sign out button - always visible at bottom */}
        <div className="p-2 border-t border-border bg-background flex-shrink-0">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2.5 text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
          >
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center mr-2.5 group-hover:bg-destructive/20 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
