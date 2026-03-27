import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SmartNotificationCard } from "./SmartNotificationCard";
import { NotificationCard } from "./NotificationCard";
import { BirthdayNotificationCard } from "./BirthdayNotificationCard";
import { BadgeEarnedNotificationCard } from "./BadgeEarnedNotificationCard";
import { BirthdayCountdownCard } from "./BirthdayCountdownCard";
import { BirthdayCelebrationModal } from "./BirthdayCelebrationModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const SmartNotificationsSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebrationNotification, setCelebrationNotification] = useState<any>(null);

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

      const notifs = data || [];
      setNotifications(notifs);

      // Auto-open celebration modal for birthday_wish_ai
      const birthdayWish = notifs.find(n => n.notification_type === 'birthday_wish_ai');
      if (birthdayWish) {
        setCelebrationNotification(birthdayWish);
      }
    } catch (error: any) {
      console.error("Error loading smart notifications:", error);
      toast.error("Erreur lors du chargement des suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartNotifications();

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
          // Auto-open celebration for new birthday_wish_ai
          if (payload.new.notification_type === 'birthday_wish_ai') {
            setCelebrationNotification(payload.new);
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
          <Button variant="outline" size="sm" onClick={loadSmartNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Birthday Celebration Modal */}
      {celebrationNotification && (
        <BirthdayCelebrationModal
          open={!!celebrationNotification}
          onClose={() => {
            setCelebrationNotification(null);
            handleMarkAsRead(celebrationNotification.id);
          }}
          notification={celebrationNotification}
        />
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-xl font-bold">Suggestions Intelligentes</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSmartNotifications}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          {notifications.map((notification) => {
            // 🎂 Birthday countdown
            if (notification.notification_type === 'birthday_countdown') {
              return (
                <BirthdayCountdownCard
                  key={notification.id}
                  notification={{
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    metadata: notification.metadata as any
                  }}
                  onDismiss={() => handleMarkAsRead(notification.id)}
                  onAction={() => {
                    navigate('/wishlist');
                    handleMarkAsRead(notification.id);
                  }}
                />
              );
            }

            // 🎂 Birthday D-Day — open celebration modal
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
                  onAction={() => setCelebrationNotification(notification)}
                  onOpenChat={() => {
                    const event = new CustomEvent('openAIChat');
                    window.dispatchEvent(event);
                    handleMarkAsRead(notification.id);
                  }}
                />
              );
            }

            // 🏆 Badge earned
            if (notification.notification_type === 'badge_earned') {
              const metadata = notification.metadata as any;
              return (
                <BadgeEarnedNotificationCard
                  key={notification.id}
                  newScore={metadata?.new_score || 0}
                  oldScore={metadata?.old_score || 0}
                  onDismiss={() => handleMarkAsRead(notification.id)}
                />
              );
            }

            // Reciprocity
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
    </>
  );
};
