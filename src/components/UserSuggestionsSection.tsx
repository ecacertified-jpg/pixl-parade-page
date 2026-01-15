import { useState } from "react";
import { UserPlus, Users, X, Share2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteFriendsModal } from "@/components/InviteFriendsModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isValidImageUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSuggestions } from "@/hooks/useUserSuggestions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CountryBadge } from "@/components/CountryBadge";

export function UserSuggestionsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { suggestions, loading, refreshSuggestions } = useUserSuggestions(5);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const handleFollow = async (userId: string) => {
    if (!user?.id) return;

    try {
      setActionLoading(userId);
      
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;

      setFollowingUsers(prev => new Set(prev).add(userId));
      toast.success('Abonnement ajouté');
      
      // Refresh suggestions after a short delay
      setTimeout(() => {
        refreshSuggestions();
      }, 1000);
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissedUsers(prev => new Set(prev).add(userId));
  };

  const visibleSuggestions = suggestions.filter(
    s => !followingUsers.has(s.user_id) && !dismissedUsers.has(s.user_id)
  );

  if (loading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Suggestions pour vous
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!loading && visibleSuggestions.length === 0) {
    return (
      <>
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Aucune suggestion pour le moment</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Nous n'avons pas encore trouvé d'utilisateurs à vous suggérer. Pour découvrir de nouvelles personnes :
                </p>
              </div>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <UserPlus className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                  <span>Participez à la communauté en publiant et en réagissant aux posts</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Users className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                  <span>Complétez votre profil avec une photo et une bio</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Share2 className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                  <span>Invitez vos amis à rejoindre Joie de Vivre</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setInviteModalOpen(true)}
                className="mt-4"
              >
                <Mail className="w-4 h-4 mr-2" />
                Inviter des amis
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <InviteFriendsModal 
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
        />
      </>
    );
  }

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Suggestions pour vous
            </CardTitle>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setInviteModalOpen(true)}
            >
              <Mail className="w-4 h-4 mr-1" />
              Inviter
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-3">
        {visibleSuggestions.map((suggestion) => {
          const userName = suggestion.first_name
            ? `${suggestion.first_name} ${suggestion.last_name || ''}`
            : 'Utilisateur';
          const userInitials = userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();

          return (
            <div
              key={suggestion.user_id}
              className="flex items-start gap-3 group"
            >
              <Avatar
                className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${suggestion.user_id}`)}
              >
                {isValidImageUrl(suggestion.avatar_url) && (
                  <AvatarImage
                    src={suggestion.avatar_url}
                    alt={userName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h4
                  className="font-medium text-sm text-foreground cursor-pointer hover:underline truncate"
                  onClick={() => navigate(`/profile/${suggestion.user_id}`)}
                >
                  {userName}
                </h4>
                <CountryBadge countryCode={suggestion.country_code} variant="minimal" />
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {suggestion.reason}
                </p>
                {suggestion.bio && (
                  <p className="text-xs text-muted-foreground/80 line-clamp-1 mt-1">
                    {suggestion.bio}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(suggestion.user_id)}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleFollow(suggestion.user_id)}
                  disabled={actionLoading === suggestion.user_id}
                  className="gap-1 h-8"
                >
                  <UserPlus className="h-3 w-3" />
                  <span className="text-xs">Suivre</span>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
    
    <InviteFriendsModal 
      open={inviteModalOpen}
      onOpenChange={setInviteModalOpen}
    />
    </>
  );
}
