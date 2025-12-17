import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Gift, TrendingUp, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { PostCard } from "@/components/PostCard";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { toast } from "sonner";

interface UserProfileData {
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  is_visible: boolean;
  privacy_setting: string | null;
}

interface UserStats {
  friends_count: number;
  gifts_given: number;
  community_points: number;
  followers_count: number;
  following_count: number;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasBusinessAccount } = useBusinessAccount();
  const { posts, loading: postsLoading, toggleReaction, refreshPosts } = usePosts();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [profileExists, setProfileExists] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    friends_count: 0,
    gifts_given: 0,
    community_points: 0,
    followers_count: 0,
    following_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserStats();
      checkFollowStatus();
    }
  }, [userId, currentUser?.id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Utiliser la fonction RPC qui respecte la confidentialité
      const { data, error } = await supabase
        .rpc('get_user_profile_with_privacy', {
          p_viewer_id: currentUser?.id || null,
          p_target_user_id: userId
        });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        setProfileExists(true);
      } else {
        setProfile(null);
        setProfileExists(false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setProfileExists(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Count gifts given (from post reactions)
      const { count: giftsGiven } = await supabase
        .from('post_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('reaction_type', 'gift');

      // Count friends from contacts
      const { count: friendsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get reciprocity score - try different column names
      const { data: reciprocityData } = await supabase
        .from('reciprocity_scores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Extract score from reciprocity data (handle different possible column names)
      const communityPoints = reciprocityData 
        ? (reciprocityData as any).total_score || (reciprocityData as any).score || 0 
        : 0;

      // Count followers
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Count following
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setStats({
        friends_count: friendsCount || 0,
        gifts_given: giftsGiven || 0,
        community_points: communityPoints,
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default stats on error
      setStats({
        friends_count: 0,
        gifts_given: 0,
        community_points: 0,
        followers_count: 0,
        following_count: 0
      });
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser?.id || !userId || currentUser.id === userId) return;

    try {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.id || !userId) return;

    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        setStats(prev => ({
          ...prev,
          followers_count: Math.max(0, prev.followers_count - 1)
        }));
        toast.success('Abonnement retiré');
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });

        if (error) throw error;

        setIsFollowing(true);
        setStats(prev => ({
          ...prev,
          followers_count: prev.followers_count + 1
        }));
        toast.success('Abonnement ajouté');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setFollowLoading(false);
    }
  };

  const userName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`
    : 'Utilisateur';
  
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const userPosts = posts.filter(post => post.user_id === userId);
  const isOwnProfile = currentUser?.id === userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Profil</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Profil non trouvé
  if (!profileExists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Profil</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Profil non trouvé</p>
        </div>
      </div>
    );
  }

  // Profil privé (existe mais non visible)
  if (profile && !profile.is_visible) {
    const privacyMessage = profile.privacy_setting === 'friends_only' 
      ? 'Ce profil est réservé aux amis uniquement'
      : 'Ce profil est privé';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Profil</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="p-8 text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Profil restreint</h2>
            <p className="text-muted-foreground text-sm">{privacyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Profil visible mais sans données (fallback)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Profil</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">Profil non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Profil</h1>
          {isOwnProfile ? (
            hasBusinessAccount ? <BusinessProfileDropdown /> : <ProfileDropdown />
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-4 space-y-4">
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
          <CardHeader className="text-center pb-3">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              {profile.avatar_url && (
                <AvatarImage 
                  src={profile.avatar_url} 
                  alt={userName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-medium text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">{userName}</h2>
            {profile.city && (
              <p className="text-sm text-muted-foreground">{profile.city}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-foreground mt-3 px-4">{profile.bio}</p>
            )}
            
            {/* Follow button (only show for other users) */}
            {!isOwnProfile && currentUser && (
              <div className="mt-4">
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Ne plus suivre
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Suivre
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Stats */}
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-xl font-bold text-foreground">{stats.friends_count}</div>
                <div className="text-xs text-muted-foreground">Amis</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Gift className="h-5 w-5 text-secondary" />
                  </div>
                </div>
                <div className="text-xl font-bold text-foreground">{stats.gifts_given}</div>
                <div className="text-xs text-muted-foreground">Cadeaux</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-accent/10 p-2 rounded-full">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <div className="text-xl font-bold text-foreground">{stats.community_points}</div>
                <div className="text-xs text-muted-foreground">Points</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <UserPlus className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="text-xl font-bold text-foreground">{stats.followers_count}</div>
                <div className="text-xs text-muted-foreground">Abonnés</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-green-500/10 p-2 rounded-full">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="text-xl font-bold text-foreground">{stats.following_count}</div>
                <div className="text-xs text-muted-foreground">Abonné</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publications */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground px-1">Publications</h3>
          {postsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id || null}
                toggleReaction={toggleReaction}
                refreshPosts={refreshPosts}
              />
            ))
          ) : (
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Aucune publication pour le moment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
