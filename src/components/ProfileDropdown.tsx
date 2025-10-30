import { User, BarChart3, Heart, Users, LogOut, Edit3, Store, Settings } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditBioModal } from "@/components/EditBioModal";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { useUserStats } from "@/hooks/useUserStats";

export const ProfileDropdown = () => {
  // Force rebuild - ProfileDropdown component
  const { user, loading, hasBusinessAccount } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { stats, loading: statsLoading } = useUserStats();
  const [userProfile, setUserProfile] = useState<{ first_name?: string; last_name?: string; bio?: string }>({});
  const [isEditBioModalOpen, setIsEditBioModalOpen] = useState(false);

  // Debug: Log user data and business account status
  console.log('ProfileDropdown - User:', user);
  console.log('ProfileDropdown - Loading:', loading);
  console.log('ProfileDropdown - hasBusinessAccount:', hasBusinessAccount);

  // Fetch user profile from profiles table
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, bio')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        setUserProfile(data || {});
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

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

  const userName = userProfile?.first_name || user?.user_metadata?.first_name || "Utilisateur";
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
            <div 
              className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors group"
              onClick={() => setIsEditBioModalOpen(true)}
            >
              <p className="text-muted-foreground text-xs">
                {userProfile?.bio || "Ajouter une bio..."}
              </p>
              <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-6 py-4 bg-background border-b border-border">
          <div className="flex justify-between text-center">
            <div className="flex-1">
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
              ) : (
                <div className="font-bold text-foreground text-lg">{stats.friendsCount}</div>
              )}
              <div className="text-muted-foreground text-xs">Amis</div>
            </div>
            <div className="flex-1">
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
              ) : (
                <div className="font-bold text-foreground text-lg">{stats.giftsGiven}</div>
              )}
              <div className="text-muted-foreground text-xs">Donnés</div>
            </div>
            <div className="flex-1">
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
              ) : (
                <div className="font-bold text-foreground text-lg">{stats.communityPoints}</div>
              )}
              <div className="text-muted-foreground text-xs">Points</div>
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
            onClick={() => navigate("/publications")}
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


          {hasBusinessAccount && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="px-2">
                <ModeSwitcher variant="menu-item" />
              </div>
            </>
          )}

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
      
      {/* Edit Bio Modal */}
      <EditBioModal
        isOpen={isEditBioModalOpen}
        onClose={() => setIsEditBioModalOpen(false)}
        currentBio={userProfile?.bio || ""}
        userId={user?.id || ""}
        onBioUpdate={(newBio) => setUserProfile({ ...userProfile, bio: newBio })}
      />
    </DropdownMenu>
  );
};