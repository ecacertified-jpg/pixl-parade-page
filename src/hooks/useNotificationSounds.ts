import { useEffect } from 'react';
import { playCelebrationSound, SoundType } from '@/utils/celebrationFeedback';
import { useNotificationPreferences } from './useNotificationPreferences';

export const useNotificationSounds = () => {
  const { preferences } = useNotificationPreferences();

  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_NOTIFICATION_SOUND') {
        const { soundType, notificationType } = event.data;
        
        // Vérifier si les sons sont activés
        if (preferences?.sound_enabled !== false) {
          console.log('[NotificationSounds] Playing sound:', soundType, 'for', notificationType);
          playCelebrationSound(soundType as SoundType);
        }
      }
    };

    // Écouter les messages du service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [preferences?.sound_enabled]);

  return null;
};
