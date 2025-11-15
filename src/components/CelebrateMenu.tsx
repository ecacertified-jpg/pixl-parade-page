import { useState } from 'react';
import { PartyPopper, Gift, MessageCircleHeart, Cake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CreatePostDrawer } from '@/components/CreatePostDrawer';
import { ShopForCollectiveGiftModal } from '@/components/ShopForCollectiveGiftModal';
import { SendBirthdayMessageModal } from '@/components/SendBirthdayMessageModal';
import { SendGratitudeModal } from '@/components/SendGratitudeModal';
import { useUpcomingBirthdays } from '@/hooks/useUpcomingBirthdays';
import { Badge } from '@/components/ui/badge';
import { useUserContext } from '@/hooks/useUserContext';

interface CelebrateMenuProps {
  children: React.ReactNode;
}

export function CelebrateMenu({ children }: CelebrateMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPostDrawerOpen, setIsPostDrawerOpen] = useState(false);
  const [postDrawerInitialMode, setPostDrawerInitialMode] = useState<'text' | 'media'>('text');
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [isGratitudeModalOpen, setIsGratitudeModalOpen] = useState(false);
  const { birthdays } = useUpcomingBirthdays(7);
  const { context } = useUserContext();

  const handleAction = (action: () => void) => {
    // Delay to allow sheet close animation
    setTimeout(() => {
      setIsOpen(false);
      setTimeout(() => action(), 150);
    }, 100);
  };

  const menuItems = [
    {
      icon: PartyPopper,
      label: 'Publier une célébration',
      description: 'Partagez un moment joyeux',
      color: 'text-secondary',
      action: () => handleAction(() => {
        setPostDrawerInitialMode('media');
        setIsPostDrawerOpen(true);
      }),
    },
    {
      icon: Cake,
      label: 'Célébrer un anniversaire',
      description: 'Envoyez un message',
      color: 'text-primary',
      badge: birthdays.length > 0 ? `${birthdays.length} proche${birthdays.length > 1 ? 's' : ''}` : undefined,
      action: () => handleAction(() => setIsBirthdayModalOpen(true)),
    },
    {
      icon: Gift,
      label: 'Créer une cagnotte collective',
      description: 'Pour un événement spécial',
      color: 'text-accent',
      badge: !context.hasCreatedFund ? 'Nouveau' : undefined,
      action: () => handleAction(() => setIsShopModalOpen(true)),
    },
    {
      icon: MessageCircleHeart,
      label: 'Envoyer un message de gratitude',
      description: 'Remerciez quelqu\'un publiquement',
      color: 'text-pink-500',
      badge: context.hasUnthankededGifts ? `${context.recentGiftsCount} cadeau${context.recentGiftsCount > 1 ? 'x' : ''}` : undefined,
      action: () => handleAction(() => setIsGratitudeModalOpen(true)),
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  ease: [0.23, 1, 0.32, 1]
                }}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 px-4 justify-start gap-4 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  onClick={item.action}
                >
                  <motion.div 
                    className={`p-2 rounded-xl bg-background ${item.color}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
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
              </motion.div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <AnimatePresence mode="wait">
        {isPostDrawerOpen && (
          <CreatePostDrawer 
            open={isPostDrawerOpen} 
            onOpenChange={setIsPostDrawerOpen}
            initialMode={postDrawerInitialMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isShopModalOpen && (
          <ShopForCollectiveGiftModal 
            isOpen={isShopModalOpen}
            onClose={() => setIsShopModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isBirthdayModalOpen && (
          <SendBirthdayMessageModal 
            isOpen={isBirthdayModalOpen}
            onClose={() => setIsBirthdayModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isGratitudeModalOpen && (
          <SendGratitudeModal 
            isOpen={isGratitudeModalOpen}
            onClose={() => setIsGratitudeModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
