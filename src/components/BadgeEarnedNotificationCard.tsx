import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface BadgeEarnedNotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata?: {
      badge_key: string;
      badge_name: string;
      badge_icon: string;
    };
  };
  onAction?: () => void;
  onViewBadges?: () => void;
}

export const BadgeEarnedNotificationCard = ({
  notification,
  onAction,
  onViewBadges
}: BadgeEarnedNotificationCardProps) => {
  useEffect(() => {
    // Trigger confetti
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-2 border-amber-500/50 shadow-xl">
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                opacity: 0
              }}
              animate={{
                y: [null, '-20%'],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>

        <div className="relative p-6 space-y-4">
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg"
            >
              <Trophy className="h-7 w-7 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-foreground mb-1">
                {notification.title}
              </h3>
              {notification.metadata?.badge_icon && (
                <div className="text-4xl my-2">
                  {notification.metadata.badge_icon}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <p className="text-base leading-relaxed text-foreground">
            {notification.message}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onViewBadges}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              Voir mes badges
            </Button>
            <Button
              onClick={onAction}
              variant="outline"
              className="border-amber-500/40 hover:bg-amber-500/10"
            >
              OK
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
