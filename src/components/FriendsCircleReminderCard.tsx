import { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, PartyPopper, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFriendsCircleReminder } from '@/hooks/useFriendsCircleReminder';
import { AddFriendModal } from '@/components/AddFriendModal';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Friend {
  id: string;
  name: string;
  phone?: string;
  relationship?: string;
  location?: string;
  birthday?: Date;
}

interface FriendsCircleReminderCardProps {
  onFriendAdded?: () => void;
  compact?: boolean;
}

export function FriendsCircleReminderCard({ onFriendAdded, compact = false }: FriendsCircleReminderCardProps) {
  const { 
    shouldShowReminder, 
    contactsCount, 
    isLoading, 
    snoozeReminder, 
    refresh,
    minimumContacts 
  } = useFriendsCircleReminder();
  
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [prevContactsCount, setPrevContactsCount] = useState(contactsCount);

  // Detect when we reach the goal
  useEffect(() => {
    if (prevContactsCount < minimumContacts && contactsCount >= minimumContacts) {
      setJustCompleted(true);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7A5DC7', '#FAD4E1', '#C084FC', '#FF4D6D']
      });
      // Hide after celebration
      setTimeout(() => {
        setJustCompleted(false);
      }, 3000);
    }
    setPrevContactsCount(contactsCount);
  }, [contactsCount, prevContactsCount, minimumContacts]);

  const handleAddFriend = (friend: Friend) => {
    console.log('Friend added:', friend);
    refresh();
    onFriendAdded?.();
  };

  if (isLoading) return null;

  // Show celebration card briefly when goal is reached
  if (justCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className="bg-gradient-to-r from-success/20 to-accent/20 border-success/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-full">
                <PartyPopper className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-poppins font-semibold text-foreground">
                  Bravo ! Votre cercle est prêt 🎉
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez maintenant profiter de la générosité de vos proches !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!shouldShowReminder) return null;

  const progress = (contactsCount / minimumContacts) * 100;
  const remaining = minimumContacts - contactsCount;

  const getMessage = () => {
    if (contactsCount === 0) {
      return {
        title: 'Créez votre cercle d\'amis !',
        subtitle: 'Ajoutez vos proches pour recevoir des cadeaux lors de vos moments spéciaux.',
      };
    }
    return {
      title: `Encore ${remaining} ami${remaining > 1 ? 's' : ''} !`,
      subtitle: 'Complétez votre cercle pour profiter de la générosité de vos proches.',
    };
  };

  const { title, subtitle } = getMessage();

  // Compact version for global banner
  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="bg-destructive/10 border-b-2 border-destructive/50 px-4 py-3">
            <div className="max-w-md mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                </motion.div>
                <span className="text-sm font-medium text-destructive truncate">
                  {title}
                </span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowAddFriendModal(true)}
                className="shrink-0 gap-1.5 text-xs h-8"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Ajouter</span>
              </Button>
            </div>
          </div>

          <AddFriendModal
            isOpen={showAddFriendModal}
            onClose={() => setShowAddFriendModal(false)}
            onAddFriend={handleAddFriend}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full card version with urgent red styling
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-destructive/5 border-2 border-destructive/40 shadow-lg overflow-hidden">
          <CardContent className="p-4">
            {/* Urgent badge */}
            <div className="flex justify-between items-start mb-3">
              <Badge variant="destructive" className="text-xs font-semibold animate-pulse">
                ACTION REQUISE
              </Badge>
              <span className="text-xs text-muted-foreground">
                {contactsCount}/{minimumContacts} amis
              </span>
            </div>

            <div className="flex items-start gap-3">
              <motion.div 
                className="p-2.5 bg-destructive/20 rounded-full shrink-0"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Users className="h-5 w-5 text-destructive" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-poppins font-semibold text-foreground text-base sm:text-lg mb-1">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {subtitle}
                </p>

                {/* Progress bar with red color */}
                <div className="mb-4">
                  <Progress 
                    value={progress} 
                    className="h-2.5 bg-destructive/20 [&>div]:bg-destructive" 
                  />
                </div>

                {/* Action buttons - stacked on mobile */}
                <div className="flex flex-col xs:flex-row gap-2">
                  <Button
                    size="default"
                    variant="destructive"
                    onClick={() => setShowAddFriendModal(true)}
                    className="flex-1 gap-2 font-semibold"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter mes amis
                  </Button>
                  <Button
                    size="default"
                    variant="ghost"
                    onClick={snoozeReminder}
                    className="text-muted-foreground hover:text-foreground xs:flex-none"
                  >
                    <Clock className="h-4 w-4 mr-1.5" />
                    Plus tard
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AddFriendModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          onAddFriend={handleAddFriend}
        />
      </motion.div>
    </AnimatePresence>
  );
}
