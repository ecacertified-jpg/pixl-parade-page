import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, CheckCircle, Circle, ChevronDown, ChevronUp, X, Sparkles,
  Store, Package, Truck, Wallet, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingStep } from '@/hooks/useBusinessOnboarding';
import { useBusinessSetupTier } from '@/hooks/useBusinessSetupTier';
import { SetupTierBadge, NextTierTeaser } from '@/components/business-setup/SetupTierBadge';

interface BusinessOnboardingChecklistProps {
  steps: OnboardingStep[];
  progress: number;
  completedCount: number;
  totalSteps: number;
  onDismiss: () => void;
  businessId?: string;
  onOpenProfileSettings: () => void;
  onOpenAddProduct: () => void;
  onOpenDeliverySettings: () => void;
  onOpenPaymentSettings: () => void;
  onOpenNotificationSettings: () => void;
}

const stepIcons: Record<string, React.ReactNode> = {
  profile: <Store className="w-4 h-4" />,
  'first-product': <Package className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  payment: <Wallet className="w-4 h-4" />,
  notifications: <Bell className="w-4 h-4" />,
};

// Short, incentive-driven benefit per step
const stepBenefits: Record<string, string> = {
  profile: '+3,2× de clics avec un logo + une description',
  'first-product': '×5 chances de vente dès 3 produits en ligne',
  delivery: '+70% de contacts si la livraison est claire',
  payment: '×2 conversion avec un moyen de paiement local',
  notifications: 'Ne ratez plus aucune commande',
};

const stepDuration: Record<string, string> = {
  profile: '~1 min',
  'first-product': '~2 min',
  delivery: '~1 min',
  payment: '~30 s',
  notifications: '~30 s',
};

export const BusinessOnboardingChecklist = ({
  steps,
  progress,
  completedCount,
  totalSteps,
  onDismiss,
  businessId,
  onOpenProfileSettings,
  onOpenAddProduct,
  onOpenDeliverySettings,
  onOpenPaymentSettings,
  onOpenNotificationSettings,
}: BusinessOnboardingChecklistProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();
  const { tier, nextTier } = useBusinessSetupTier(businessId);

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
      case 'notifications':
        return onOpenNotificationSettings;
      default:
        return () => {};
    }
  };

  if (isDismissed || tier === 'gold') return null;

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
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {completedCount}/{totalSteps} actions
                  </span>
                  <SetupTierBadge tier={tier} size="sm" />
                </div>
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
          <div className="mt-2">
            <NextTierTeaser nextTier={nextTier} />
          </div>
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
                <Button
                  onClick={() => navigate('/business/setup')}
                  className="w-full mb-3 gap-2 bg-gradient-to-r from-primary to-accent"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Mode immersif guidé
                </Button>
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
                            <>
                              <p className="text-xs text-primary font-medium truncate">
                                {stepBenefits[step.id] ?? step.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {stepDuration[step.id] ?? ''}
                              </p>
                            </>
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
