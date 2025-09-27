import { User, BarChart3, Heart, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const ProfileDropdown = () => {
  // Force rebuild - ProfileDropdown component
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug: Log user data
  console.log('ProfileDropdown - User:', user);
  console.log('ProfileDropdown - Loading:', loading);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt sur JOIE DE VIVRE !"
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Utilisateur";
  const userHandle = `@${userName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative cursor-pointer p-2 rounded-full hover:bg-muted/50 transition-colors">
          <User className="h-6 w-6 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 sm:w-80 p-0 bg-background border shadow-lg rounded-xl overflow-hidden z-[100]"
        sideOffset={5}
      >
        {/* Profile Header */}
        <div className="p-6 bg-muted/30">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <Avatar className="w-16 h-16 mb-4 bg-muted">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            {/* User Info */}
            <h3 className="font-semibold text-foreground text-lg mb-1">{userName}</h3>
            <p className="text-muted-foreground text-sm mb-2">{userHandle}</p>
            <p className="text-muted-foreground text-xs">Bio de l'utilisateur</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-6 py-4 bg-background border-b border-border">
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">128</div>
              <div className="text-muted-foreground text-xs">Suivis</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">64</div>
              <div className="text-muted-foreground text-xs">Followers</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-foreground text-lg">10</div>
              <div className="text-muted-foreground text-xs">Amis</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-2 bg-background">
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <BarChart3 className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Tableau de bord</span>
          </button>
          
          <button 
            onClick={() => navigate("/gifts")}
            className="w-full flex items-center px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Users className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Publications</span>
          </button>
          
          <button 
            onClick={() => navigate("/favorites")}
            className="w-full flex items-center px-4 py-3 text-left text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Heart className="h-4 w-4 mr-3 text-muted-foreground" />
            <span className="text-sm font-medium">Articles préférés</span>
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