import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Gift, Heart, Users, Mail, Phone, MapPin, 
  Cake, Shield, CheckCircle2, XCircle, Coins, Send, 
  Award, UserPlus, PartyPopper, AlertTriangle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { fr } from "date-fns/locale";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  bio: string | null;
  city: string | null;
  birthday: string | null;
  avatar_url: string | null;
  privacy_setting: string | null;
  created_at: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  total_birthdays_celebrated: number | null;
  primary_referral_code: string | null;
  invitations_sent: number | null;
  invitations_accepted: number | null;
  total_referrals: number | null;
}

interface UserStats {
  giftsGiven: number;
  giftsReceived: number;
  fundsCreated: number;
  friendsCount: number;
  contributionsCount: number;
  totalContributed: number;
  communityPoints: number;
}

interface ProfileCompletionField {
  key: string;
  label: string;
  completed: boolean;
}

interface UserProfileModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ userId, open, onOpenChange }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    giftsGiven: 0,
    giftsReceived: 0,
    fundsCreated: 0,
    friendsCount: 0,
    contributionsCount: 0,
    totalContributed: 0,
    communityPoints: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserProfile();
      fetchUserStats();
      fetchUserEmail();
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

  const fetchUserEmail = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_user_email_for_admin', { target_user_id: userId });
      
      if (error) throw error;
      setEmail(data);
    } catch (error) {
      console.error('Error fetching email:', error);
    }
  };

  const fetchUserStats = async () => {
    if (!userId) return;

    try {
      const [
        { count: giftsGiven },
        { count: giftsReceived },
        { count: fundsCreated },
        { count: friendsCount },
        { count: contributionsCount },
        { data: contributionsData },
        { data: communityData }
      ] = await Promise.all([
        supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('giver_id', userId),
        supabase.from('gifts').select('*', { count: 'exact', head: true }).eq('receiver_id', userId),
        supabase.from('collective_funds').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
        supabase.from('contact_relationships').select('*', { count: 'exact', head: true }).or(`user_a.eq.${userId},user_b.eq.${userId}`),
        supabase.from('fund_contributions').select('*', { count: 'exact', head: true }).eq('contributor_id', userId),
        supabase.from('fund_contributions').select('amount').eq('contributor_id', userId),
        supabase.from('community_scores').select('total_points').eq('user_id', userId).single()
      ]);

      const totalContributed = contributionsData?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      setStats({
        giftsGiven: giftsGiven || 0,
        giftsReceived: giftsReceived || 0,
        fundsCreated: fundsCreated || 0,
        friendsCount: friendsCount || 0,
        contributionsCount: contributionsCount || 0,
        totalContributed,
        communityPoints: communityData?.total_points || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getProfileCompletion = (profile: UserProfile): { 
    fields: ProfileCompletionField[], 
    percentage: number 
  } => {
    const fields: ProfileCompletionField[] = [
      { key: 'first_name', label: 'Prénom', completed: !!profile.first_name },
      { key: 'last_name', label: 'Nom', completed: !!profile.last_name },
      { key: 'phone', label: 'Téléphone', completed: !!profile.phone },
      { key: 'city', label: 'Ville', completed: !!profile.city },
      { key: 'birthday', label: 'Date de naissance', completed: !!profile.birthday },
      { key: 'avatar_url', label: 'Photo de profil', completed: !!profile.avatar_url },
      { key: 'bio', label: 'Bio', completed: !!profile.bio },
    ];
    
    const completedCount = fields.filter(f => f.completed).length;
    const percentage = Math.round((completedCount / fields.length) * 100);
    
    return { fields, percentage };
  };

  const getPrivacyBadge = (setting: string | null) => {
    switch (setting) {
      case 'public':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Public</Badge>;
      case 'friends':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Amis</Badge>;
      case 'private':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Privé</Badge>;
      default:
        return <Badge variant="outline">Non défini</Badge>;
    }
  };

  const calculateAge = (birthday: string): number => {
    return differenceInYears(new Date(), new Date(birthday));
  };

  if (!profile && !loading) return null;

  const completion = profile ? getProfileCompletion(profile) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil utilisateur</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <Tabs defaultValue="informations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="space-y-6 mt-4">
              {/* Header with avatar and name */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-semibold">
                    {profile.first_name || 'Prénom non défini'} {profile.last_name || 'Nom non défini'}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.is_suspended ? (
                      <Badge variant="destructive">Compte suspendu</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Actif</Badge>
                    )}
                    {getPrivacyBadge(profile.privacy_setting)}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{email || 'Non disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium">{profile.phone || 'Non renseigné'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ville</p>
                    <p className="text-sm font-medium">{profile.city || 'Non renseignée'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Cake className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="text-sm font-medium">
                      {profile.birthday 
                        ? `${format(new Date(profile.birthday), 'dd MMMM yyyy', { locale: fr })} (${calculateAge(profile.birthday)} ans)`
                        : 'Non renseignée'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">Bio</h4>
                  <p className="text-sm text-muted-foreground">{profile.bio}</p>
                </div>
              )}

              <Separator />

              {/* Profile completion */}
              {completion && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Complétion du profil</h4>
                    <span className={`text-sm font-semibold ${
                      completion.percentage === 100 ? 'text-green-600' : 
                      completion.percentage >= 70 ? 'text-yellow-600' : 'text-orange-600'
                    }`}>
                      {completion.percentage}%
                    </span>
                  </div>
                  <Progress value={completion.percentage} className="h-2" />
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {completion.fields.map((field) => (
                      <Badge 
                        key={field.key}
                        variant="outline" 
                        className={field.completed 
                          ? "bg-green-500/10 text-green-600 border-green-500/30" 
                          : "bg-red-500/10 text-red-600 border-red-500/30"
                        }
                      >
                        {field.completed ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspension info */}
              {profile.is_suspended && profile.suspension_reason && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <h4 className="font-medium text-destructive">Raison de la suspension</h4>
                    </div>
                    <p className="text-sm">{profile.suspension_reason}</p>
                    {profile.suspended_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Suspendu le {format(new Date(profile.suspended_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Account info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis le {format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                {profile.primary_referral_code && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Code : {profile.primary_referral_code}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="statistiques" className="space-y-6 mt-4">
              {/* Main stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg text-center">
                  <Gift className="h-6 w-6 text-primary mb-2" />
                  <p className="text-2xl font-bold">{stats.giftsGiven}</p>
                  <p className="text-xs text-muted-foreground">Cadeaux donnés</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg text-center">
                  <Heart className="h-6 w-6 text-pink-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.giftsReceived}</p>
                  <p className="text-xs text-muted-foreground">Cadeaux reçus</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg text-center">
                  <Users className="h-6 w-6 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.friendsCount}</p>
                  <p className="text-xs text-muted-foreground">Amis</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg text-center">
                  <Award className="h-6 w-6 text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{stats.communityPoints}</p>
                  <p className="text-xs text-muted-foreground">Points communauté</p>
                </div>
              </div>

              <Separator />

              {/* Secondary stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-lg font-semibold">{stats.fundsCreated}</p>
                    <p className="text-xs text-muted-foreground">Cagnottes créées</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Coins className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-lg font-semibold">{stats.contributionsCount}</p>
                    <p className="text-xs text-muted-foreground">Contributions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Coins className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-lg font-semibold">{stats.totalContributed.toLocaleString()} FCFA</p>
                    <p className="text-xs text-muted-foreground">Total contribué</p>
                  </div>
                </div>
              </div>

              {/* Profile-based stats */}
              <Separator />
              <h4 className="font-medium text-sm">Activité sociale</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Send className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-lg font-semibold">{profile.invitations_sent || 0}</p>
                    <p className="text-xs text-muted-foreground">Invitations envoyées</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-lg font-semibold">{profile.invitations_accepted || 0}</p>
                    <p className="text-xs text-muted-foreground">Invitations acceptées</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <PartyPopper className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-lg font-semibold">{profile.total_birthdays_celebrated || 0}</p>
                    <p className="text-xs text-muted-foreground">Anniversaires célébrés</p>
                  </div>
                </div>
              </div>

              {/* Referrals */}
              {(profile.total_referrals || 0) > 0 && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{profile.total_referrals} parrainages</p>
                      <p className="text-xs text-muted-foreground">Utilisateurs parrainés avec succès</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
