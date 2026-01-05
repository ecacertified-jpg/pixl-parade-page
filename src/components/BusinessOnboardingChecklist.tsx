import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, CheckCircle, Circle, ChevronDown, ChevronUp, X,
  Store, Package, Truck, Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingStep } from '@/hooks/useBusinessOnboarding';

interface BusinessOnboardingChecklistProps {
  steps: OnboardingStep[];
  progress: number;
  completedCount: number;
  totalSteps: number;
  onDismiss: () => void;
  onOpenProfileSettings: () => void;
  onOpenAddProduct: () => void;
  onOpenDeliverySettings: () => void;
  onOpenPaymentSettings: () => void;
}

const stepIcons: Record<string, React.ReactNode> = {
  profile: <Store className="w-4 h-4" />,
  'first-product': <Package className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  payment: <Wallet className="w-4 h-4" />,
};

export const BusinessOnboardingChecklist = ({
  steps,
  progress,
  completedCount,
  totalSteps,
  onDismiss,
  onOpenProfileSettings,
  onOpenAddProduct,
  onOpenDeliverySettings,
  onOpenPaymentSettings,
}: BusinessOnboardingChecklistProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Filter out welcome and complete steps
  const checklistSteps = steps.filter(s => s.id !== 'welcome' && s.id !== 'complete');

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  const getStepAction = (stepId: string) => {
    switch (stepId) {
      case 'profile':
        return onOpenProfileSettings;
      case 'first-product':
        return onOpenAddProduct;
      case 'delivery':
        return onOpenDeliverySettings;
      case 'payment':
        return onOpenPaymentSettings;
      default:
        return () => {};
    }
  };

  if (isDismissed || progress === 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-background to-secondary/30 shadow-soft mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-poppins">
                  Configurez votre boutique
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{totalSteps} étapes complétées
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-3" />
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-2 pb-4">
                <ul className="space-y-2">
                  {checklistSteps.map((step) => (
                    <li key={step.id}>
                      <button
                        onClick={getStepAction(step.id)}
                        disabled={step.isCompleted}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          step.isCompleted
                            ? 'bg-success/10 text-success cursor-default'
                            : 'bg-muted/50 hover:bg-muted text-foreground hover:shadow-sm'
                        }`}
                      >
                        {step.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${step.isCompleted ? 'line-through opacity-70' : ''}`}>
                            {step.title}
                          </p>
                          {!step.isCompleted && (
                            <p className="text-xs text-muted-foreground truncate">
                              {step.description}
                            </p>
                          )}
                        </div>
                        {!step.isCompleted && (
                          <div className="text-primary">
                            {stepIcons[step.id]}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
