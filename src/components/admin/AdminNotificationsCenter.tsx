import { Bell, CheckCheck, Archive, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { AdminNotificationItem } from './AdminNotificationItem';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export const AdminNotificationsCenter = () => {
  const {
    notifications,
    loading,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useAdminNotifications();
  
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className={cn(
            "h-5 w-5",
            criticalCount > 0 && "text-destructive"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center",
              criticalCount > 0 
                ? "bg-destructive text-destructive-foreground animate-pulse" 
                : "bg-primary text-primary-foreground"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Notifications Admin</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0 ? (
                  <>
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    {criticalCount > 0 && (
                      <span className="text-destructive ml-1">
                        • {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </>
                ) : (
                  'Aucune notification non lue'
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Tout lire
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Chargement...
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Vous serez alerté des nouveaux événements ici
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <AdminNotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDismiss={dismissNotification}
                  compact
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Link 
                to="/admin/admin-notifications" 
                onClick={() => setOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-center text-sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir toutes les notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
