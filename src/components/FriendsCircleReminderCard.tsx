import { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
}

export function FriendsCircleReminderCard({ onFriendAdded }: FriendsCircleReminderCardProps) {
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

  // Different styles based on progress
  const getCardStyle = () => {
    if (contactsCount === 0) {
      return 'bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/20 border-primary/30';
    }
    return 'bg-gradient-to-r from-gift/10 to-heart/10 border-gift/30';
  };

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`${getCardStyle()} shadow-soft overflow-hidden`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <motion.div 
                className="p-2 bg-primary/20 rounded-full shrink-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users className="h-5 w-5 text-primary" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-poppins font-semibold text-foreground mb-1">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {subtitle}
                </p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{contactsCount}/{minimumContacts} amis ajoutés</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowAddFriendModal(true)}
                    className="flex-1 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Ajouter mes amis
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={snoozeReminder}
                    className="text-muted-foreground"
                  >
                    <Clock className="h-4 w-4 mr-1" />
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
