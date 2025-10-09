import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GiftPromiseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  authorName: string;
  occasion?: string;
  birthdayDate?: string;
}

export function GiftPromiseModal({
  open,
  onOpenChange,
  onConfirm,
  authorName,
  occasion = 'anniversaire',
  birthdayDate
}: GiftPromiseModalProps) {
  
  useEffect(() => {
    if (open) {
      // Déclencher les confettis à l'ouverture
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleConfirm = () => {
    // Vibration haptique si disponible
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
    
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-full">
                <Gift className="h-12 w-12 text-primary" />
              </div>
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            🎁 Promesse de cadeau
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            <p className="text-sm leading-relaxed mb-3">
              Vous vous engagez à contribuer à offrir un cadeau à{' '}
              <span className="font-semibold text-foreground">{authorName}</span>
              {' '}pour son <span className="font-semibold text-foreground">{occasion}</span>
              {birthdayDate && (
                <span> le <span className="font-semibold text-foreground">{birthdayDate}</span></span>
              )}.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Cette promesse sera enregistrée et vous recevrez une notification pour ne pas l'oublier ! 🎉
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          >
            <Gift className="h-4 w-4 mr-2" />
            Confirmer ma promesse
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
