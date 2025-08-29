import { useState, useEffect, useMemo } from "react";
import { Gift, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  receiver_id: string | null;
  receiver_name: string | null;
  product_id?: string;
  product_image_url?: string;
  giver_name?: string;
  receiver_display_name?: string;
}

interface GiftsSectionProps {
  onGiftCountChange?: (received: number, given: number) => void;
}

export function GiftsSection({ onGiftCountChange }: GiftsSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'received' | 'given'>('all');
  const [showOlderGifts, setShowOlderGifts] = useState(false);

  useEffect(() => {
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
          product_id,
          products:product_id (
            image_url
          )
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

      const giftsWithNames = data?.map(gift => ({
        ...gift,
        giver_name: profileMap.get(gift.giver_id) || 'Utilisateur',
        receiver_display_name: gift.receiver_name || profileMap.get(gift.receiver_id) || 'Utilisateur',
        product_image_url: gift.products?.image_url
      })) || [];

      setGifts(giftsWithNames);
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const { filteredGifts, receivedGifts, givenGifts, recentGifts, olderGifts } = useMemo(() => {
    const received = gifts.filter(gift => gift.receiver_id === user?.id);
    const given = gifts.filter(gift => gift.giver_id === user?.id);
    
    let filtered = gifts;
    if (activeFilter === 'received') filtered = received;
    else if (activeFilter === 'given') filtered = given;
    
    // Séparer les cadeaux récents des anciens
    // Les 5 premiers cadeaux sont considérés comme récents
    const recent = filtered.slice(0, 5);
    const older = filtered.slice(5);
    
    // Notify parent component of counts
    if (onGiftCountChange) {
      onGiftCountChange(received.length, given.length);
    }
    
    return {
      filteredGifts: filtered,
      receivedGifts: received,
      givenGifts: given,
      recentGifts: recent,
      olderGifts: older
    };
  }, [gifts, activeFilter, user?.id, onGiftCountChange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderGiftCard = (gift: GiftItem) => {
    const isReceived = gift.receiver_id === user?.id;
    
    return (
      <Card key={gift.id} className="overflow-hidden bg-card border">
        <div className="flex">
          {/* Image du cadeau */}
          <div className="w-20 h-20 flex-shrink-0 bg-white rounded flex items-center justify-center">
            {gift.product_image_url ? (
              <img 
                src={gift.product_image_url} 
                alt={gift.gift_name}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Gift className={`h-8 w-8 text-primary/60 ${gift.product_image_url ? 'hidden' : ''}`} />
          </div>
          
          {/* Contenu principal */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{gift.gift_name}</h3>
                {gift.gift_description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{gift.gift_description}</p>
                )}
              </div>
              <div className={`font-bold text-lg ${isReceived ? 'text-emerald-600' : 'text-blue-600'}`}>
                {gift.amount?.toLocaleString()} {gift.currency}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mb-3">
              {gift.occasion} • {formatDate(gift.gift_date)}
            </div>
            
            {/* Encadré destinataire/expéditeur */}
            <div className={`rounded-lg p-3 border ${
              isReceived 
                ? 'bg-emerald-50/50 border-emerald-200/50' 
                : 'bg-blue-50/50 border-blue-200/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                  isReceived ? 'bg-emerald-500' : 'bg-blue-500'
                }`}>
                  {isReceived ? 
                    (gift.giver_name?.charAt(0)?.toUpperCase() || 'G') : 
                    (gift.receiver_display_name?.charAt(0)?.toUpperCase() || 'R')
                  }
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isReceived ? 'text-emerald-700' : 'text-blue-700'
                  }`}>
                    {isReceived ? 'Reçu de :' : 'Offert à :'}
                  </div>
                  <div className="text-sm text-foreground">
                    {isReceived ? gift.giver_name : gift.receiver_display_name}
                  </div>
                </div>
                {isReceived ? (
                  <Gift className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Heart className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <>
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
          {/* Cadeaux récents */}
          {recentGifts.length > 0 && (
            <div className="space-y-4">
              {recentGifts.map((gift) => renderGiftCard(gift))}
            </div>
          )}
          
          {/* Section des anciens cadeaux */}
          {olderGifts.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOlderGifts(!showOlderGifts)}
                  className="gap-2"
                >
                  {showOlderGifts ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Masquer les anciens cadeaux
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Voir les anciens cadeaux ({olderGifts.length})
                    </>
                  )}
                </Button>
              </div>
              
              {showOlderGifts && (
                <div className="space-y-4 opacity-75">
                  {olderGifts.map((gift) => renderGiftCard(gift))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}