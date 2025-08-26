import { useState, useEffect } from "react";
import { ArrowLeft, Gift, Filter, User, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  receiver_id: string;
  giver_name?: string;
  receiver_name?: string;
}

export default function Gifts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'received' | 'given'>('all');

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
          receiver_id
        `)
        .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('gift_date', { ascending: false });

      if (error) throw error;
      
      // Load profile names for givers and receivers
      const userIds = new Set<string>();
      data?.forEach(gift => {
        userIds.add(gift.giver_id);
        userIds.add(gift.receiver_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      });

      const giftsWithNames = data?.map(gift => ({
        ...gift,
        giver_name: profileMap.get(gift.giver_id) || 'Utilisateur',
        receiver_name: profileMap.get(gift.receiver_id) || 'Utilisateur'
      })) || [];

      setGifts(giftsWithNames);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGifts = gifts.filter(gift => {
    if (activeFilter === 'received') return gift.receiver_id === user?.id;
    if (activeFilter === 'given') return gift.giver_id === user?.id;
    return true;
  });

  const receivedGifts = gifts.filter(gift => gift.receiver_id === user?.id);
  const givenGifts = gifts.filter(gift => gift.giver_id === user?.id);

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
              onClick={() => navigate('/dashboard?tab=cadeaux')}
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
              
              return (
                <Card key={gift.id} className={`p-4 ${isReceived ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isReceived ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Gift className={`h-6 w-6 ${isReceived ? 'text-green-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{gift.gift_name}</div>
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
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white">
                        {isReceived ? 
                          (gift.giver_name?.charAt(0) || 'G') : 
                          (gift.receiver_name?.charAt(0) || 'R')
                        }
                      </div>
                      <span className="text-sm">
                        {isReceived ? gift.giver_name : gift.receiver_name}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="pb-20" />
      </main>
    </div>
  );
}