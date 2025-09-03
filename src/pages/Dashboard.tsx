import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, CalendarDays, Gift, Plus, ArrowLeft, Trash2, Edit2, PiggyBank } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GiftHistoryModal } from "@/components/GiftHistoryModal";
import { AddFriendModal } from "@/components/AddFriendModal";
import { AddEventModal, Event } from "@/components/AddEventModal";
import { GiftsSection } from "@/components/GiftsSection";
import { CollectiveFundCard } from "@/components/CollectiveFundCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCollectiveFunds } from "@/hooks/useCollectiveFunds";
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
  const [searchParams] = useSearchParams();
  const [showGiftHistory, setShowGiftHistory] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [receivedGiftsCount, setReceivedGiftsCount] = useState(0);
  const [givenGiftsCount, setGivenGiftsCount] = useState(0);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    funds,
    loading: fundsLoading,
    refreshFunds
  } = useCollectiveFunds();

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
  }, [user]);
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
        const {
          error
        } = await supabase.from('contacts').insert({
          user_id: user.id,
          name: newFriend.name,
          phone: newFriend.phone,
          relationship: newFriend.relation,
          notes: newFriend.location,
          // Utiliser notes pour stocker la localisation
          birthday: newFriend.birthday.toISOString().split('T')[0] // Format YYYY-MM-DD
        });
        if (error) {
          console.error('Erreur lors de la sauvegarde du contact:', error);
          toast({
            title: "Attention",
            description: "Contact ajouté localement mais pas synchronisé en ligne",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Contact ajouté",
            description: `${newFriend.name} a été ajouté à vos contacts`
          });
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
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
            <div>
              <div className="font-semibold">Utilisateur Démo</div>
              <div className="text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</div>
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

        {/* CTA Business */}
        <Card className="p-4 mb-4 bg-green-100">
          <div className="flex items-center justify-between">
            <div className="mx-0 my-0 py-0 text-xs px-[11px]">
              <div className="font-semibold bg-green-100">Vous êtes commerçant ?</div>
              <div className="text-sm text-muted-foreground">Vendez vos produits sur JOIE DE VIVRE</div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/business-account')} className="font-medium mx-0 bg-green-600 hover:bg-green-500 my-[4px] text-center py-[10px] px-[3px]">
              Compte Business
            </Button>
          </div>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="amis" className="flex gap-1 text-xs"><Users className="h-3 w-3" aria-hidden />Amis</TabsTrigger>
            <TabsTrigger value="evenements" className="flex gap-1 text-xs"><CalendarDays className="h-3 w-3" aria-hidden />Événements</TabsTrigger>
            <TabsTrigger value="cotisations" className="flex gap-1 text-xs"><PiggyBank className="h-3 w-3" aria-hidden />Cotisations</TabsTrigger>
            <TabsTrigger value="cadeaux" className="flex gap-1 text-xs"><Gift className="h-3 w-3" aria-hidden />Cadeaux</TabsTrigger>
          </TabsList>

          <TabsContent value="amis" className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-base">Mes Amis & Donateurs</h2>
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
                          Anniversaire dans {getDaysUntilBirthday(friend.birthday)} jours
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
                {funds.map(fund => (
                  <Card key={fund.id} className="p-4 space-y-4">
                    {/* Header avec nom du bénéficiaire et statut */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{fund.title}</h3>
                        <p className="text-sm text-muted-foreground">Pour: {fund.beneficiaryName}</p>
                      </div>
                      <Badge 
                        variant={fund.currentAmount >= fund.targetAmount ? "default" : "secondary"}
                        className={fund.currentAmount >= fund.targetAmount ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {fund.currentAmount >= fund.targetAmount ? "Terminé" : "En cours"}
                      </Badge>
                    </div>

                    {/* Produit avec image et nom */}
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {fund.productImage ? (
                          <img 
                            src={fund.productImage} 
                            alt={fund.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Gift className="h-8 w-8 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{fund.productName}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{fund.occasion}</p>
                        <p className="text-xs text-primary font-medium">
                          {fund.targetAmount.toLocaleString()} {fund.currency}
                        </p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">
                          {fund.currentAmount.toLocaleString()} / {fund.targetAmount.toLocaleString()} {fund.currency}
                        </span>
                      </div>
                      <Progress value={Math.min((fund.currentAmount / fund.targetAmount) * 100, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {fund.currentAmount >= fund.targetAmount 
                          ? "100% atteint - Prêt pour commande 🎉" 
                          : `${Math.round((fund.currentAmount / fund.targetAmount) * 100)}% atteint`
                        }
                      </p>
                    </div>

                    {/* Contributeurs */}
                    {fund.contributors.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Contributeurs ({fund.contributors.length})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {fund.contributors.slice(0, 3).map((contributor) => (
                              <Avatar key={contributor.id} className="w-8 h-8 border-2 border-background">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                                  {contributor.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {fund.contributors.length > 3 && (
                              <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                                <span className="text-xs font-medium">+{fund.contributors.length - 3}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">
                              {fund.contributors.slice(0, 2).map(c => `${c.name}: ${c.amount.toLocaleString()}F`).join(', ')}
                              {fund.contributors.length > 2 && ` et ${fund.contributors.length - 2} autre${fund.contributors.length > 3 ? 's' : ''}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bouton contribuer seulement si pas terminé */}
                    {fund.currentAmount < fund.targetAmount && (
                      <Button 
                        onClick={() => {
                          toast({
                            title: "Contribution",
                            description: "Fonctionnalité en cours de développement"
                          });
                        }}
                        className="w-full"
                      >
                        Contribuer
                      </Button>
                    )}
                  </Card>
                ))}
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

        </Tabs>

        <div className="pb-20" />
      </main>

      <GiftHistoryModal isOpen={showGiftHistory} onClose={() => setShowGiftHistory(false)} />

      <AddFriendModal isOpen={showAddFriendModal} onClose={() => setShowAddFriendModal(false)} onAddFriend={handleAddFriend} />

        <AddEventModal isOpen={showAddEventModal} onClose={closeEventModal} onAddEvent={handleAddEvent} onEditEvent={handleEditEvent} eventToEdit={editingEvent} />
    </div>;
}