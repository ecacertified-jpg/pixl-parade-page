import { useState } from 'react';
import { Plus, FileText, Gift, Camera, UserPlus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CreatePostDrawer } from '@/components/CreatePostDrawer';
import { InviteFriendsModal } from '@/components/InviteFriendsModal';
import { ShopForCollectiveGiftModal } from '@/components/ShopForCollectiveGiftModal';
import { AddEventModal } from '@/components/AddEventModal';
import { Badge } from '@/components/ui/badge';
import { useUserContext } from '@/hooks/useUserContext';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/components/AddEventModal';

interface CreateActionMenuProps {
  children: React.ReactNode;
}

export function CreateActionMenu({ children }: CreateActionMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isPostDrawerOpen, setIsPostDrawerOpen] = useState(false);
  const [postDrawerInitialMode, setPostDrawerInitialMode] = useState<'text' | 'media'>('text');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { context } = useUserContext();
  const { toast } = useToast();

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const handleAddEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent = {
      ...eventData,
      id: Date.now().toString()
    };
    
    // Charger les événements existants
    const savedEvents = localStorage.getItem('events');
    const events = savedEvents ? JSON.parse(savedEvents) : [];
    
    // Ajouter le nouvel événement
    const updatedEvents = [...events, newEvent];
    localStorage.setItem('events', JSON.stringify(updatedEvents));
    
    // Émettre un événement personnalisé pour notifier Dashboard
    window.dispatchEvent(new CustomEvent('eventAdded', { detail: newEvent }));
    
    toast({
      title: "Événement ajouté",
      description: `${eventData.title} a été ajouté avec succès`,
    });
  };

  const menuItems = [
    {
      icon: FileText,
      label: 'Nouvelle publication',
      description: 'Partagez vos pensées',
      color: 'text-primary',
      badge: !context.hasPostedRecently ? 'Partagez !' : undefined,
      action: () => handleAction(() => {
        setPostDrawerInitialMode('text');
        setIsPostDrawerOpen(true);
      }),
    },
    {
      icon: Gift,
      label: 'Créer une cagnotte',
      description: 'Organisez une collecte',
      color: 'text-accent',
      badge: !context.hasCreatedFund ? 'Essayez' : undefined,
      action: () => handleAction(() => setIsShopModalOpen(true)),
    },
    {
      icon: Camera,
      label: 'Partager un moment',
      description: 'Ajoutez une photo ou vidéo',
      color: 'text-secondary',
      action: () => handleAction(() => {
        setPostDrawerInitialMode('media');
        setIsPostDrawerOpen(true);
      }),
    },
    {
      icon: UserPlus,
      label: 'Inviter des amis',
      description: 'Développez votre réseau',
      color: 'text-green-500',
      badge: context.contactsCount < 3 ? 'Recommandé' : undefined,
      action: () => handleAction(() => setIsInviteModalOpen(true)),
    },
    {
      icon: Calendar,
      label: 'Ajouter un événement',
      description: 'Enregistrez une date importante',
      color: 'text-orange-500',
      action: () => handleAction(() => setIsEventModalOpen(true)),
    },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-semibold text-center">
              Actions rapides
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-3 pb-6">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full h-auto py-4 px-4 justify-start gap-4 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                onClick={item.action}
              >
                <div className={`p-2 rounded-xl bg-background ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <CreatePostDrawer 
        open={isPostDrawerOpen} 
        onOpenChange={setIsPostDrawerOpen}
        initialMode={postDrawerInitialMode}
      />
      <InviteFriendsModal 
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
      <ShopForCollectiveGiftModal 
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
      />
      <AddEventModal 
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onAddEvent={handleAddEvent}
      />
    </>
  );
}
