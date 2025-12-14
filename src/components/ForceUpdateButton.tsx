import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ForceUpdateButton = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const forceUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Étape 1: Supprimer tous les caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[Update] Caches supprimés:', cacheNames);
      }

      // Étape 2: Désenregistrer le Service Worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('[Update] Service Workers désenregistrés');
      }

      toast.success('Mise à jour en cours...', {
        description: 'L\'application va se recharger'
      });

      // Étape 3: Recharger la page sans cache
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('[Update] Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={forceUpdate}
      disabled={isUpdating}
      variant="outline"
      className="w-full gap-2"
    >
      {isUpdating ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Mise à jour...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Forcer la mise à jour de l'application
        </>
      )}
    </Button>
  );
};
