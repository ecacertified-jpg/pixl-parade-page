import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Gift, PiggyBank, Plus, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GiftHistoryModal } from "@/components/GiftHistoryModal";
import { ContributeModal } from "@/components/ContributeModal";
import { AddFriendModal } from "@/components/AddFriendModal";
import { AddEventModal, Event } from "@/components/AddEventModal";
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
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Déterminer l'onglet par défaut selon les paramètres URL
  const defaultTab = searchParams.get('tab') || 'amis';

  // Charger les amis depuis localStorage
  useEffect(() => {
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      const parsedFriends = JSON.parse(savedFriends).map((friend: any) => ({
        ...friend,
        birthday: new Date(friend.birthday)
      }));
      setFriends(parsedFriends);
    }
  }, []);

  // Charger les événements depuis localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date)
      }));
      setEvents(parsedEvents);
    }
  }, []);

  // Fonction pour ajouter un ami
  const handleAddFriend = (newFriend: Friend) => {
    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
  };

  // Fonction pour supprimer un ami
  const handleDeleteFriend = (friendId: string) => {
    const updatedFriends = friends.filter(friend => friend.id !== friendId);
    setFriends(updatedFriends);
    localStorage.setItem('friends', JSON.stringify(updatedFriends));
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
  const getDaysUntilBirthday = (birthday: Date) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
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
                <div className="text-primary font-bold">1</div>
                <div className="text-xs text-muted-foreground">Reçus</div>
              </div>
              <div>
                <div className="text-primary font-bold">1</div>
                <div className="text-xs text-muted-foreground">Offerts</div>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Business */}
        <Card className="p-4 mb-4 bg-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold bg-green-100">Vous êtes commerçant ?</div>
              <div className="text-sm text-muted-foreground">Vendez vos produits sur JOIE DE VIVRE</div>
            </div>
            <Button variant="secondary" className="font-medium mx-0 bg-green-600 hover:bg-green-500 my-[4px] text-center px-[8px] py-[10px]" onClick={() => navigate('/business-account')}>
              Compte Business
            </Button>
          </div>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="amis" className="flex gap-2 bg-zinc-50"><Users className="h-4 w-4" aria-hidden />Amis</TabsTrigger>
            <TabsTrigger value="evenements" className="flex gap-2"><CalendarDays className="h-4 w-4" aria-hidden />Événements</TabsTrigger>
            <TabsTrigger value="cadeaux" className="flex gap-2"><Gift className="h-4 w-4" aria-hidden />Cadeaux</TabsTrigger>
            <TabsTrigger value="cotisations" className="flex gap-2"><PiggyBank className="h-4 w-4" aria-hidden />Cotisations</TabsTrigger>
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
                  <p>Aucun événement ajouté pour le moment</p>
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

          <TabsContent value="cadeaux" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Historique des Cadeaux</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowGiftHistory(true)}>
                  Voir tout
                </Button>
                <Button size="sm" className="gap-2 bg-pink-500 text-white hover:bg-pink-600" onClick={() => navigate('/shop')}>
                  <Gift className="h-4 w-4" />
                  Offrir
                </Button>
              </div>
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2 mb-4">
              <Button variant="default" size="sm" className="bg-primary text-primary-foreground">
                Tous (4)
              </Button>
              <Button variant="outline" size="sm">
                Reçus (2)
              </Button>
              <Button variant="outline" size="sm">
                Offerts (2)
              </Button>
            </div>

            {/* Cadeau principal reçu */}
            <Card className="p-4 mb-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Bracelet Doré Élégance</div>
                  <div className="text-xs text-muted-foreground">Promotion professionnelle</div>
                  <div className="text-xs text-muted-foreground">31/07/2025</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">15 000 F</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Reçu de :</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">F</div>
                      <span className="text-sm">Fatou Bamba</span>
                    </div>
                    <span className="text-sm font-medium">8000 F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">K</div>
                      <span className="text-sm">Kofi Asante</span>
                    </div>
                    <span className="text-sm font-medium">7000 F</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cadeau offert récent */}
            <Card className="p-4 mb-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Parfum Roses de Yamoussoukro</div>
                  <div className="text-xs text-muted-foreground">Anniversaire</div>
                  <div className="text-xs text-muted-foreground">18/07/2025</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">28 000 F</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">Offert à :</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">F</div>
                  <span className="text-sm">Fatou Bamba</span>
                </div>
              </div>
            </Card>

            {/* Cadeau reçu ancien */}
            <Card className="p-4 mb-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Livre sur l'entrepreneuriat</div>
                  <div className="text-xs text-muted-foreground">Réussite universitaire</div>
                  <div className="text-xs text-muted-foreground">10/06/2025</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">12 000 F</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Reçu de :</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">M</div>
                  <span className="text-sm">Maman</span>
                </div>
              </div>
            </Card>

            {/* Cadeau offert ancien */}
            <Card className="p-4 mb-4 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Montre connectée</div>
                  <div className="text-xs text-muted-foreground">Anniversaire</div>
                  <div className="text-xs text-muted-foreground">25/04/2025</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">45 000 F</div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">Offert à :</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">K</div>
                  <span className="text-sm">Kofi Asante</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cotisations" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Cotisations Groupées</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate('/collective-funds')}>
                  Voir tout
                </Button>
                <Button size="sm" className="gap-2 bg-green-500 text-white hover:bg-green-600" onClick={() => setShowContributeModal(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Cotiser
                </Button>
              </div>
            </div>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Cadeau pour la promotion d'Aisha</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">Initiateur</Badge>
                  <Badge className="text-xs bg-green-500">Actif</Badge>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3">Pour: Aisha Traoré</div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression</span>
                  <span className="font-medium">35 000 / 50 000 F</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{
                  width: '70%'
                }}></div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">70% atteint</div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Contributeurs (3):</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white">M</div>
                      <span className="text-sm">Moi</span>
                    </div>
                    <span className="text-sm font-medium">15 000 F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">F</div>
                      <span className="text-sm">Fatou Bamba</span>
                    </div>
                    <span className="text-sm font-medium">12 000 F</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">K</div>
                      <span className="text-sm">Kofi Asante</span>
                    </div>
                    <span className="text-sm font-medium">8 000 F</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>

      <GiftHistoryModal isOpen={showGiftHistory} onClose={() => setShowGiftHistory(false)} />

      <ContributeModal isOpen={showContributeModal} onClose={() => setShowContributeModal(false)} />

      <AddFriendModal isOpen={showAddFriendModal} onClose={() => setShowAddFriendModal(false)} onAddFriend={handleAddFriend} />

        <AddEventModal isOpen={showAddEventModal} onClose={closeEventModal} onAddEvent={handleAddEvent} onEditEvent={handleEditEvent} eventToEdit={editingEvent} />
    </div>;
}