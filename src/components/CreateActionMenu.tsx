import { useState } from 'react';
import { UserPlus, Cake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { InviteFriendsModal } from '@/components/InviteFriendsModal';
import { BirthdayPageBuilderModal } from '@/components/BirthdayPageBuilderModal';
import { Badge } from '@/components/ui/badge';
import { useUserContext } from '@/hooks/useUserContext';
import { useBirthdayPageBuilderStatus } from '@/hooks/useBirthdayPageBuilderStatus';

interface CreateActionMenuProps {
  children: React.ReactNode;
}

export function CreateActionMenu({ children }: CreateActionMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBirthdayBuilderOpen, setIsBirthdayBuilderOpen] = useState(false);
  const { context } = useUserContext();
  const { status: bpStatus } = useBirthdayPageBuilderStatus();

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const menuItems = [
    {
      icon: Cake,
      label: "Ma page d'anniversaire",
      description: 'Crée et complète ta page en 6 étapes',
      color: 'text-pink-500',
      badge: bpStatus
        ? bpStatus.completedCount === bpStatus.totalCount
          ? '✅ Complète'
          : `${bpStatus.completedCount} / ${bpStatus.totalCount}`
        : 'Nouveau',
      action: () => handleAction(() => setIsBirthdayBuilderOpen(true)),
    },
    {
      icon: UserPlus,
      label: 'Inviter des amis',
      description: 'Développez votre réseau',
      color: 'text-green-500',
      badge: context.contactsCount < 3 ? 'Recommandé' : undefined,
      action: () => handleAction(() => setIsInviteModalOpen(true)),
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

      <InviteFriendsModal 
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
      <BirthdayPageBuilderModal
        open={isBirthdayBuilderOpen}
        onOpenChange={setIsBirthdayBuilderOpen}
      />
    </>
  );
}
