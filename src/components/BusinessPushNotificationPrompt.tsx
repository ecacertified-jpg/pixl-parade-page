import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, ShoppingCart, Cake, X, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BusinessPushNotificationPromptProps {
  open: boolean;
  onClose: () => void;
  businessId?: string;
}

export const BusinessPushNotificationPrompt = ({ 
  open, 
  onClose,
  businessId 
}: BusinessPushNotificationPromptProps) => {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, subscribe, loading, sendTestNotification } = usePushNotifications();
  const [isActivating, setIsActivating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Show the modal even when permission is denied (to show instructions)
  const permissionDenied = permission === 'denied';
  const shouldShow = open && isSupported && !isSubscribed;

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await subscribe();
      // Mark as prompted in localStorage for this business
      if (user && businessId) {
        localStorage.setItem(`business_push_prompted_${businessId}`, 'true');
      }
      toast.success('Notifications activées !', {
        description: 'Vous recevrez une alerte pour chaque nouvelle commande.',
        icon: '🔔'
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'activation des notifications:', error);
      toast.error('Erreur lors de l\'activation');
    } finally {
      setIsActivating(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await sendTestNotification();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSkip = () => {
    // Mark as prompted so we don't show again
    if (user && businessId) {
      localStorage.setItem(`business_push_prompted_${businessId}`, 'true');
    }
    onClose();
  };

  // If already subscribed, show a success state instead
  if (open && isSubscribed) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-2 border-success/20">
          <div className="relative p-6 sm:p-8">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-success to-success/60 flex items-center justify-center mb-5 shadow-lg"
            >
              <Bell className="h-8 w-8 text-white" />
            </motion.div>

            <div className="text-center space-y-3 mb-6">
              <h2 className="text-xl font-bold text-foreground">
                ✅ Notifications actives
              </h2>
              <p className="text-sm text-muted-foreground">
                Vous recevez déjà les notifications pour vos commandes et opportunités.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleTest}
                disabled={isTesting}
                variant="outline"
                className="w-full gap-2"
              >
                <Smartphone className="h-4 w-4" />
                {isTesting ? 'Envoi...' : 'Tester les notifications'}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-muted-foreground"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!shouldShow) return null;

  // If permission is denied, show instructions to unblock
  if (permissionDenied) {
    return (
      <Dialog open={shouldShow} onOpenChange={handleSkip}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-2 border-destructive/20">
          <div className="relative p-6 sm:p-8">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-destructive/80 to-destructive/40 flex items-center justify-center mb-5 shadow-lg"
            >
              <Bell className="h-8 w-8 text-white" />
            </motion.div>

            <div className="text-center space-y-3 mb-6">
              <h2 className="text-xl font-bold text-foreground">
                🚫 Notifications bloquées
              </h2>
              <p className="text-sm text-muted-foreground">
                Vous avez précédemment refusé les notifications. Pour les activer :
              </p>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <span className="text-muted-foreground">
                  Cliquez sur l'icône 🔒 à gauche de la barre d'adresse
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <span className="text-muted-foreground">
                  Trouvez "Notifications" et changez en "Autoriser"
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <span className="text-muted-foreground">
                  Rechargez la page et réessayez
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full gap-2"
              >
                Recharger la page
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-muted-foreground"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
              🔔 Ne manquez aucune commande !
            </h2>
            <p className="text-sm text-muted-foreground">
              Soyez alerté instantanément sur votre téléphone, même quand l'app est fermée.
            </p>
          </div>

          {/* Benefits for Business */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Notification immédiate à chaque nouvelle commande</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cake className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Alertes d'opportunités d'anniversaires (wishlists)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Fonctionne même quand le navigateur est fermé</span>
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
