import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Heart, Star, Crown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerCelebrationFeedback } from '@/utils/celebrationFeedback';

export interface FriendCircleBadge {
  key: string;
  name: string;
  icon: 'users' | 'heart' | 'star' | 'crown' | 'sparkles';
  threshold: number;
  colors: string[];
  message: string;
}

export const FRIEND_CIRCLE_BADGES: FriendCircleBadge[] = [
  {
    key: 'first_circle',
    name: 'Premier Cercle',
    icon: 'users',
    threshold: 2,
    colors: ['#7A5DC7', '#C084FC', '#FAD4E1'],
    message: 'Vous avez commencé à construire votre cercle d\'amis !'
  },
  {
    key: 'growing_circle',
    name: 'Cercle en Croissance',
    icon: 'heart',
    threshold: 5,
    colors: ['#22C55E', '#4ADE80', '#86EFAC'],
    message: 'Votre cercle d\'amis grandit magnifiquement !'
  },
  {
    key: 'social_butterfly',
    name: 'Papillon Social',
    icon: 'sparkles',
    threshold: 10,
    colors: ['#FF69B4', '#FFB6C1', '#FFC0CB'],
    message: 'Vous êtes un véritable papillon social !'
  },
  {
    key: 'network_builder',
    name: 'Bâtisseur de Réseau',
    icon: 'star',
    threshold: 25,
    colors: ['#3B82F6', '#60A5FA', '#93C5FD'],
    message: 'Vous construisez un réseau impressionnant !'
  },
  {
    key: 'community_leader',
    name: 'Leader Communautaire',
    icon: 'crown',
    threshold: 50,
    colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
    message: 'Vous êtes un leader de communauté exceptionnel !'
  }
];

const iconMap = {
  users: Users,
  heart: Heart,
  star: Star,
  crown: Crown,
  sparkles: Sparkles
};

interface FriendsCircleBadgeCelebrationProps {
  badge: FriendCircleBadge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FriendsCircleBadgeCelebration({ 
  badge, 
  isOpen, 
  onClose 
}: FriendsCircleBadgeCelebrationProps) {
  
  useEffect(() => {
    if (isOpen && badge) {
      // Trigger celebration feedback
      triggerCelebrationFeedback({
        sound: 'tada',
        vibration: 'celebration'
      });
      
      // Fire confetti with badge colors
      const fireConfetti = () => {
        const colors = badge.colors;
        
        // Left burst
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors
        });
        
        // Right burst
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors
        });
        
        // Center explosion
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { x: 0.5, y: 0.5 },
            colors
          });
        }, 200);
      };
      
      fireConfetti();
      
      // Second wave after 500ms
      const timer = setTimeout(fireConfetti, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, badge]);
  
  if (!badge) return null;
  
  const IconComponent = iconMap[badge.icon];
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-none bg-gradient-to-br from-card via-card to-secondary/30 overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="flex flex-col items-center py-6 text-center"
            >
              {/* Badge icon with animation */}
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ 
                  rotate: [0, 10, -10, 5, 0],
                  scale: 1
                }}
                transition={{ 
                  delay: 0.2,
                  type: 'spring',
                  damping: 10,
                  stiffness: 100
                }}
                className="relative mb-6"
              >
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 blur-2xl opacity-50 rounded-full"
                  style={{ backgroundColor: badge.colors[0] }}
                />
                
                {/* Badge circle */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      `0 0 20px ${badge.colors[0]}40`,
                      `0 0 40px ${badge.colors[0]}60`,
                      `0 0 20px ${badge.colors[0]}40`
                    ]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="relative w-28 h-28 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${badge.colors[0]}, ${badge.colors[1]})` 
                  }}
                >
                  <IconComponent className="w-14 h-14 text-white" />
                </motion.div>
                
                {/* Sparkle particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      x: Math.cos((i * 60) * Math.PI / 180) * 60,
                      y: Math.sin((i * 60) * Math.PI / 180) * 60
                    }}
                    transition={{
                      delay: 0.5 + i * 0.1,
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles 
                      className="w-full h-full" 
                      style={{ color: badge.colors[i % badge.colors.length] }}
                    />
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-poppins font-bold mb-2">
                  🎉 Nouveau Badge Débloqué !
                </h2>
                <p 
                  className="text-xl font-semibold"
                  style={{ color: badge.colors[0] }}
                >
                  {badge.name}
                </p>
              </motion.div>
              
              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mt-4 mb-6 px-4"
              >
                {badge.message}
              </motion.p>
              
              {/* Threshold info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
              >
                <Users className="w-4 h-4" />
                <span>{badge.threshold} amis dans votre cercle</span>
              </motion.div>
              
              {/* Close button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button 
                  onClick={onClose}
                  className="px-8"
                  style={{ 
                    background: `linear-gradient(135deg, ${badge.colors[0]}, ${badge.colors[1]})` 
                  }}
                >
                  Super ! 🎊
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
