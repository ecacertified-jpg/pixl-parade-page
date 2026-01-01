import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Gift, Calendar, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationPromptProps {
  open: boolean;
  onClose: () => void;
}

export const PushNotificationPrompt = ({ open, onClose }: PushNotificationPromptProps) => {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, subscribe, loading } = usePushNotifications();
  const [isActivating, setIsActivating] = useState(false);

  // Don't show if not supported, already subscribed, or permission denied
  const shouldShow = open && isSupported && !isSubscribed && permission !== 'denied';

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await subscribe();
      // Mark as prompted in localStorage
      if (user) {
        localStorage.setItem(`push_prompted_${user.id}`, 'true');
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'activation des notifications:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const handleSkip = () => {
    // Mark as prompted so we don't show again
    if (user) {
      localStorage.setItem(`push_prompted_${user.id}`, 'true');
    }
    onClose();
  };

  if (!shouldShow) return null;

  return (
    <Dialog open={shouldShow} onOpenChange={handleSkip}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-2 border-primary/20">
        <div className="relative p-6 sm:p-8">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-full"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-5 shadow-lg"
          >
            <Bell className="h-8 w-8 text-white" />
          </motion.div>

          {/* Content */}
          <div className="text-center space-y-3 mb-6">
            <h2 className="text-xl font-bold text-foreground">
              🔔 Activez les notifications
            </h2>
            <p className="text-sm text-muted-foreground">
              Ne manquez jamais un anniversaire ou une occasion spéciale !
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Rappels d'anniversaires de vos proches</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Alertes quand quelqu'un contribue à votre cadeau</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleActivate}
              disabled={isActivating || loading}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Bell className="h-4 w-4" />
              {isActivating ? 'Activation...' : 'Activer les notifications'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Plus tard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
