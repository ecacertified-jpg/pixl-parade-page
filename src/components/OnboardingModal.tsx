import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Gift, Heart, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    id: 1,
    title: '🎉 Bienvenue sur JOIE DE VIVRE !',
    description: 'La plateforme qui célèbre vos moments de bonheur',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 2,
    title: '🎁 Comment ça marche ?',
    description: 'Ajoutez vos amis, créez votre liste de souhaits, et recevez des cadeaux lors de vos moments spéciaux : anniversaires, promotions, mariages...',
    icon: Gift,
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 3,
    title: '👥 Créez votre cercle d\'amis',
    description: 'Ajoutez vos amis pour qu\'ils puissent vous offrir des cadeaux et vice-versa ! Plus votre cercle est grand, plus vous recevrez de surprises.',
    icon: Users,
    gradient: 'from-orange-500 to-amber-600',
  },
];

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && currentStep === 0) {
      // Trigger confetti on first step
      const duration = 3000;
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

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCreateFriends = () => {
    onComplete();
    navigate('/dashboard?tab=amis&add=true');
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={handleSkip}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-2 border-primary/20">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8 sm:p-12"
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
                <h2 className="text-3xl font-bold text-foreground">
                  {currentStepData.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
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
                        : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {currentStep < steps.length - 1 ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="order-2 sm:order-1"
                    >
                      Découvrir d'abord
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="gap-2 order-1 sm:order-2"
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="order-2 sm:order-1"
                    >
                      Plus tard
                    </Button>
                    <Button
                      onClick={handleCreateFriends}
                      className="gap-2 order-1 sm:order-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      <Heart className="h-4 w-4" />
                      Créer mon cercle d'amis
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
