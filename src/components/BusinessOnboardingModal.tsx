import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BusinessOnboardingStep } from '@/components/BusinessOnboardingStep';
import { OnboardingStep } from '@/hooks/useBusinessOnboarding';

interface BusinessOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  steps: OnboardingStep[];
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onGoToStep: (index: number) => void;
  onComplete: () => void;
  onSkip: () => void;
  onOpenProfileSettings: () => void;
  onOpenAddProduct: () => void;
  onOpenDeliverySettings: () => void;
  onOpenPaymentSettings: () => void;
  onOpenNotificationSettings: () => void;
}

export const BusinessOnboardingModal = ({
  open,
  onClose,
  steps,
  currentStepIndex,
  onNextStep,
  onPrevStep,
  onGoToStep,
  onComplete,
  onSkip,
  onOpenProfileSettings,
  onOpenAddProduct,
  onOpenDeliverySettings,
  onOpenPaymentSettings,
  onOpenNotificationSettings,
}: BusinessOnboardingModalProps) => {
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  // Trigger confetti on welcome and complete steps
  useEffect(() => {
    if (open && (currentStep?.id === 'welcome' || currentStep?.id === 'complete')) {
      if (!hasTriggeredConfetti || currentStep?.id === 'complete') {
        const timer = setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948'],
          });
        }, 300);
        setHasTriggeredConfetti(true);
        return () => clearTimeout(timer);
      }
    }
  }, [open, currentStep?.id, hasTriggeredConfetti]);

  const getStepActions = (stepId: string) => {
    switch (stepId) {
      case 'welcome':
        return {
          primary: { label: 'Commencer', onClick: onNextStep },
          secondary: { label: 'Passer', onClick: onSkip },
        };
      case 'profile':
        return {
          primary: { 
            label: currentStep.isCompleted ? 'Continuer' : 'Configurer le profil', 
            onClick: currentStep.isCompleted ? onNextStep : () => { onOpenProfileSettings(); onClose(); }
          },
          secondary: { label: 'Passer', onClick: onNextStep },
        };
      case 'first-product':
        return {
          primary: { 
            label: currentStep.isCompleted ? 'Continuer' : 'Ajouter un produit', 
            onClick: currentStep.isCompleted ? onNextStep : () => { onOpenAddProduct(); onClose(); }
          },
          secondary: { label: 'Passer', onClick: onNextStep },
        };
      case 'delivery':
        return {
          primary: { 
            label: currentStep.isCompleted ? 'Continuer' : 'Configurer la livraison', 
            onClick: currentStep.isCompleted ? onNextStep : () => { onOpenDeliverySettings(); onClose(); }
          },
          secondary: { label: 'Passer', onClick: onNextStep },
        };
      case 'payment':
        return {
          primary: { 
            label: currentStep.isCompleted ? 'Continuer' : 'Configurer le paiement', 
            onClick: currentStep.isCompleted ? onNextStep : () => { onOpenPaymentSettings(); onClose(); }
          },
          secondary: { label: 'Passer', onClick: onNextStep },
        };
      case 'notifications':
        return {
          primary: { 
            label: currentStep.isCompleted ? 'Continuer' : 'Activer les notifications', 
            onClick: currentStep.isCompleted ? onNextStep : () => { onOpenNotificationSettings(); }
          },
          secondary: { label: 'Passer', onClick: onNextStep },
        };
      case 'complete':
        return {
          primary: { label: 'Accéder à mon espace', onClick: onComplete },
        };
      default:
        return {
          primary: { label: 'Continuer', onClick: onNextStep },
        };
    }
  };

  const actions = currentStep ? getStepActions(currentStep.id) : null;
  const progressValue = ((currentStepIndex) / (steps.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-background border-border">
        {/* Header with progress */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Étape {currentStepIndex + 1} sur {steps.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Step content */}
        <div className="min-h-[450px] flex flex-col">
          <AnimatePresence mode="wait">
            {currentStep && (
              <BusinessOnboardingStep
                key={currentStep.id}
                stepId={currentStep.id}
                title={currentStep.title}
                description={currentStep.description}
                icon={currentStep.icon}
                isCompleted={currentStep.isCompleted}
                required={currentStep.required}
                primaryAction={actions?.primary}
                secondaryAction={actions?.secondary}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation dots */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => onGoToStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'bg-primary w-6'
                    : step.isCompleted
                    ? 'bg-success'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Nav arrows */}
          <div className="flex justify-between mt-4">
            <Button
              variant="ghost"
              onClick={onPrevStep}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button
              variant="ghost"
              onClick={isLastStep ? onComplete : onNextStep}
              className="gap-1"
            >
              {isLastStep ? 'Terminer' : 'Suivant'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
