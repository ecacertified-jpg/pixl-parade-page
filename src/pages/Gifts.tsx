import { useState, useEffect, useMemo, memo } from "react";
import { ArrowLeft, Gift, Filter, User, Heart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ThanksModal } from "@/components/ThanksModal";
import { toast } from "sonner";

interface Contributor {
  id: string;
  name: string;
  amount: number;
}

interface GiftItem {
  id: string;
  gift_name: string;
  gift_description: string;
  amount: number;
  currency: string;
  gift_date: string;
  occasion: string;
  status: string;
  giver_id: string;
  receiver_id: string | null;
  receiver_name: string | null;
  giver_name?: string;
  receiver_display_name?: string;
  collective_fund_id?: string | null;
  has_thanked?: boolean;
  is_new?: boolean;
}

function Gifts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'received' | 'given'>('all');
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    document.title = "Historique des Cadeaux | JOIE DE VIVRE";
    if (user) {
      loadGifts();
      markNotificationsAsRead();
    }
  }, [user]);

  const markNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('type', 'gift_received')
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const loadGifts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          id,
          gift_name,
          gift_description,
          amount,
          currency,
          gift_date,
          occasion,
          status,
          giver_id,
          receiver_id,
          receiver_name,
          collective_fund_id
        `)
        .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('gift_date', { ascending: false });

      if (error) throw error;
      
      // Load profile names for givers and receivers
      const userIds = new Set<string>();
      data?.forEach(gift => {
        userIds.add(gift.giver_id);
        if (gift.receiver_id) {
          userIds.add(gift.receiver_id);
        }
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      });

      // Check which gifts have been thanked
      const giftIds = data?.map(g => g.id) || [];
      const { data: thanksData } = await supabase
        .from('gift_thanks')
        .select('gift_id')
        .in('gift_id', giftIds);

      const thankedGiftIds = new Set(thanksData?.map(t => t.gift_id) || []);

      // Check for new gifts (received in last 7 days and not thanked)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const giftsWithNames = data?.map(gift => {
        const isReceived = gift.receiver_id === user.id;
        const hasCollectiveFund = !!gift.collective_fund_id;
        const hasThanked = thankedGiftIds.has(gift.id);
        const giftDate = new Date(gift.gift_date);
        const isNew = isReceived && hasCollectiveFund && !hasThanked && giftDate > sevenDaysAgo;

        return {
          ...gift,
          giver_name: profileMap.get(gift.giver_id) || 'Utilisateur',
          receiver_display_name: gift.receiver_name || profileMap.get(gift.receiver_id) || 'Utilisateur',
          has_thanked: hasThanked,
          is_new: isNew
        };
      }) || [];

      setGifts(giftsWithNames);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGiftClick = async (gift: GiftItem) => {
    // Only open thanks modal for received gifts from collective funds that haven't been thanked
    if (!gift.collective_fund_id || gift.has_thanked || gift.receiver_id !== user?.id) {
      return;
    }

    try {
      // Load contributors from the fund
      const { data: contributionsData, error } = await supabase
        .from('fund_contributions')
        .select(`
          contributor_id,
          amount,
          profiles:contributor_id (
            user_id,
            first_name,
            last_name
          )
        `)
        .eq('fund_id', gift.collective_fund_id);

      if (error) throw error;

      const contributorsList: Contributor[] = contributionsData?.map((contrib: any) => ({
        id: contrib.contributor_id,
        name: `${contrib.profiles?.first_name || ''} ${contrib.profiles?.last_name || ''}`.trim() || 'Contributeur',
        amount: contrib.amount
      })) || [];

      setSelectedGift(gift);
      setContributors(contributorsList);
      setShowThanksModal(true);
    } catch (error) {
      console.error('Error loading contributors:', error);
      toast.error("Impossible de charger les contributeurs");
    }
  };

  const handleThanksSent = () => {
    // Reload gifts to update the thanked status
    loadGifts();
    toast.success("Vos remerciements ont été envoyés avec succès ! 💝");
  };

  const { filteredGifts, receivedGifts, givenGifts } = useMemo(() => {
    const received = gifts.filter(gift => gift.receiver_id === user?.id);
    const given = gifts.filter(gift => gift.giver_id === user?.id);
    
    let filtered = gifts;
    if (activeFilter === 'received') filtered = received;
    else if (activeFilter === 'given') filtered = given;
    
    return {
      filteredGifts: filtered,
      receivedGifts: received,
      givenGifts: given
    };
  }, [gifts, activeFilter, user?.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Historique des Cadeaux</h1>
              </div>
              <p className="text-sm text-muted-foreground">{gifts.length} cadeau{gifts.length > 1 ? 'x' : ''}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeFilter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            Tous ({gifts.length})
          </Button>
          <Button 
            variant={activeFilter === 'received' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveFilter('received')}
          >
            Reçus ({receivedGifts.length})
          </Button>
          <Button 
            variant={activeFilter === 'given' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveFilter('given')}
          >
            Offerts ({givenGifts.length})
          </Button>
        </div>

        {filteredGifts.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {activeFilter === 'received' ? 'Aucun cadeau reçu' : 
               activeFilter === 'given' ? 'Aucun cadeau offert' : 
               'Aucun cadeau pour le moment'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {activeFilter === 'given' ? 
                'Offrez votre premier cadeau à un proche !' :
                'Vos cadeaux apparaîtront ici'
              }
            </p>
            {activeFilter === 'given' && (
              <Button onClick={() => navigate('/shop')} className="gap-2">
                <Gift className="h-4 w-4" />
                Offrir un cadeau
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGifts.map((gift) => {
              const isReceived = gift.receiver_id === user?.id;
              const canThank = isReceived && gift.collective_fund_id && !gift.has_thanked;
              
              return (
                <Card 
                  key={gift.id} 
                  className={`p-4 ${isReceived ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} ${canThank ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                  onClick={() => canThank && handleGiftClick(gift)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isReceived ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Gift className={`h-6 w-6 ${isReceived ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{gift.gift_name}</div>
                        {gift.is_new && (
                          <Badge variant="destructive" className="animate-pulse">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      {gift.gift_description && (
                        <div className="text-xs text-muted-foreground">{gift.gift_description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {gift.occasion} • {formatDate(gift.gift_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${isReceived ? 'text-green-600' : 'text-blue-600'}`}>
                        {gift.amount?.toLocaleString()} {gift.currency}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      {isReceived ? (
                        <>
                          <Gift className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Reçu de :</span>
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 text-orange-500" />
                          <span className="text-sm font-medium text-orange-600">Offert à :</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white">
                          {isReceived ? 
                            (gift.giver_name?.charAt(0) || 'G') : 
                            (gift.receiver_display_name?.charAt(0) || 'R')
                          }
                        </div>
                        <span className="text-sm">
                          {isReceived ? gift.giver_name : gift.receiver_display_name}
                        </span>
                      </div>
                      
                      {canThank && (
                        <Button size="sm" variant="outline" className="gap-2">
                          <MessageCircle className="h-3 w-3" />
                          Dire merci
                        </Button>
                      )}
                      
                      {gift.has_thanked && isReceived && (
                        <Badge variant="secondary" className="text-xs">
                          Remercié ✓
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="pb-20" />
      </main>

      {selectedGift && (
        <ThanksModal
          isOpen={showThanksModal}
          onClose={() => {
            setShowThanksModal(false);
            setSelectedGift(null);
            setContributors([]);
          }}
          giftId={selectedGift.id}
          giftName={selectedGift.gift_name}
          fundId={selectedGift.collective_fund_id || ''}
          contributors={contributors}
          onThanksSent={handleThanksSent}
        />
      )}
    </div>
  );
}

export default memo(Gifts);