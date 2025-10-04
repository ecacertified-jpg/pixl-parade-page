import { User, Store, BarChart3, Package, LogOut, Edit3, Settings, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";

export const BusinessProfileDropdown = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { businessAccount } = useBusinessAccount();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur JOIE DE VIVRE !"
      });
      
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const businessName = businessAccount?.business_name || "Mon Business";
  const businessHandle = `@${businessName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative cursor-pointer p-2 rounded-full hover:bg-muted/50 transition-colors">
          <Store className="h-6 w-6 text-primary" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 sm:w-80 p-0 bg-background border shadow-lg rounded-xl overflow-hidden z-[100]"
        sideOffset={5}
      >
        {/* Business Profile Header */}
        <div className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex flex-col items-center text-center">
            {/* Business Avatar */}
            <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Store className="h-8 w-8 text-primary" />
            </div>
            
            {/* Business Info */}
            <h3 className="font-semibold text-foreground text-lg mb-1">{businessName}</h3>
            <p className="text-muted-foreground text-sm mb-2">{businessHandle}</p>
            <Badge 
              variant={businessAccount?.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {businessAccount?.is_active ? "Actif" : "Inactif"}
            </Badge>
            <p className="text-muted-foreground text-xs mt-2">
              {businessAccount?.business_type || "Type d'activité"}
            </p>
          </div>
        </div>

        {/* Business Statistics */}
        <div className="px-6 py-4 bg-background border-b border-border">
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">24</div>
              <div className="text-muted-foreground text-xs">Produits</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">156</div>
              <div className="text-muted-foreground text-xs">Commandes</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">4.8</div>
              <div className="text-muted-foreground text-xs">Note</div>
            </div>
          </div>
        </div>

        {/* Business Navigation Menu */}
        <div className="p-2 bg-background">
          <button 
            onClick={() => navigate("/business-account")}
            className="w-full flex items-center px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <BarChart3 className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Tableau de bord business</span>
          </button>
          
          <button 
            onClick={() => navigate("/business-account")}
            className="w-full flex items-center px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Package className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Mes produits</span>
          </button>
          
          <button 
            onClick={() => navigate("/business-account")}
            className="w-full flex items-center px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <TrendingUp className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Statistiques</span>
          </button>

          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center px-4 py-3 text-left text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <User className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Mode client</span>
          </button>

          <DropdownMenuSeparator className="my-2" />
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};