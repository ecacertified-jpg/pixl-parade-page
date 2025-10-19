import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDJGn4Z6ydj1bGSHQUhxFxsXPCaL5Y4NvwG5KFqL7kNg';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupport();
    checkSubscription();

    // Listen for visibility changes to auto-refresh permission
    const handleVisibilityChange = () => {
      if (!document.hidden && isSupported) {
        recheckPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported]);

  const checkSupport = () => {
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext && !isLocalhost) {
      console.error('❌ Les notifications push nécessitent HTTPS');
      toast.error('Les notifications nécessitent une connexion sécurisée (HTTPS)');
      setIsSupported(false);
      return;
    }
    
    const supported = 'serviceWorker' in navigator && 
                      'PushManager' in window && 
                      'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      console.log('✅ Notifications supportées, permission actuelle:', Notification.permission);
    } else {
      console.error('❌ Notifications non supportées par ce navigateur');
    }
  };

  const waitForServiceWorkerActivation = async (registration: ServiceWorkerRegistration): Promise<void> => {
    // Si déjà activé, retourner immédiatement
    if (registration.active && registration.active.state === 'activated') {
      console.log('Service worker déjà activé');
      return;
    }

    console.log('En attente de l\'activation du service worker...');
    
    // Attendre que le service worker soit activé
    return new Promise((resolve) => {
      const checkActivation = () => {
        if (registration.active && registration.active.state === 'activated') {
          console.log('Service worker activé avec succès');
          // Délai supplémentaire pour garantir la stabilité
          setTimeout(() => resolve(), 500);
        } else if (registration.installing) {
          registration.installing.addEventListener('statechange', checkActivation);
        } else if (registration.waiting) {
          registration.waiting.addEventListener('statechange', checkActivation);
        } else {
          // Fallback : attendre un peu et réessayer
          setTimeout(checkActivation, 100);
        }
      };
      checkActivation();
    });
  };

  const requestPermissionWithFallback = async (): Promise<{
    permission: NotificationPermission;
    registration?: ServiceWorkerRegistration;
  }> => {
    console.log('🔔 État actuel de la permission:', Notification.permission);
    console.log('🌐 Protocole:', window.location.protocol);
    console.log('🌐 Hostname:', window.location.hostname);
    console.log('🔒 Secure Context:', window.isSecureContext);
    
    // Demander la permission
    const permission = await Notification.requestPermission();
    
    console.log('✅ Permission après demande:', permission);
    
    // Retourner la vraie permission, sans fallback trompeur
    return { permission, registration: undefined };
  };

  const recheckPermission = async () => {
    if (!isSupported) return;
    
    try {
      const { permission: currentPermission } = await requestPermissionWithFallback();
      setPermission(currentPermission);
      
      if (currentPermission === 'granted') {
        toast.success('Notifications autorisées !');
      } else if (currentPermission === 'denied') {
        toast.error('Notifications refusées. Veuillez les autoriser dans les paramètres de votre navigateur.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Erreur lors de la demande de permission');
    }
  };

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    try {
      if (!isSupported) {
        toast.error('Les notifications push ne sont pas supportées par votre navigateur');
        return false;
      }

      console.log('🔔 Début de l\'abonnement aux notifications push');

      // Request permission avec fallback pour Chrome
      const { permission: perm, registration: existingRegistration } = await requestPermissionWithFallback();
      setPermission(perm);

      if (perm !== 'granted') {
        if (perm === 'denied') {
          toast.error(
            'Notifications bloquées. Cliquez sur le cadenas 🔒 à gauche de l\'URL, puis autorisez les notifications.',
            { duration: 8000 }
          );
        } else if (perm === 'default') {
          toast.error(
            'Veuillez accepter la demande de notification dans la popup de votre navigateur.',
            { duration: 5000 }
          );
        } else {
          toast.error('Permission refusée pour les notifications');
        }
        return false;
      }

      // Utiliser le registration existant ou en créer un nouveau
      let registration: ServiceWorkerRegistration;
      if (existingRegistration) {
        registration = existingRegistration;
        console.log('✅ Réutilisation du service worker existant');
        // Attendre l'activation même pour les registrations existants
        await waitForServiceWorkerActivation(registration);
      } else {
        console.log('📝 Enregistrement d\'un nouveau service worker');
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        
        // Attendre l'activation complète
        await waitForServiceWorkerActivation(registration);
      }

      // Vérifier que pushManager est disponible
      if (!registration.pushManager) {
        throw new Error('PushManager non disponible sur ce service worker');
      }

      console.log('📱 Tentative d\'abonnement au pushManager...');

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('✅ Abonnement push réussi', subscription);

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const subscriptionData = JSON.parse(JSON.stringify(subscription));

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          device_type: 'web',
          user_agent: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

    setIsSubscribed(true);
      toast.success('Notifications push activées !');
      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push:', error);
      toast.error('Erreur lors de l\'activation des notifications push');
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      toast.success('Notifications push désactivées');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Erreur lors de la désactivation');
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    recheckPermission,
  };
};
