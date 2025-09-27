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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      <DropdownMenuContent align="end" className="w-80 p-0 bg-white border-0 shadow-lg rounded-xl overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <Avatar className="w-16 h-16 mb-4 bg-gray-200">
              <AvatarFallback className="bg-gray-200 text-gray-500">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            {/* User Info */}
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{userName}</h3>
            <p className="text-gray-600 text-sm mb-2">{userHandle}</p>
            <p className="text-gray-500 text-xs">Bio de l'utilisateur</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">128</div>
              <div className="text-gray-500 text-xs">Suivis</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">64</div>
              <div className="text-gray-500 text-xs">Followers</div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">10</div>
              <div className="text-gray-500 text-xs">Amis</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-2 bg-white">
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <BarChart3 className="h-4 w-4 mr-3 text-gray-500" />
            <span className="text-sm font-medium">Tableau de bord</span>
          </button>
          
          <button 
            onClick={() => navigate("/gifts")}
            className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Users className="h-4 w-4 mr-3 text-gray-500" />
            <span className="text-sm font-medium">Publications</span>
          </button>
          
          <button 
            onClick={() => navigate("/favorites")}
            className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Heart className="h-4 w-4 mr-3 text-gray-500" />
            <span className="text-sm font-medium">Articles préférés</span>
          </button>

          <DropdownMenuSeparator className="my-2" />
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span className="text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};