import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Users, Gift, ArrowRight, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
  currentStep: number;
  onSetStep: (step: number) => void;
}

const steps = [
  {
    id: 'welcome',
    title: '🎉 Bienvenue sur JOIE DE VIVRE !',
    description: 'Célébrez les moments qui comptent avec vos proches. Offrez et recevez des cadeaux pour chaque occasion spéciale !',
    icon: Sparkles,
    gradient: 'from-primary to-accent',
  },
  {
    id: 'friends',
    title: '👥 Créez votre cercle d\'amis',
    description: 'Plus votre cercle est grand, plus vous recevrez de surprises ! Ajoutez vos amis et proches pour ne manquer aucun anniversaire.',
    icon: Users,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'wishlist',
    title: '🎁 Créez votre liste de souhaits',
    description: 'Dites à vos proches ce qui vous ferait plaisir ! Ils verront votre liste et pourront vous offrir le cadeau parfait.',
    icon: Gift,
    gradient: 'from-heart to-gift',
  },
];

export const OnboardingModal = ({ open, onComplete, currentStep, onSetStep }: OnboardingModalProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (open && currentStep === 0) {
      const duration = 2500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#f97316'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#f97316'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [open, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onSetStep(currentStep + 1);
    }
  };

  const handleAddFriends = () => {
    onComplete();
    navigate('/dashboard?tab=amis&add=true');
  };

  const handleCreateWishlist = () => {
    onComplete();
    navigate('/wishlist-catalog');
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      onSetStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={() => onComplete()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-2 border-primary/20">
        {/* Progress bar */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground font-nunito">
              Étape {currentStep + 1} sur {steps.length}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-8 pt-6"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${currentStepData.gradient} flex items-center justify-center mb-6 shadow-lg`}
            >
              <Icon className="h-10 w-10 text-white" />
            </motion.div>

            {/* Content */}
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-2xl font-poppins font-bold text-foreground">
                {currentStepData.title}
              </h2>
              <p className="text-base text-muted-foreground font-nunito max-w-md mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-success'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {currentStep === 0 && (
                <Button
                  onClick={handleNext}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  size="lg"
                >
                  C'est parti !
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {currentStep === 1 && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="order-2 sm:order-1"
                  >
                    Plus tard
                  </Button>
                  <Button
                    onClick={handleAddFriends}
                    className="gap-2 order-1 sm:order-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    size="lg"
                  >
                    <Users className="h-4 w-4" />
                    Ajouter mes amis
                  </Button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => onComplete()}
                    className="order-2 sm:order-1"
                  >
                    Plus tard
                  </Button>
                  <Button
                    onClick={handleCreateWishlist}
                    className="gap-2 order-1 sm:order-2 bg-gradient-to-r from-heart to-gift hover:opacity-90"
                    size="lg"
                  >
                    <Heart className="h-4 w-4" />
                    Créer ma liste de souhaits
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
