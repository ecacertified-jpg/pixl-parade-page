import { Bell, Check, CheckCheck, Trash2, Gift, Users, Calendar, Sparkles, AlertCircle, Archive, Settings, Heart, UserPlus, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications, type Notification, type NotificationFilter } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { NotificationFilters } from "./NotificationFilters";
import { useState, useMemo } from "react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_post':
      return <FileText className="h-4 w-4 text-purple-500" />;
    case 'new_follower':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'new_comment':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'reciprocity_reminder':
      return <Heart className="h-4 w-4 text-primary fill-current" />;
    case 'gift':
    case 'gift_received':
    case 'gift_promise':
      return <Gift className="h-4 w-4 text-primary" />;
    case 'fund_contribution':
    case 'fund_target_reached':
    case 'collective_fund':
      return <Users className="h-4 w-4 text-accent" />;
    case 'birthday_reminder':
    case 'event_reminder':
      return <Calendar className="h-4 w-4 text-secondary" />;
    case 'smart_suggestion':
    case 'ai_recommendation':
      return <Sparkles className="h-4 w-4 text-primary animate-pulse" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getNotificationAction = (notification: Notification, navigate: any) => {
  const metadata = notification.metadata || {};
  
  // Handle new_post notification
  if (notification.type === 'new_post' && metadata.post_id) {
    return () => navigate(`/community?post=${metadata.post_id}`);
  }
  
  // Handle new_comment notification
  if (notification.type === 'new_comment' && metadata.post_id) {
    return () => navigate(`/community?post=${metadata.post_id}`);
  }
  
  // Handle new_follower notification
  if (notification.type === 'new_follower' && metadata.follower_id) {
    return () => navigate(`/profile/${metadata.follower_id}`);
  }
  
  if (metadata.fund_id) {
    return () => navigate(`/gifts?fund=${metadata.fund_id}`);
  }
  if (metadata.post_id) {
    return () => navigate(`/community?post=${metadata.post_id}`);
  }
  if (metadata.contact_id) {
    return () => navigate(`/dashboard`);
  }
  
  // Check action_url in metadata
  if (metadata.action_url) {
    return () => navigate(metadata.action_url);
  }
  
  // Type-based navigation
  if (notification.type?.includes('fund') || notification.type?.includes('collective')) {
    return () => navigate('/gifts');
  }
  if (notification.type?.includes('gift')) {
    return () => navigate('/gifts');
  }
  if (notification.type?.includes('birthday') || notification.type?.includes('event')) {
    return () => navigate('/dashboard');
  }
  
  return undefined;
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: () => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onArchive, onDelete, onNavigate }: NotificationItemProps) => {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    onNavigate();
  };

  return (
    <div
      className={cn(
        "group relative p-3 hover:bg-accent/5 transition-colors cursor-pointer border-l-2",
        notification.is_read ? "border-transparent" : "border-primary bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h4 className={cn(
                "text-sm leading-tight",
                notification.is_read ? "text-muted-foreground" : "font-semibold text-foreground"
              )}>
                {notification.title}
              </h4>
              {notification.type === 'reciprocity_reminder' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  Réciprocité
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true,
                locale: fr 
              })}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(notification.id);
            }}
          >
            <Archive className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const NotificationPanel = () => {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [showArchived, setShowArchived] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, archiveNotification, archiveAllRead, deleteNotification } = useNotifications(showArchived, activeFilter);
  const navigate = useNavigate();

  // Calculer les compteurs par filtre
  const filterCounts = useMemo(() => {
    const allNotifs = notifications;
    return {
      all: allNotifs.length,
      social: allNotifs.filter(n => {
        const type = n.type.toLowerCase();
        return type.includes('follower') || type.includes('follow') || type.includes('contact') || type.includes('post') || type.includes('comment');
      }).length,
      gift: allNotifs.filter(n => {
        const type = n.type.toLowerCase();
        return type.includes('gift') || type.includes('promise');
      }).length,
      fund: allNotifs.filter(n => {
        const type = n.type.toLowerCase();
        return type.includes('fund') || type.includes('contribution') || type.includes('collective');
      }).length,
      birthday: allNotifs.filter(n => n.type.toLowerCase().includes('birthday')).length,
      event: allNotifs.filter(n => {
        const type = n.type.toLowerCase();
        return type.includes('event') || type.includes('reminder');
      }).length,
      ai: allNotifs.filter(n => {
        const type = n.type.toLowerCase();
        return type.includes('smart') || type.includes('ai') || type.includes('recommendation');
      }).length,
    };
  }, [notifications]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-3">
          <div>
            <h3 className="font-semibold text-base">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
              </p>
            )}
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/notification-settings')}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Tout marquer
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        <Separator />

        <div className="flex items-center justify-between px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="h-7 text-xs"
          >
            <Archive className="h-3 w-3 mr-1" />
            {showArchived ? 'Masquer archivées' : 'Voir archivées'}
          </Button>
          {!showArchived && notifications.some(n => n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={archiveAllRead}
              className="h-7 text-xs"
            >
              Archiver toutes lues
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Aucune notification</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vous êtes à jour !
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onArchive={archiveNotification}
                  onDelete={deleteNotification}
                  onNavigate={() => {
                    const action = getNotificationAction(notification, navigate);
                    if (action) action();
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
