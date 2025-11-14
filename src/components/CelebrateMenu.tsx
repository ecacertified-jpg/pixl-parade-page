import { useState } from 'react';
import { PartyPopper, Gift, MessageCircleHeart, Cake } from 'lucide-react';
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
import { useUpcomingBirthdays } from '@/hooks/useUpcomingBirthdays';
import { Badge } from '@/components/ui/badge';

interface CelebrateMenuProps {
  children: React.ReactNode;
}

export function CelebrateMenu({ children }: CelebrateMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isPostDrawerOpen, setIsPostDrawerOpen] = useState(false);
  const { birthdays } = useUpcomingBirthdays(7);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const menuItems = [
    {
      icon: PartyPopper,
      label: 'Publier une célébration',
      description: 'Partagez un moment joyeux',
      color: 'text-secondary',
      action: () => handleAction(() => setIsPostDrawerOpen(true)),
    },
    {
      icon: Cake,
      label: 'Célébrer un anniversaire',
      description: 'Créez une cagnotte ou envoyez un message',
      color: 'text-primary',
      badge: birthdays.length > 0 ? `${birthdays.length} proche${birthdays.length > 1 ? 's' : ''}` : undefined,
      action: () => handleAction(() => navigate('/shop')),
    },
    {
      icon: Gift,
      label: 'Créer une cagnotte collective',
      description: 'Pour un événement spécial',
      color: 'text-accent',
      action: () => handleAction(() => navigate('/gifts')),
    },
    {
      icon: MessageCircleHeart,
      label: 'Envoyer un message de gratitude',
      description: 'Remerciez quelqu\'un publiquement',
      color: 'text-pink-500',
      action: () => handleAction(() => navigate('/community')),
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
              Que voulez-vous célébrer ?
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
      />
    </>
  );
}
