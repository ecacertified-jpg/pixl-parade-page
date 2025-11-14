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

interface CreateActionMenuProps {
  children: React.ReactNode;
}

export function CreateActionMenu({ children }: CreateActionMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isPostDrawerOpen, setIsPostDrawerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const menuItems = [
    {
      icon: FileText,
      label: 'Nouvelle publication',
      description: 'Partagez vos pensées',
      color: 'text-primary',
      action: () => handleAction(() => setIsPostDrawerOpen(true)),
    },
    {
      icon: Gift,
      label: 'Créer une cagnotte',
      description: 'Organisez une collecte',
      color: 'text-accent',
      action: () => handleAction(() => navigate('/gifts')),
    },
    {
      icon: Camera,
      label: 'Partager un moment',
      description: 'Ajoutez une photo ou vidéo',
      color: 'text-secondary',
      action: () => handleAction(() => setIsPostDrawerOpen(true)),
    },
    {
      icon: UserPlus,
      label: 'Inviter des amis',
      description: 'Développez votre réseau',
      color: 'text-green-500',
      action: () => handleAction(() => setIsInviteModalOpen(true)),
    },
    {
      icon: Calendar,
      label: 'Ajouter un événement',
      description: 'Enregistrez une date importante',
      color: 'text-orange-500',
      action: () => handleAction(() => navigate('/dashboard')),
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
                  <span className="font-medium text-foreground">{item.label}</span>
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
      <InviteFriendsModal 
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </>
  );
}
