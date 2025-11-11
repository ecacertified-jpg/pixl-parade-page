import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ReciprocityBadge, getBadgeByScore } from './ReciprocityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Share2, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

interface BadgeEarnedNotificationCardProps {
  newScore: number;
  oldScore: number;
  onDismiss: () => void;
  onShare?: () => void;
}

export function BadgeEarnedNotificationCard({
  newScore,
  oldScore,
  onDismiss,
  onShare,
}: BadgeEarnedNotificationCardProps) {
  const oldBadge = getBadgeByScore(oldScore);
  const newBadge = getBadgeByScore(newScore);

  // Check if badge level actually changed
  const badgeChanged = oldBadge.level !== newBadge.level;

  useEffect(() => {
    if (badgeChanged) {
      // Trigger confetti celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.3),
            y: Math.random() - 0.2,
          },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
        });

        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.7, 0.9),
            y: Math.random() - 0.2,
          },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [badgeChanged]);

  if (!badgeChanged) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      transition={{ type: 'spring', damping: 15 }}
      className="fixed bottom-6 right-6 z-50 max-w-md"
    >
      <Card className="border-2 border-primary shadow-2xl bg-gradient-to-br from-background to-primary/5">
        <CardContent className="p-6 space-y-4">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xl font-bold">Nouveau Badge Débloqué !</h3>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              Félicitations pour votre progression !
            </p>
          </motion.div>

          {/* Badge Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ delay: 0.4, type: 'spring', damping: 10 }}
            className="flex justify-center py-4"
          >
            <ReciprocityBadge score={newScore} size="xl" showLabel showScore animated />
          </motion.div>

          {/* Badge Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-muted/50 rounded-lg p-4 space-y-2"
          >
            <p className="text-sm font-medium text-center">{newBadge.description}</p>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-center">Nouveaux avantages:</p>
              {newBadge.perks.slice(0, 3).map((perk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{perk}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-2">
            {onShare && (
              <Button variant="outline" className="flex-1" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            )}
            <Button className="flex-1" onClick={onDismiss}>
              Super !
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}