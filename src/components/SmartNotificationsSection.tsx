import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SmartNotificationCard } from "./SmartNotificationCard";
import { NotificationCard } from "./NotificationCard";
import { BirthdayNotificationCard } from "./BirthdayNotificationCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const SmartNotificationsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSmartNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.id)
        .not('smart_notification_category', 'is', null)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error loading smart notifications:", error);
      toast.error("Erreur lors du chargement des suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartNotifications();

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel('smart-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scheduled_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new.smart_notification_category) {
            setNotifications(prev => [payload.new, ...prev].slice(0, 5));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-6 border-dashed">
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg mb-2">Aucune suggestion pour le moment</h3>
          <p className="text-sm text-muted-foreground mb-4">
            L'IA analyse vos interactions et vous suggérera des actions personnalisées
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSmartNotifications}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h2 className="text-xl font-bold">Suggestions Intelligentes</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadSmartNotifications}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {notifications.map((notification) => {
          // 🎂 Birthday notifications get special treatment - always first
          if (notification.notification_type === 'birthday_wish_ai') {
            return (
              <BirthdayNotificationCard
                key={notification.id}
                notification={{
                  id: notification.id,
                  title: notification.title,
                  message: notification.message,
                  metadata: notification.metadata as any
                }}
                onAction={() => handleMarkAsRead(notification.id)}
                onOpenChat={() => {
                  // Trigger AI chat opening with custom event
                  const event = new CustomEvent('openAIChat');
                  window.dispatchEvent(event);
                  handleMarkAsRead(notification.id);
                }}
              />
            );
          }

          // Use enhanced NotificationCard for reciprocity notifications
          if (notification.notification_type === 'reciprocity_reminder') {
            return (
              <NotificationCard
                key={notification.id}
                type="reciprocity"
                title={notification.title}
                subtitle={notification.message}
                contributionAmount={notification.metadata?.past_contribution_amount}
                currency="XOF"
                onAction={() => {
                  if (notification.metadata?.fund_id) {
                    navigate(`/gifts?fund=${notification.metadata.fund_id}`);
                  }
                  handleMarkAsRead(notification.id);
                }}
              />
            );
          }
          
          // Use SmartNotificationCard for other smart notifications
          return (
            <SmartNotificationCard
              key={notification.id}
              notification={notification}
              onAction={() => handleMarkAsRead(notification.id)}
            />
          );
        })}
      </div>
    </div>
  );
};
