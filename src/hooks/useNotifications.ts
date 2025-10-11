import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
  notification_type?: string;
  scheduled_for?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  console.log('[useNotifications] Hook initialized, user:', user?.id);

  const loadNotifications = async () => {
    if (!user) {
      console.log('[useNotifications] No user, skipping load');
      return;
    }

    console.log('[useNotifications] Loading notifications for user:', user.id);
    try {
      setLoading(true);

      // Charger les notifications normales
      const { data: regularNotifs, error: regularError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (regularError) throw regularError;

      // Charger les notifications programmées qui sont déjà passées
      const { data: scheduledNotifs, error: scheduledError } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.id)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: false })
        .limit(20);

      if (scheduledError) throw scheduledError;

      // Combiner et trier
      const allNotifs: Notification[] = [
        ...(regularNotifs || []).map(n => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          is_read: n.is_read ?? false,
          created_at: n.created_at,
          metadata: (n as any).metadata
        })),
        ...(scheduledNotifs || []).map(n => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.notification_type || 'info',
          is_read: false, // scheduled_notifications n'ont pas de is_read, donc false par défaut
          created_at: n.scheduled_for || n.created_at,
          metadata: n.metadata,
          notification_type: n.notification_type,
          scheduled_for: n.scheduled_for
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifs);
      const unread = allNotifs.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      console.log('[useNotifications] Loaded', allNotifs.length, 'notifications,', unread, 'unread');
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification?.notification_type) {
        // C'est une scheduled_notification - on la supprime au lieu de la marquer comme lue
        await supabase
          .from('scheduled_notifications')
          .delete()
          .eq('id', notificationId);
      } else {
        // C'est une notification normale
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Marquer toutes les notifications normales
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Supprimer toutes les scheduled_notifications non lues
      await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('user_id', user.id)
        .lte('scheduled_for', new Date().toISOString());

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Toutes les notifications marquées comme lues");
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification?.notification_type) {
        await supabase
          .from('scheduled_notifications')
          .delete()
          .eq('id', notificationId);
      } else {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notification?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    console.log('[useNotifications] useEffect triggered, user:', user?.id);
    loadNotifications();

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            if (!(payload.new as Notification).is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scheduled_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const newNotif = {
            ...payload.new,
            type: payload.new.notification_type || 'info',
            created_at: payload.new.scheduled_for || payload.new.created_at
          } as Notification;
          
          // Ajouter seulement si la date est déjà passée
          if (new Date(newNotif.created_at) <= new Date()) {
            setNotifications(prev => [newNotif, ...prev]);
            if (!newNotif.is_read) {
              setUnreadCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications
  };
};
