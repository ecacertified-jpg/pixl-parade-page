import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, CalendarDays, Gift, Plus, ArrowLeft, Trash2, Edit2, PiggyBank, TrendingUp, HelpCircle, BookOpen, Bot, Send, CheckCircle, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedGiftButton } from "@/components/AnimatedGiftButton";
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
import { FavoriteArticlesSection } from "@/components/FavoriteArticlesSection";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { BirthdayStatsCard } from "@/components/BirthdayStatsCard";
import { BadgeProgressCard } from "@/components/BadgeProgressCard";
import { AllBadgesCollection } from "@/components/AllBadgesCollection";
import { triggerBadgeCheckAfterAction } from "@/utils/badgeAwarder";
import { SmartBirthdayReminders } from "@/components/SmartBirthdayReminders";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { BirthdayCountdownCard } from "@/components/BirthdayCountdownCard";
import { FriendsCircleReminderCard } from "@/components/FriendsCircleReminderCard";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { FriendsCircleBadgeCelebration } from "@/components/FriendsCircleBadgeCelebration";
import { useFriendsCircleBadgeCelebration } from "@/hooks/useFriendsCircleBadgeCelebration";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { getDaysUntilBirthday } from "@/lib/utils";
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
  birthday: string | Date;
  linked_user_id?: string | null;
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
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [friendsWithWishlist, setFriendsWithWishlist] = useState<Set<string>>(new Set());
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
  
  // Profile completion check (for Google sign-up users)
  const { needsCompletion: needsProfileCompletion, isLoading: profileCompletionLoading, markComplete: markProfileComplete, initialData } = useProfileCompletion();
  
  // Manual trigger for profile completion modal (from BirthdayCountdownCard button)
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  
  // Push notification prompt
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, permission: pushPermission } = usePushNotifications();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  
  
  // Friends circle badge celebration
  const { celebrationBadge, isOpen: isCelebrationOpen, closeCelebration } = useFriendsCircleBadgeCelebration();
  
  // Show push notification prompt after onboarding is done
  useEffect(() => {
    if (!user) return;
    
    const wasPrompted = localStorage.getItem(`push_prompted_${user.id}`);
    const shouldPrompt = pushSupported && !pushSubscribed && pushPermission !== 'denied' && !wasPrompted;
    
    // Only show after onboarding and profile completion are done
    if (shouldPrompt && !shouldShowOnboarding && !needsProfileCompletion && !profileCompletionLoading) {
      // Small delay to not overwhelm the user
      const timer = setTimeout(() => setShowPushPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, pushSupported, pushSubscribed, pushPermission, shouldShowOnboarding, needsProfileCompletion, profileCompletionLoading]);

  // Déterminer l'onglet par défaut selon les paramètres URL
  const defaultTab = searchParams.get('tab') || 'amis';

  // Callback pour mettre à jour les compteurs de cadeaux
  const handleGiftCountChange = (received: number, given: number) => {
    setReceivedGiftsCount(received);
    setGivenGiftsCount(given);
  };

  // Nettoyer l'ancien localStorage partagé (bug d'isolation)
  useEffect(() => {
    localStorage.removeItem('friends');
    localStorage.removeItem('events');
  }, []);

  // Charger les données depuis Supabase uniquement
  useEffect(() => {
    loadFriendsFromSupabase();
    loadEventsFromSupabase();
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
    if (!user) {
      setFriends([]); // Nettoyer si pas d'utilisateur connecté
      return;
    }
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
        
      if (error) {
        console.error('Erreur lors du chargement des contacts:', error);
        return;
      }

      // Convertir uniquement les contacts Supabase (source unique de vérité)
      const contacts: Friend[] = data.map(contact => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone || '',
        relation: contact.relationship || '',
        location: contact.notes || '',
        birthday: contact.birthday || '',
        linked_user_id: contact.linked_user_id
      }));

      setFriends(contacts);

      // Charger les IDs des contacts avec wishlist active
      const linkedUserIds = contacts
        .filter(c => c.linked_user_id)
        .map(c => c.linked_user_id!);

      if (linkedUserIds.length > 0) {
        const { data: wishlistData } = await supabase
          .from('user_favorites')
          .select('user_id')
          .in('user_id', linkedUserIds);

        setFriendsWithWishlist(new Set(wishlistData?.map(w => w.user_id) || []));
      } else {
        setFriendsWithWishlist(new Set());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
  };
  const loadEventsFromSupabase = async () => {
    if (!user) {
      setEvents([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });
        
      if (error) {
        console.error('Erreur lors du chargement des événements:', error);
        return;
      }

      const userEvents: Event[] = data.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.event_date),
        type: event.event_type
      }));

      setEvents(userEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  // Écouter les événements ajoutés depuis d'autres composants
  useEffect(() => {
    const handleEventAdded = () => {
      loadEventsFromSupabase();
    };

    window.addEventListener('eventAdded', handleEventAdded);
    return () => window.removeEventListener('eventAdded', handleEventAdded);
  }, [user]);

  // Fonction pour ajouter un ami
  const handleAddFriend = async (newFriend: Friend) => {
    if (!user) return;
    
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
        }
      }

      // 3. Créer le contact dans la table contacts
      const { data: insertedContact, error } = await supabase.from('contacts').insert({
        user_id: user.id,
        name: newFriend.name,
        phone: newFriend.phone,
        relationship: newFriend.relation,
        notes: newFriend.location,
        birthday: newFriend.birthday ? (() => { const d = newFriend.birthday instanceof Date ? newFriend.birthday : new Date(newFriend.birthday); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })() : null
      }).select('id').single();

      if (error) {
        console.error('Erreur lors de la sauvegarde du contact:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le contact",
          variant: "destructive"
        });
        return;
      }

      // 4. Notify the added contact via SMS/WhatsApp (if phone provided)
      if (newFriend.phone && insertedContact?.id) {
        supabase.functions.invoke('notify-contact-added', {
          body: {
            contact_id: insertedContact.id,
            contact_name: newFriend.name,
            contact_phone: newFriend.phone,
            birthday: newFriend.birthday instanceof Date ? newFriend.birthday.toISOString() : newFriend.birthday
          }
        }).catch(err => {
          console.log('Notification non envoyée (non bloquant):', err);
        });
      }

      // Recharger les contacts depuis Supabase
      await loadFriendsFromSupabase();
      
      if (existingUser?.user_id) {
        toast({
          title: "Contact ajouté et connecté",
          description: `${newFriend.name} est maintenant dans votre cercle d'amis.`
        });
      } else {
        toast({
          title: "Contact ajouté",
          description: `${newFriend.name} a été ajouté à vos contacts`
        });
      }
      
      // Trigger badge check for community badges
      triggerBadgeCheckAfterAction('add_friend', user.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contact:', error);
    }
  };

  // Fonction pour supprimer un ami
  const handleDeleteFriend = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', friendId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Erreur lors de la suppression du contact:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le contact",
          variant: "destructive"
        });
        return;
      }
      
      // Recharger les contacts depuis Supabase
      await loadFriendsFromSupabase();
    } catch (error) {
      console.error('Erreur lors de la suppression du contact:', error);
    }
  };

  // Fonction pour ajouter un événement
  const handleAddEvent = async (eventData: Omit<Event, 'id'>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('user_events').insert({
        user_id: user.id,
        title: eventData.title,
        event_date: eventData.date.toISOString().split('T')[0],
        event_type: eventData.type
      });

      if (error) {
        console.error('Erreur lors de l\'ajout de l\'événement:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter l'événement",
          variant: "destructive"
        });
        return;
      }

      await loadEventsFromSupabase();
      toast({
        title: "Événement ajouté",
        description: `${eventData.title} a été ajouté`
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'événement:', error);
    }
  };

  // Fonction pour modifier un événement
  const handleEditEvent = async (eventId: string, eventData: Omit<Event, 'id'>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_events')
        .update({
          title: eventData.title,
          event_date: eventData.date.toISOString().split('T')[0],
          event_type: eventData.type
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erreur lors de la modification de l\'événement:', error);
        toast({
          title: "Erreur",
          description: "Impossible de modifier l'événement",
          variant: "destructive"
        });
        return;
      }

      await loadEventsFromSupabase();
      setEditingEvent(null);
    } catch (error) {
      console.error('Erreur lors de la modification de l\'événement:', error);
    }
  };

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erreur lors de la suppression de l\'événement:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'événement",
          variant: "destructive"
        });
        return;
      }

      await loadEventsFromSupabase();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
    }
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

  // getDaysUntilBirthday importé depuis utils.ts

  // Calculer les jours jusqu'à un événement
  const getDaysUntilEvent = (eventDate: Date) => {
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  return <>
    <SEOHead {...SEO_CONFIGS.dashboard} />
    <div className="min-h-screen bg-gradient-background">
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
        {/* Rappel cercle d'amis */}
        <div className="mb-4">
          <FriendsCircleReminderCard onFriendAdded={() => loadFriendsFromSupabase()} />
        </div>

        {/* Compte à rebours anniversaire */}
        <BirthdayCountdownCard 
          birthday={userProfile?.birthday || null}
          userName={userProfile?.first_name || user?.user_metadata?.first_name}
          onCompleteProfile={() => setShowCompleteProfileModal(true)}
        />

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

        {/* Section Rappels d'anniversaires intelligents */}
        <div className="mb-4">
          <SmartBirthdayReminders hideViewAllButton />
        </div>

        {/* Section Liste de souhaits */}
        <FavoriteArticlesSection />

        {/* Cartes de badges */}
        <div className="grid grid-cols-1 gap-4 mb-4">
          <BirthdayStatsCard />
          {reciprocityScore && (
            <BadgeProgressCard currentScore={reciprocityScore.generosity_score} />
          )}
        </div>

        {/* Section Aide rapide */}
        <Card className="p-4 mb-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Aide rapide</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1"
              onClick={() => navigate('/faq')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-medium">FAQ</span>
              <span className="text-xs text-muted-foreground">Questions fréquentes</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col items-center gap-1"
              onClick={() => window.dispatchEvent(new CustomEvent('openAIChat'))}
            >
              <Bot className="h-5 w-5" />
              <span className="text-xs font-medium">Assistant</span>
              <span className="text-xs text-muted-foreground">Posez vos questions</span>
            </Button>
          </div>
        </Card>

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
          <TooltipProvider>
            <TabsList className="grid grid-cols-5 gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="amis" className="flex gap-1 text-xs px-2" aria-label="Gérer mes amis et contacts">
                    <Users className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden />
                    <span className="hidden sm:inline">Amis</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>Amis</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="evenements" className="flex gap-1 text-xs px-2" aria-label="Consulter mes événements et occasions spéciales">
                    <CalendarDays className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden />
                    <span className="hidden sm:inline">Événements</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>Événements</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="cotisations" className="flex gap-1 text-xs px-2" aria-label="Voir mes cotisations collectives et cagnottes">
                    <PiggyBank className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden />
                    <span className="hidden sm:inline">Cotisations</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>Cotisations</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="cadeaux" className="flex gap-1 text-xs px-2" aria-label="Consulter l'historique de mes cadeaux">
                    <Gift className="h-4 w-4 sm:h-3 sm:w-3" aria-hidden />
                    <span className="hidden sm:inline">Cadeaux</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>Cadeaux</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="badges" className="flex gap-1 text-xs px-2" aria-label="Voir mes badges et récompenses">
                    <span className="text-base sm:text-sm">🏆</span>
                    <span className="hidden sm:inline">Badges</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent className="sm:hidden">
                  <p>Badges</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </TooltipProvider>

          <TabsContent value="amis" className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-base">Mon cercle d'amis</h2>
              <Button size="sm" className="gap-2 bg-violet-500 hover:bg-violet-400" onClick={() => setShowAddFriendModal(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Ajouter
              </Button>
            </div>

            {friends.length > 0 && (
              <div className="flex items-center gap-3 mb-2 text-[11px]">
                <span className="inline-flex items-center gap-1 text-success font-medium">
                  <CheckCircle className="h-3 w-3" />
                  {friends.filter(f => f.linked_user_id).length} sur l'app
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                  <UserPlus className="h-3 w-3" />
                  {friends.filter(f => !f.linked_user_id).length} à inviter
                </span>
              </div>
            )}
            
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
                        <div className="font-medium flex items-center gap-1.5">
                          {friend.name}
                          {friend.linked_user_id && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <button
                                  className="inline-flex items-center gap-0.5 text-[10px] font-medium text-success bg-success/10 rounded-full px-1.5 py-0.5 hover:bg-success/20 transition-colors cursor-pointer"
                                  onClick={() => navigate(`/gift-ideas/${friend.id}`)}
                                 >
                                   <CheckCircle className="h-3 w-3" />
                                   Sur l'app
                                   {friend.linked_user_id && friendsWithWishlist.has(friend.linked_user_id) && (
                                     <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse ml-0.5" />
                                   )}
                                 </button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 {friend.linked_user_id && friendsWithWishlist.has(friend.linked_user_id)
                                   ? `${friend.name} a des souhaits !`
                                   : `Voir les souhaits de ${friend.name}`}
                               </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{friend.location}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Anniv. dans {getDaysUntilBirthday(friend.birthday)} jours
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {friend.relation}
                        </Badge>
                        {!friend.linked_user_id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={async () => {
                                  const userName = userProfile?.first_name || user?.user_metadata?.first_name || '';
                                  const message = `Salut ${friend.name} ! ${userName} t'invite à rejoindre Joie de Vivre, l'app qui célèbre les moments heureux 🎉 Inscris-toi ici : https://joiedevivre-africa.com/go/register`;
                                  if (navigator.share) {
                                    try {
                                      await navigator.share({ text: message });
                                    } catch (e) {
                                      // User cancelled share
                                    }
                                  } else {
                                    await navigator.clipboard.writeText(message);
                                    toast({ title: "Lien copié", description: "L'invitation a été copiée dans le presse-papier" });
                                  }
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Inviter sur l'app</TooltipContent>
                          </Tooltip>
                        )}
                        <AnimatedGiftButton
                          friendId={friend.id}
                          friendName={friend.name}
                          daysUntilBirthday={getDaysUntilBirthday(friend.birthday)}
                          onClick={() => navigate(`/shop?giftFor=${friend.id}&friendName=${encodeURIComponent(friend.name)}`)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setContactToDelete(friend.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
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
        
        {/* Complete Profile Modal - Priority over Onboarding, or manually triggered */}
        <CompleteProfileModal
          open={(needsProfileCompletion || showCompleteProfileModal) && !profileCompletionLoading}
          onComplete={() => {
            markProfileComplete();
            setShowCompleteProfileModal(false);
            loadUserProfile(); // Refresh profile data
          }}
          initialData={initialData}
        />
        
        {/* Onboarding Modal - Only shows if profile is complete */}
        <OnboardingModal
          open={shouldShowOnboarding && !needsProfileCompletion && !profileCompletionLoading}
          onComplete={completeOnboarding}
        />
        
        {/* Push Notification Prompt - Shows after onboarding */}
        <PushNotificationPrompt
          open={showPushPrompt}
          onClose={() => setShowPushPrompt(false)}
        />
        
        {/* Friends Circle Badge Celebration */}
        <FriendsCircleBadgeCelebration
          badge={celebrationBadge}
          isOpen={isCelebrationOpen}
          onClose={closeCelebration}
        />
        
        <BottomNavigation />

        {/* Delete Contact Confirmation Dialog */}
        <AlertDialog open={!!contactToDelete} onOpenChange={(open) => { if (!open) setContactToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le contact sera définitivement supprimé de votre cercle d'amis.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (contactToDelete) handleDeleteFriend(contactToDelete);
                  setContactToDelete(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  </>;
}