import { motion } from 'framer-motion';
import { 
  PartyPopper, Store, Package, Truck, Wallet, CheckCircle, Bell,
  LucideIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, LucideIcon> = {
  PartyPopper,
  Store,
  Package,
  Truck,
  Wallet,
  CheckCircle,
  Bell,
};

interface BusinessOnboardingStepProps {
  stepId: string;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  required: boolean;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export const BusinessOnboardingStep = ({
  stepId,
  title,
  description,
  icon,
  isCompleted,
  primaryAction,
  secondaryAction,
  children,
}: BusinessOnboardingStepProps) => {
  const IconComponent = iconMap[icon] || Store;

  const getGradient = () => {
    switch (stepId) {
      case 'welcome':
        return 'from-celebration via-primary to-accent';
      case 'profile':
        return 'from-primary via-primary/80 to-accent';
      case 'first-product':
        return 'from-gift via-heart to-primary';
      case 'delivery':
        return 'from-success via-primary to-accent';
      case 'payment':
        return 'from-gratitude via-primary to-heart';
      case 'notifications':
        return 'from-primary via-accent to-celebration';
      case 'complete':
        return 'from-celebration via-success to-primary';
      default:
        return 'from-primary to-accent';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[400px] px-6 text-center"
    >
      {/* Icon with gradient background */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={`w-24 h-24 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center mb-6 shadow-lg`}
      >
        <IconComponent className="w-12 h-12 text-white" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-poppins font-semibold text-foreground mb-3"
      >
        {title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground font-nunito max-w-md mb-8"
      >
        {description}
      </motion.p>

      {/* Completion badge */}
      {isCompleted && stepId !== 'welcome' && stepId !== 'complete' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2 text-success mb-6 bg-success/10 px-4 py-2 rounded-full"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Complété</span>
        </motion.div>
      )}

      {/* Custom content */}
      {children}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-xs"
      >
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
            className="flex-1"
          >
            {secondaryAction.label}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};
