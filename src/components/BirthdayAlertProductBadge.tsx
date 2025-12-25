import { useState } from 'react';
import { Cake, Clock, Gift, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BirthdayAlert } from '@/hooks/useBusinessBirthdayAlerts';

interface BirthdayAlertProductBadgeProps {
  alert: BirthdayAlert;
  onCreateFund: (alert: BirthdayAlert) => void;
  onDismiss: (alertId: string) => void;
  compact?: boolean;
}

export function BirthdayAlertProductBadge({
  alert,
  onCreateFund,
  onDismiss,
  compact = false
}: BirthdayAlertProductBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityStyles = () => {
    switch (alert.priority) {
      case 'critical':
        return {
          badge: 'bg-destructive text-destructive-foreground animate-pulse',
          glow: 'shadow-[0_0_20px_rgba(255,77,109,0.6)]',
          ring: 'ring-2 ring-destructive ring-offset-2'
        };
      case 'urgent':
        return {
          badge: 'bg-orange-500 text-white',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
          ring: 'ring-2 ring-orange-500 ring-offset-1'
        };
      case 'high':
        return {
          badge: 'bg-primary text-primary-foreground',
          glow: 'shadow-[0_0_12px_rgba(122,93,199,0.4)]',
          ring: 'ring-2 ring-primary ring-offset-1'
        };
      default:
        return {
          badge: 'bg-secondary text-secondary-foreground',
          glow: '',
          ring: ''
        };
    }
  };

  const styles = getPriorityStyles();

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={`absolute -top-2 -right-2 z-10 ${styles.glow}`}
              animate={{
                scale: alert.priority === 'critical' ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 0.6,
                repeat: alert.priority === 'critical' ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Badge className={`${styles.badge} px-2 py-1 flex items-center gap-1`}>
                <Cake className="h-3 w-3" />
                <span className="text-xs font-bold">{alert.days_until_birthday}j</span>
              </Badge>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={alert.target_user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {alert.target_user_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{alert.target_user_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Anniversaire dans {alert.days_until_birthday} jours
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="w-full gap-2"
                onClick={() => onCreateFund(alert)}
              >
                <Gift className="h-4 w-4" />
                Créer une cagnotte
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      className={`relative rounded-xl border bg-card p-4 ${styles.ring} ${styles.glow}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(alert.id)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Priority indicator */}
      <motion.div
        className="absolute -top-3 left-4"
        animate={alert.priority === 'critical' ? {
          y: [0, -3, 0]
        } : {}}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Badge className={styles.badge}>
          {alert.priority === 'critical' && '🔥 '}
          {alert.priority === 'urgent' && '⚡ '}
          {alert.days_until_birthday} jours
        </Badge>
      </motion.div>

      {/* Content */}
      <div className="mt-4 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={isHovered ? { scale: 1.1, rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={alert.target_user_avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                {alert.target_user_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div>
            <h4 className="font-semibold text-foreground">{alert.target_user_name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cake className="h-3 w-3" />
              <span>Anniversaire le {alert.birthday_date ? new Date(alert.birthday_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Product info */}
        {alert.product && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            {alert.product.image_url ? (
              <img 
                src={alert.product.image_url} 
                alt={alert.product.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{alert.product.name}</p>
              <p className="text-sm text-primary font-semibold">
                {alert.product.price.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            onClick={() => onCreateFund(alert)}
          >
            <Users className="h-4 w-4" />
            Créer une cagnotte collective
          </Button>
        </motion.div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {alert.days_until_birthday <= 3 
              ? `Plus que ${alert.days_until_birthday} jour${alert.days_until_birthday > 1 ? 's' : ''} !`
              : `${alert.days_until_birthday} jours restants`
            }
          </span>
        </div>
      </div>
    </motion.div>
  );
}
