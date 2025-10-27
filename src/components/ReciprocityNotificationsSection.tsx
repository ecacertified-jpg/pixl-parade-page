import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCard } from "./NotificationCard";
import type { Database } from "@/integrations/supabase/types";

type ScheduledNotification = Database['public']['Tables']['scheduled_notifications']['Row'];

export const ReciprocityNotificationsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReciprocityNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('notification_type', 'reciprocity_reminder')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error loading reciprocity notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReciprocityNotifications();

    // Real-time updates
    const channel = supabase
      .channel('reciprocity-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scheduled_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          const newNotif = payload.new as ScheduledNotification;
          if (newNotif.notification_type === 'reciprocity_reminder') {
            setNotifications(prev => [newNotif, ...prev].slice(0, 3));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAction = async (notificationId: string, metadata: any) => {
    // Mark as read by deleting
    try {
      await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Navigate to fund
      const fundId = metadata && typeof metadata === 'object' && 'fund_id' in metadata 
        ? metadata.fund_id 
        : undefined;
      
      if (fundId) {
        navigate(`/gifts?fund=${fundId}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary fill-current" />
        <h2 className="text-lg font-semibold">Notifications de Réciprocité</h2>
      </div>
      
      {notifications.map((notification) => {
        const metadata = notification.metadata as any;
        const contributionAmount = metadata?.past_contribution_amount;
        
        return (
          <NotificationCard
            key={notification.id}
            type="reciprocity"
            title={notification.title}
            subtitle={notification.message}
            contributionAmount={contributionAmount}
            currency="XOF"
            onAction={() => handleAction(notification.id, metadata)}
          />
        );
      })}
    </div>
  );
};
