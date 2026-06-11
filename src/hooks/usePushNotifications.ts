import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initOneSignal, loginOneSignal, logoutOneSignal, OneSignal } from '@/lib/onesignal';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const refreshState = useCallback(async () => {
    try {
      const ok = await initOneSignal();
      if (!ok) {
        setIsSupported(false);
        setLoading(false);
        return;
      }
      const supported = OneSignal.Notifications.isPushSupported();
      setIsSupported(supported);
      setPermission(OneSignal.Notifications.permission ? 'granted' : (typeof Notification !== 'undefined' ? Notification.permission : 'default'));
      setIsSubscribed(!!OneSignal.User.PushSubscription.id && OneSignal.User.PushSubscription.optedIn !== false);
    } catch (e) {
      console.error('[push] refreshState error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();

    let unsubFns: Array<() => void> = [];
    initOneSignal().then((ok) => {
      if (!ok) return;
      const onPerm = (granted: boolean) => {
        setPermission(granted ? 'granted' : 'denied');
        refreshState();
      };
      const onSub = () => refreshState();
      OneSignal.Notifications.addEventListener('permissionChange', onPerm);
      OneSignal.User.PushSubscription.addEventListener('change', onSub);
      unsubFns.push(() => OneSignal.Notifications.removeEventListener('permissionChange', onPerm));
      unsubFns.push(() => OneSignal.User.PushSubscription.removeEventListener('change', onSub));
    });
    return () => { unsubFns.forEach((f) => f()); };
  }, [refreshState]);

  const subscribe = async () => {
    try {
      const ok = await initOneSignal();
      if (!ok) {
        toast.error('Notifications non disponibles dans cet environnement');
        return false;
      }

      await OneSignal.Notifications.requestPermission();
      const perm = OneSignal.Notifications.permission;
      setPermission(perm ? 'granted' : 'denied');
      if (!perm) {
        toast.error('Permission refusée pour les notifications', { duration: 6000 });
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const playerId = await loginOneSignal(user.id);
      if (!playerId) {
        toast.error("Impossible d'enregistrer l'abonnement");
        return false;
      }
      setIsSubscribed(true);
      toast.success('Notifications activées !', {
        description: 'Envoyez une notification de test depuis Paramètres → Notifications.',
        action: {
          label: 'Tester',
          onClick: () => { window.location.href = '/notification-settings'; },
        },
        duration: 8000,
      });
      return true;
    } catch (error) {
      console.error('❌ subscribe error:', error);
      toast.error("Erreur lors de l'activation des notifications");
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      await OneSignal.User.PushSubscription.optOut();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ onesignal_player_id: null }).eq('user_id', user.id);
      }
      await logoutOneSignal();
      setIsSubscribed(false);
      toast.success('Notifications désactivées');
      return true;
    } catch (error) {
      console.error('unsubscribe error:', error);
      toast.error('Erreur lors de la désactivation');
      return false;
    }
  };

  const recheckPermission = async () => { await refreshState(); };
  const resetServiceWorkers = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      toast.success('Service workers réinitialisés. Rechargement...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la réinitialisation');
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
