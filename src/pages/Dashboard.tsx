import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, CalendarDays, Gift, Plus, ArrowLeft, Trash2, Edit2, PiggyBank, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GiftHistoryModal } from "@/components/GiftHistoryModal";
import { AddFriendModal } from "@/components/AddFriendModal";
import { AddEventModal, Event } from "@/components/AddEventModal";
import { GiftsSection } from "@/components/GiftsSection";
import { CollectiveFundCard } from "@/components/CollectiveFundCard";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { BottomNavigation } from "@/components/RecentActivitySection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBusinessAccount } from "@/hooks/useBusinessAccount";
import { useCollectiveFunds } from "@/hooks/useCollectiveFunds";
import { useReciprocityScore } from "@/hooks/useReciprocityScore";
import { ReciprocityBadge } from "@/components/ReciprocityBadge";
import { ReciprocityNotificationsSection } from "@/components/ReciprocityNotificationsSection";
import { ShopForCollectiveGiftModal } from "@/components/ShopForCollectiveGiftModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { BirthdayStatsCard } from "@/components/BirthdayStatsCard";
import { BadgeProgressCard } from "@/components/BadgeProgressCard";
import { AllBadgesCollection } from "@/components/AllBadgesCollection";
import { triggerBadgeCheckAfterAction } from "@/utils/badgeAwarder";
interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  phone: string | null;
  birthday: string | null;
}
interface Friend {
  id: string;
  name: string;
  phone: string;
  relation: string;
  location: string;
  birthday: Date;
}
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showGiftHistory, setShowGiftHistory] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [receivedGiftsCount, setReceivedGiftsCount] = useState(0);
  const [givenGiftsCount, setGivenGiftsCount] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const {
    user
  } = useAuth();
  const {
    hasBusinessAccount,
    isActiveBusinessAccount = false
  } = useBusinessAccount();
  const {
    toast
  } = useToast();
  const {
    funds,
    loading: fundsLoading,
    refreshFunds
  } = useCollectiveFunds();
  const { score: reciprocityScore } = useReciprocityScore();
  const [showShopForCollectiveGiftModal, setShowShopForCollectiveGiftModal] = useState(false);
  
  // Onboarding
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'amis');

  // Déterminer l'onglet par défaut selon les paramètres URL
  const defaultTab = searchParams.get('tab') || 'amis';

  // Callback pour mettre à jour les compteurs de cadeaux
  const handleGiftCountChange = (received: number, given: number) => {
    setReceivedGiftsCount(received);
    setGivenGiftsCount(given);
  };

  // Charger les données depuis le localStorage et Supabase
  useEffect(() => {
    loadFriendsFromStorage();
    loadFriendsFromSupabase();
    loadEventsFromStorage();
    loadUserProfile();
  }, [user]);

  // Handle URL parameters for tab switching and auto-open modals
  useEffect(() => {
    const tab = searchParams.get('tab');
    const add = searchParams.get('add');
    
    if (tab === 'amis') {
      setActiveTab('amis');
      if (add === 'true') {
        setShowAddFriendModal(true);
        // Clean up URL params after opening modal
        searchParams.delete('add');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, setSearchParams]);
  const loadFriendsFromStorage = () => {
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      const parsedFriends = JSON.parse(savedFriends).map((friend: any) => ({
        ...friend,
        birthday: friend.birthday ? new Date(friend.birthday) : new Date()
      }));
      setFriends(parsedFriends);
    }
  };
  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('first_name, last_name, city, phone, birthday').eq('user_id', user.id).single();
      if (error) {
        console.error('Erreur lors du chargement du profil:', error);
        return;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };
  const loadFriendsFromSupabase = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('name');
      if (error) {
        console.error('Erreur lors du chargement des contacts:', error);
        return;
      }

      // Convertir les contacts Supabase vers le format Friend local
      const supabaseContacts: Friend[] = data.map(contact => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone || '',
        relation: contact.relationship || '',
        location: contact.notes || '',
        // Utiliser notes pour la localisation
        birthday: contact.birthday ? new Date(contact.birthday) : new Date()
      }));

      // Fusionner avec les amis locaux en évitant les doublons
      const existingFriends = JSON.parse(localStorage.getItem('friends') || '[]');
      const combinedFriends = [...existingFriends];
      supabaseContacts.forEach(supabaseContact => {
        const exists = combinedFriends.find(f => f.name === supabaseContact.name && f.phone === supabaseContact.phone);
        if (!exists) {
          combinedFriends.push(supabaseContact);
        }
      });
      setFriends(combinedFriends);
      localStorage.setItem('friends', JSON.stringify(combinedFriends));
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
  };
  const loadEventsFromStorage = () => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(parsedEvents);
    }
  };

  // Fonction pour ajouter un ami
  const handleAddFriend = async (newFriend: Friend) => {
    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));

    // Synchroniser avec Supabase
    if (user) {
      try {
        // 1. Rechercher si un utilisateur existe avec ce numéro
        const { data: existingUser, error: searchError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone', newFriend.phone)
          .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') {
          console.error('Erreur lors de la recherche de l\'utilisateur:', searchError);
        }

        // 2. Si l'utilisateur existe, créer une relation d'amitié
        if (existingUser?.user_id && existingUser.user_id !== user.id) {
          const { error: relationError } = await supabase
            .from('contact_relationships')
            .insert({
              user_a: user.id,
              user_b: existingUser.user_id,
              can_see_funds: true,
              relationship_type: 'friend'
            });

          if (relationError) {
            console.error('Erreur lors de la création de la relation:', relationError);
          } else {
            console.log('Relation d\'amitié créée avec succès');
          }
        }

        // 3. Créer le contact dans la table contacts
        const {
          error
        } = await supabase.from('contacts').insert({
          user_id: user.id,
          name: newFriend.name,
          phone: newFriend.phone,
          relationship: newFriend.relation,
          notes: newFriend.location,
          birthday: newFriend.birthday.toISOString().split('T')[0]
        });

        if (error) {
          console.error('Erreur lors de la sauvegarde du contact:', error);
          toast({
            title: "Attention",
            description: "Contact ajouté localement mais pas synchronisé en ligne",
            variant: "destructive"
          });
        } else {
          if (existingUser?.user_id) {
            toast({
              title: "Contact ajouté et connecté",
              description: `${newFriend.name} est maintenant dans votre cercle d'amis. Vous pouvez voir ses cotisations.`
            });
          } else {
            toast({
              title: "Contact ajouté",
              description: `${newFriend.name} a été ajouté à vos contacts`
            });
          }
          
          // Trigger badge check for community badges
          triggerBadgeCheckAfterAction('add_friend', user.id);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du contact:', error);
      }
    }
  };

  // Fonction pour supprimer un ami
  const handleDeleteFriend = async (friendId: string) => {
    const friendToDelete = friends.find(f => f.id === friendId);
    const updatedFriends = friends.filter(friend => friend.id !== friendId);
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));

    // Synchroniser avec Supabase
    if (user && friendToDelete) {
      try {
        const {
          error
        } = await supabase.from('contacts').delete().eq('user_id', user.id).eq('name', friendToDelete.name).eq('phone', friendToDelete.phone);
        if (error) {
          console.error('Erreur lors de la suppression du contact:', error);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du contact:', error);
      }
    }
  };

  // Fonction pour ajouter un événement
  const handleAddEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  // Fonction pour modifier un événement
  const handleEditEvent = (eventId: string, eventData: Omit<Event, 'id'>) => {
    const updatedEvents = events.map(event => event.id === eventId ? {
      ...eventData,
      id: eventId
    } : event);
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    setEditingEvent(null);
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setShowAddEventModal(true);
  };

  // Fonction pour fermer le modal d'événement
  const closeEventModal = () => {
    setShowAddEventModal(false);
    setEditingEvent(null);
  };

  // Calculer les jours jusqu'à l'anniversaire
  const getDaysUntilBirthday = (birthday: Date | string | null | undefined) => {
    if (!birthday) return 0;

    // Convertir en Date si nécessaire
    const birthdayDate = birthday instanceof Date ? birthday : new Date(birthday);

    // Vérifier que la date est valide
    if (isNaN(birthdayDate.getTime())) return 0;
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthdayDate.getMonth(), birthdayDate.getDate());
    }
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculer les jours jusqu'à un événement
  const getDaysUntilEvent = (eventDate: Date) => {
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  useEffect(() => {
    document.title = "Mon Tableau de Bord | JOIE DE VIVRE";
  }, []);
  return <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {isActiveBusinessAccount ? <BusinessProfileDropdown /> : <ProfileDropdown />}
            <div>
              <h1 className="text-xl font-semibold">Mon Tableau de Bord</h1>
              <p className="text-sm text-muted-foreground">Gérez vos relations et événements</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Carte résumé */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="font-semibold truncate">
                {userProfile?.first_name || user?.user_metadata?.first_name || 'Utilisateur'}
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {userProfile?.birthday ? `Anniv. dans ${getDaysUntilBirthday(userProfile.birthday)} jours` : userProfile?.city || user?.user_metadata?.city || 'Ville non renseignée'}
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-primary font-bold">{friends.length}</div>
                <div className="text-xs text-muted-foreground">Amis</div>
              </div>
              <div>
                <div className="text-primary font-bold">{receivedGiftsCount}</div>
                <div className="text-xs text-muted-foreground">Reçus</div>
              </div>
              <div>
                <div className="text-primary font-bold">{givenGiftsCount}</div>
                <div className="text-xs text-muted-foreground">Offerts</div>
              </div>
            </div>
          </div>
        </Card>

        {reciprocityScore && (
          <div className="mb-4 space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <ReciprocityBadge
                  score={reciprocityScore.generosity_score}
                  showLabel
                  showScore
                  size="md"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reciprocity-profile')}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Voir mon profil
                </Button>
              </div>
            </Card>
          </div>
        )}

        {reciprocityScore && (
          <ReciprocityNotificationsSection />
        )}

        {/* Cartes de badges */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <BirthdayStatsCard />
          {reciprocityScore && (
            <BadgeProgressCard currentScore={reciprocityScore.generosity_score} />
          )}
        </div>

        {/* CTA Business */}
        <Card className="p-4 mb-4 bg-green-100">
          <div className="flex items-center justify-between">
            <div className="mx-0 my-0 py-0 text-xs px-[11px]">
              <div className="font-semibold bg-green-100">Vous êtes commerçant ?</div>
              <div className="text-sm text-muted-foreground">Vendez vos produits sur JOIE DE VIVRE</div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/business-auth')} className="font-medium text-center bg-green-600 hover:bg-green-500 text-gray-50 my-0 px-[15px] mx-[2px] py-px">Rejoindre</Button>
          </div>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="amis" className="flex gap-1 text-xs"><Users className="h-3 w-3" aria-hidden />Amis</TabsTrigger>
            <TabsTrigger value="evenements" className="flex gap-1 text-xs"><CalendarDays className="h-3 w-3" aria-hidden />Événements</TabsTrigger>
            <TabsTrigger value="cotisations" className="flex gap-1 text-xs"><PiggyBank className="h-3 w-3" aria-hidden />Cotisations</TabsTrigger>
            <TabsTrigger value="cadeaux" className="flex gap-1 text-xs"><Gift className="h-3 w-3" aria-hidden />Cadeaux</TabsTrigger>
            <TabsTrigger value="badges" className="flex gap-1 text-xs">🏆 Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="amis" className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-base">Mon cercle d'amis</h2>
              <Button size="sm" className="gap-2 bg-violet-500 hover:bg-violet-400" onClick={() => setShowAddFriendModal(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter
              </Button>
            </div>
            
            {friends.length === 0 ? <Card className="p-6 text-center">
                <div className="text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun ami ajouté pour le moment</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                </div>
              </Card> : <div className="space-y-3">
                {friends.map(friend => <Card key={friend.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{friend.name}</div>
                        <div className="text-xs text-muted-foreground">{friend.location}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Anniv. dans {getDaysUntilBirthday(friend.birthday)} jours
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {friend.relation}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFriend(friend.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>)}
              </div>}
          </TabsContent>

          <TabsContent value="evenements" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Événements à Venir</h2>
              <Button size="sm" className="gap-2 text-primary-foreground bg-amber-400 hover:bg-amber-300" onClick={() => setShowAddEventModal(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter
              </Button>
            </div>
            
            {events.length === 0 ? <Card className="p-6 text-center">
                <div className="text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="mx-[55px]">Aucun événement ajouté pour le moment</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                </div>
              </Card> : <div className="space-y-3">
                {events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => {
              const daysUntil = getDaysUntilEvent(event.date);
              return <Card key={event.id} className="p-4">
                        {/* Header: Title and Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <CalendarDays className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{event.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(event.date, "EEEE d MMMM yyyy", {
                          locale: fr
                        })}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {event.type}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-primary-foreground bg-amber-400">
                            {daysUntil > 0 ? `${daysUntil}j` : daysUntil === 0 ? "Aujourd'hui" : "Passé"}
                          </Badge>
                        </div>

                        {/* Footer: Days text and Action buttons */}
                        {daysUntil >= 0 && <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              {daysUntil === 0 ? "C'est aujourd'hui !" : daysUntil === 1 ? "Dans 1 jour" : `Dans ${daysUntil} jours`}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(event)} className="h-8 w-8 p-0">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>}
                      </Card>;
            })}
              </div>}
          </TabsContent>

          <TabsContent value="cotisations" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Mes Cotisations</h2>
              <Button size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-400" onClick={() => setShowShopForCollectiveGiftModal(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Créer
              </Button>
            </div>
            
            {fundsLoading ? <Card className="p-6 text-center">
                <div className="text-muted-foreground">
                  <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Chargement des cotisations...</p>
                </div>
              </Card> : funds.length === 0 ? <Card className="p-6 text-center">
                <div className="text-muted-foreground">
                  <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="mx-[54px]">Aucune cotisation active pour le moment</p>
                  <p className="text-sm mx-[45px]">Les cotisations créées depuis la boutique apparaîtront ici</p>
                </div>
              </Card> : <div className="space-y-4">
                {funds.map(fund => <CollectiveFundCard key={fund.id} fund={fund} onContributionSuccess={refreshFunds} onDelete={() => refreshFunds()} />)}
              </div>}
          </TabsContent>

          <TabsContent value="cadeaux" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Historique des Cadeaux</h2>
              <Button size="sm" className="gap-2 bg-pink-500 text-white hover:bg-pink-600" onClick={() => navigate('/shop')}>
                <Gift className="h-4 w-4" aria-hidden />
                Offrir
              </Button>
            </div>
            <GiftsSection onGiftCountChange={handleGiftCountChange} />
          </TabsContent>

          <TabsContent value="badges" className="mt-4">
            <div className="space-y-4">
              {reciprocityScore && (
                <AllBadgesCollection currentScore={reciprocityScore.generosity_score} />
              )}
            </div>
          </TabsContent>

        </Tabs>

        <div className="pb-20" />
      </main>

      <GiftHistoryModal isOpen={showGiftHistory} onClose={() => setShowGiftHistory(false)} />

      <AddFriendModal isOpen={showAddFriendModal} onClose={() => setShowAddFriendModal(false)} onAddFriend={handleAddFriend} />

        <AddEventModal isOpen={showAddEventModal} onClose={closeEventModal} onAddEvent={handleAddEvent} onEditEvent={handleEditEvent} eventToEdit={editingEvent} />
        
        <ShopForCollectiveGiftModal 
          isOpen={showShopForCollectiveGiftModal} 
          onClose={() => setShowShopForCollectiveGiftModal(false)} 
        />
        
        {/* Onboarding Modal */}
        <OnboardingModal
          open={shouldShowOnboarding}
          onComplete={completeOnboarding}
        />
        
        <BottomNavigation />
    </div>;
}