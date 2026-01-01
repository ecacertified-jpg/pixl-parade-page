import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cake, Share2, Gift, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

interface BirthdayCountdownCardProps {
  birthday: string | null;
  userName?: string;
  onCompleteProfile?: () => void;
}

export function BirthdayCountdownCard({ birthday, userName, onCompleteProfile }: BirthdayCountdownCardProps) {
  const navigate = useNavigate();
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const countdownData = useMemo(() => {
    if (!birthday) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const birthDate = new Date(birthday);
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );
    thisYearBirthday.setHours(0, 0, 0, 0);

    let nextBirthday = thisYearBirthday;
    if (thisYearBirthday < today) {
      nextBirthday = new Date(
        today.getFullYear() + 1,
        birthDate.getMonth(),
        birthDate.getDate()
      );
    }

    const daysUntil = Math.ceil(
      (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate progress (365 days cycle)
    const daysSinceLastBirthday = 365 - daysUntil;
    const progress = (daysSinceLastBirthday / 365) * 100;

    return { daysUntil, progress, nextBirthday };
  }, [birthday]);

  // Visual state based on days remaining
  const visualState = useMemo(() => {
    if (!countdownData) return null;
    const { daysUntil } = countdownData;

    if (daysUntil === 0) {
      return {
        variant: 'celebration' as const,
        colorClass: 'text-gratitude',
        bgClass: 'bg-gradient-to-br from-gratitude/20 via-gift/20 to-celebration/20',
        ringColor: 'hsl(45 88% 63%)', // gratitude
        message: 'Joyeux Anniversaire ! 🎂🎉',
        subMessage: 'C\'est ton jour spécial !',
        animate: true,
      };
    } else if (daysUntil === 1) {
      return {
        variant: 'tomorrow' as const,
        colorClass: 'text-gratitude',
        bgClass: 'bg-gradient-to-br from-gratitude/15 to-gift/15',
        ringColor: 'hsl(45 88% 63%)',
        message: 'C\'est demain ! 🥳',
        subMessage: 'Prépare-toi à célébrer !',
        animate: true,
      };
    } else if (daysUntil <= 7) {
      return {
        variant: 'urgent' as const,
        colorClass: 'text-primary',
        bgClass: 'bg-gradient-to-br from-primary/15 to-accent/15',
        ringColor: 'hsl(259 58% 59%)', // primary
        message: `C'est bientôt ! 🎉`,
        subMessage: `Plus que ${daysUntil} jours`,
        animate: true,
      };
    } else if (daysUntil <= 30) {
      return {
        variant: 'excited' as const,
        colorClass: 'text-accent',
        bgClass: 'bg-gradient-to-br from-accent/10 to-secondary/20',
        ringColor: 'hsl(272 76% 75%)', // accent
        message: `Plus que ${daysUntil} jours !`,
        subMessage: 'Ton anniversaire approche',
        animate: false,
      };
    } else {
      return {
        variant: 'neutral' as const,
        colorClass: 'text-muted-foreground',
        bgClass: 'bg-card',
        ringColor: 'hsl(var(--muted))',
        message: 'Ton anniversaire approche',
        subMessage: `Dans ${daysUntil} jours`,
        animate: false,
      };
    }
  }, [countdownData]);

  // Trigger confetti on D-Day
  useEffect(() => {
    if (countdownData?.daysUntil === 0 && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [countdownData, hasTriggeredConfetti]);

  // If no birthday, show CTA to complete profile
  if (!birthday) {
    return (
      <Card className="p-4 mb-4 bg-gradient-to-br from-secondary/30 to-accent/10 border-dashed border-2 border-primary/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Cake className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Quand est ton anniversaire ?
            </p>
            <p className="text-xs text-muted-foreground">
              Ajoute ta date de naissance pour voir ton compte à rebours
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onCompleteProfile}>
            Ajouter
          </Button>
        </div>
      </Card>
    );
  }

  if (!countdownData || !visualState) return null;

  const { daysUntil, progress } = countdownData;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`p-4 mb-4 ${visualState.bgClass} border-none shadow-soft overflow-hidden relative`}>
        {/* Sparkles decoration for celebration states */}
        {visualState.animate && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="absolute top-2 right-8 h-4 w-4 text-gratitude/60" />
            <Sparkles className="absolute bottom-3 left-6 h-3 w-3 text-accent/60" />
          </motion.div>
        )}

        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0">
            <svg width="90" height="90" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="45"
                cy="45"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <motion.circle
                cx="45"
                cy="45"
                r="40"
                stroke={visualState.ringColor}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={daysUntil}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  {daysUntil === 0 ? (
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        repeatDelay: 2 
                      }}
                    >
                      <Cake className="h-8 w-8 text-gratitude" />
                    </motion.div>
                  ) : (
                    <>
                      <span className={`text-2xl font-bold font-poppins ${visualState.colorClass}`}>
                        {daysUntil}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        jour{daysUntil > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <motion.p 
              className={`text-sm font-semibold font-poppins ${visualState.colorClass}`}
              animate={visualState.animate ? { 
                scale: [1, 1.02, 1] 
              } : undefined}
              transition={{ 
                duration: 2, 
                repeat: Infinity 
              }}
            >
              {visualState.message}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {visualState.subMessage}
            </p>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs px-2 gap-1"
                onClick={() => navigate('/preferences')}
              >
                <Gift className="h-3 w-3" />
                Ma wishlist
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-xs px-2 gap-1"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Mon anniversaire approche !',
                      text: `Plus que ${daysUntil} jours avant mon anniversaire ! 🎂`,
                      url: window.location.origin,
                    });
                  }
                }}
              >
                <Share2 className="h-3 w-3" />
                Partager
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
