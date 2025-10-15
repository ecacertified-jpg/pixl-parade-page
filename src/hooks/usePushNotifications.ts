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

    // Re-check permission when user returns to the tab (in case they changed browser settings)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recheckPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkSupport = async () => {
    const hasBasicSupport = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    
    if (!hasBasicSupport) {
      console.log('[Push] Browser does not support push notifications');
      setIsSupported(false);
      return;
    }

    try {
      // Wait for service worker to be ready
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker is ready');
      setIsSupported(true);
      setPermission(Notification.permission);
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      setIsSupported(false);
    }
  };

  const recheckPermission = async () => {
    console.log('[Push] Rechecking permission...');
    const newPermission = Notification.permission;
    setPermission(newPermission);
    
    if (newPermission === 'granted') {
      // If permission was granted, check if we need to subscribe
      await checkSubscription();
      toast.success('Notifications autorisées ! Vous pouvez maintenant les activer.');
    }
    
    return newPermission;
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

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('Permission refusée pour les notifications');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

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
      console.error('Error subscribing to push:', error);
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
