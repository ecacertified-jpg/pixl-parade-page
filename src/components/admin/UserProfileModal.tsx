import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Gift, Heart, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
}

interface UserStats {
  giftsGiven: number;
  giftsReceived: number;
  fundsCreated: number;
  friendsCount: number;
}

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ userId, open, onOpenChange }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    giftsGiven: 0,
    giftsReceived: 0,
    fundsCreated: 0,
    friendsCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [userId, open]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      // Gifts given
      const { count: giftsGiven } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .eq('giver_id', userId);

      // Gifts received
      const { count: giftsReceived } = await supabase
        .from('gifts')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId);

      // Funds created
      const { count: fundsCreated } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Friends count
      const { count: friendsCount } = await supabase
        .from('contact_relationships')
        .select('*', { count: 'exact', head: true })
        .or(`user_a.eq.${userId},user_b.eq.${userId}`);

      setStats({
        giftsGiven: giftsGiven || 0,
        giftsReceived: giftsReceived || 0,
        fundsCreated: fundsCreated || 0,
        friendsCount: friendsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!profile && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil utilisateur</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header with avatar and name */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback>
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {profile.first_name} {profile.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.phone}</p>
                {profile.is_suspended && (
                  <Badge variant="destructive" className="mt-2">
                    Compte suspendu
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Bio */}
            {profile.bio && (
              <div>
                <h4 className="font-medium mb-2">Bio</h4>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {/* Suspension info */}
            {profile.is_suspended && profile.suspension_reason && (
              <div className="bg-destructive/10 p-4 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Raison de la suspension</h4>
                <p className="text-sm">{profile.suspension_reason}</p>
                {profile.suspended_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Suspendu le {new Date(profile.suspended_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <Separator />

            {/* Statistics */}
            <div>
              <h4 className="font-medium mb-4">Statistiques</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Gift className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cadeaux donnés</p>
                    <p className="text-lg font-semibold">{stats.giftsGiven}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cadeaux reçus</p>
                    <p className="text-lg font-semibold">{stats.giftsReceived}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cagnottes créées</p>
                    <p className="text-lg font-semibold">{stats.fundsCreated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Amis</p>
                    <p className="text-lg font-semibold">{stats.friendsCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account info */}
            <div>
              <h4 className="font-medium mb-2">Informations du compte</h4>
              <p className="text-sm text-muted-foreground">
                Membre depuis le {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
