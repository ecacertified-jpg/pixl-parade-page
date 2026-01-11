import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// VAPID Public Key - must match the one configured in Supabase Edge Function secrets
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDJGn4Z6ydj1bGSHQUhxFxsXPCaL5Y4NvwG5KFqL7kNg';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
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

  // Détecter les changements de permission en temps réel
  useEffect(() => {
    if (!isSupported) return;
    
    const checkPermissionInterval = setInterval(() => {
      const currentPerm = Notification.permission;
      if (currentPerm !== permission) {
        console.log('🔄 Permission changée détectée:', permission, '→', currentPerm);
        setPermission(currentPerm);
        
        if (currentPerm === 'granted') {
          toast.success('Notifications autorisées ! Vous pouvez maintenant activer le toggle.');
        } else if (currentPerm === 'denied') {
          toast.error('Notifications bloquées dans le navigateur');
        }
      }
    }, 1000);
    
    return () => clearInterval(checkPermissionInterval);
  }, [isSupported, permission]);

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

  const diagnosePermissionState = async () => {
    console.log('🔍 DIAGNOSTIC COMPLET DE L\'ÉTAT DES PERMISSIONS');
    console.log('====================================================');
    console.log('📍 URL actuelle:', window.location.href);
    console.log('🔒 Protocole:', window.location.protocol);
    console.log('🌐 Hostname:', window.location.hostname);
    console.log('✅ Secure Context:', window.isSecureContext);
    console.log('🔔 Notification.permission:', Notification.permission);
    console.log('📱 Service Worker supporté:', 'serviceWorker' in navigator);
    console.log('🔊 PushManager supporté:', 'PushManager' in window);
    console.log('🔔 Notification API supportée:', 'Notification' in window);
    
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('📋 Service Workers enregistrés:', registrations.length);
      registrations.forEach((reg, index) => {
        console.log(`  SW ${index + 1}:`, reg.scope, 'État:', reg.active?.state);
      });
    }
    
    console.log('====================================================');
  };

  const resetServiceWorkers = async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🧹 Nettoyage de', registrations.length, 'service worker(s)');
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Service worker désenregistré:', registration.scope);
      }
      
      toast.success('Service workers réinitialisés. Veuillez rafraîchir la page.');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      toast.error('Erreur lors de la réinitialisation');
    }
  };

  const subscribe = async () => {
    try {
      if (!isSupported) {
        toast.error('Les notifications push ne sont pas supportées par votre navigateur');
        return false;
      }

      console.log('🔔 Demande de permission immédiate...');
      
      // IMPORTANT: Appeler requestPermission() IMMÉDIATEMENT au clic
      // Cela garantit que le popup natif du navigateur apparaît
      const perm = await Notification.requestPermission();
      
      console.log('✅ Permission après demande:', perm);
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

      // Permission accordée - maintenant on peut faire le diagnostic et le reste
      await diagnosePermissionState();
      console.log('🔔 Début de l\'abonnement aux notifications push');

      // Enregistrer un nouveau service worker
      console.log('📝 Enregistrement du service worker');
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      // Attendre l'activation complète
      await waitForServiceWorkerActivation(registration);
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

  const sendTestNotification = useCallback(async () => {
    if (!isSubscribed) {
      toast.error('Vous devez d\'abord activer les notifications');
      return false;
    }

    setIsTesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: [user.id],
          title: '🎉 Test réussi !',
          message: 'Vos notifications push fonctionnent parfaitement.',
          type: 'celebration',
          playSound: true,
          isUrgent: false
        }
      });

      if (error) throw error;

      if (data?.sent > 0) {
        toast.success('Notification de test envoyée !');
        return true;
      } else {
        toast.error('Aucune souscription active trouvée');
        return false;
      }
    } catch (error) {
      console.error('❌ Test notification error:', error);
      toast.error('Erreur lors de l\'envoi du test');
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [isSubscribed]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    isTesting,
    subscribe,
    unsubscribe,
    recheckPermission,
    resetServiceWorkers,
    sendTestNotification,
  };
};
