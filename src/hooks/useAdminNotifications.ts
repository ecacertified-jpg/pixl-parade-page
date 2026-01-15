import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export interface AdminNotification {
  id: string;
  admin_user_id: string | null;
  type: 'new_client' | 'new_business' | 'new_order' | 'refund_request' | string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  is_dismissed: boolean;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  country_code: string | null;
  created_at: string;
}

export interface UseAdminNotificationsOptions {
  monitoredCountries?: string[] | null;
}

export const useAdminNotifications = (options?: UseAdminNotificationsOptions) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  
  const monitoredCountries = options?.monitoredCountries;

  const fetchNotifications = useCallback(async () => {
    if (!user || !isAdmin) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(100);

      // Filter by monitored countries if specified
      if (monitoredCountries && monitoredCountries.length > 0) {
        // Include notifications from monitored countries OR notifications without country_code (global)
        query = query.or(`country_code.in.(${monitoredCountries.join(',')}),country_code.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications((data || []) as AdminNotification[]);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, monitoredCountries]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user || !isAdmin) return;

    fetchNotifications();

    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const newNotification = payload.new as AdminNotification;
          setNotifications((prev) => [newNotification, ...prev]);
          
          // Show toast for new notifications
          const toastType = newNotification.severity === 'critical' ? 'error' : 
                          newNotification.severity === 'warning' ? 'warning' : 'info';
          
          if (toastType === 'error') {
            toast.error(newNotification.title, { description: newNotification.message });
          } else if (toastType === 'warning') {
            toast.warning(newNotification.title, { description: newNotification.message });
          } else {
            toast.info(newNotification.title, { description: newNotification.message });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const updatedNotification = payload.new as AdminNotification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
              .filter((n) => !n.is_dismissed)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_dismissed: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const dismissAll = async () => {
    try {
      const ids = notifications.map((n) => n.id);
      if (ids.length === 0) return;

      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_dismissed: true })
        .in('id', ids);

      if (error) throw error;
      
      setNotifications([]);
      toast.success('Toutes les notifications archivées');
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
      toast.error('Erreur lors de l\'archivage');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const criticalCount = notifications.filter((n) => n.severity === 'critical' && !n.is_read).length;

  const getNotificationsByType = (type: string) => 
    notifications.filter((n) => n.type === type);

  const getNotificationsByCountry = (countryCode: string | null) => {
    if (!countryCode) return notifications;
    return notifications.filter((n) => n.country_code === countryCode);
  };

  // Stats by country
  const countryStats = notifications.reduce((acc, n) => {
    const code = n.country_code || 'global';
    if (!acc[code]) {
      acc[code] = { total: 0, unread: 0 };
    }
    acc[code].total++;
    if (!n.is_read) acc[code].unread++;
    return acc;
  }, {} as Record<string, { total: number; unread: number }>);

  return {
    notifications,
    loading,
    unreadCount,
    criticalCount,
    countryStats,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    refreshNotifications: fetchNotifications,
    getNotificationsByType,
    getNotificationsByCountry,
  };
};
