import { useEffect, useRef, useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCelebrationFeedback } from '@/hooks/useCelebrationFeedback';
import confetti from 'canvas-confetti';

interface AnimatedGiftButtonProps {
  friendId: string;
  friendName: string;
  daysUntilBirthday: number;
  onClick: () => void;
}

export function AnimatedGiftButton({ 
  friendId, 
  friendName, 
  daysUntilBirthday, 
  onClick 
}: AnimatedGiftButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const { triggerFeedback } = useCelebrationFeedback();
  const isUrgent = daysUntilBirthday <= 7 && daysUntilBirthday >= 0;
  const isVeryUrgent = daysUntilBirthday <= 3 && daysUntilBirthday >= 0;
  const isToday = daysUntilBirthday === 0;

  // Trigger confetti and sound/vibration once when component mounts and birthday is within 7 days
  useEffect(() => {
    if (isUrgent && !hasTriggeredConfetti && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      // Small confetti burst from button position
      setTimeout(() => {
        confetti({
          particleCount: isToday ? 50 : isVeryUrgent ? 30 : 15,
          spread: 60,
          origin: { x, y },
          colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fce7f3', '#fbbf24'],
          scalar: 0.8,
          gravity: 1.2,
          drift: 0,
          ticks: 100,
        });

        // Trigger sound and vibration based on urgency
        triggerFeedback({
          sound: isToday ? 'tada' : isVeryUrgent ? 'chime' : 'pop',
          vibration: isToday ? 'birthday' : isVeryUrgent ? 'urgent' : 'gentle',
        });
      }, 500);

      setHasTriggeredConfetti(true);
    }
  }, [isUrgent, isVeryUrgent, isToday, hasTriggeredConfetti, triggerFeedback]);

  const handleClick = () => {
    if (isUrgent && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      // Celebration confetti on click
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x, y },
        colors: ['#ec4899', '#f472b6', '#8b5cf6', '#fbbf24', '#34d399'],
      });

      // Trigger celebration sound and vibration
      triggerFeedback({
        sound: 'tada',
        vibration: 'celebration',
      });
    }
    onClick();
  };

  // Standard button without animation
  if (!isUrgent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClick}
              className="h-8 w-8 p-0 text-pink-500 hover:text-pink-600 hover:bg-pink-50"
            >
              <Gift className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-pink-500 text-white border-pink-500"
          >
            <p className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Offrir un cadeau à {friendName}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Animated button for upcoming birthdays
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div className="relative">
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-pink-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: isVeryUrgent ? 1 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Sparkles for very urgent */}
            <AnimatePresence>
              {isVeryUrgent && (
                <>
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0,
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-1 -left-1"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, -180, -360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.5,
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-pink-400" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                scale: isToday ? [1, 1.2, 1] : [1, 1.1, 1],
              }}
              transition={{
                duration: isToday ? 0.6 : 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Button 
                ref={buttonRef}
                variant="ghost" 
                size="sm" 
                onClick={handleClick}
                className={`h-8 w-8 p-0 relative z-10 ${
                  isToday 
                    ? 'text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' 
                    : isVeryUrgent 
                      ? 'text-pink-600 bg-pink-100 hover:bg-pink-200' 
                      : 'text-pink-500 hover:text-pink-600 hover:bg-pink-50'
                }`}
              >
                <Gift className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className={`border ${
            isToday 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-pink-500' 
              : 'bg-pink-500 text-white border-pink-500'
          }`}
        >
          <p className="flex items-center gap-1">
            {isToday ? '🎂' : '🎁'}
            {isToday 
              ? `C'est l'anniversaire de ${friendName} !` 
              : isVeryUrgent 
                ? `Anniversaire dans ${daysUntilBirthday}j - Offrez un cadeau !`
                : `Offrir un cadeau à ${friendName}`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
