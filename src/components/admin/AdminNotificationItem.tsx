import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  User, 
  Store, 
  ShoppingBag, 
  RefreshCw, 
  X, 
  Check,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { AdminNotification } from '@/hooks/useAdminNotifications';

interface AdminNotificationItemProps {
  notification: AdminNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  compact?: boolean;
}

const typeConfig: Record<string, { icon: any; bgColor: string; textColor: string }> = {
  new_client: {
    icon: User,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  new_business: {
    icon: Store,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  new_order: {
    icon: ShoppingBag,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
  },
  refund_request: {
    icon: RefreshCw,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
  },
};

const severityConfig: Record<string, { icon: any; color: string }> = {
  critical: { icon: AlertCircle, color: 'text-destructive' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  info: { icon: Info, color: 'text-blue-500' },
};

export const AdminNotificationItem = ({
  notification,
  onMarkAsRead,
  onDismiss,
  compact = false,
}: AdminNotificationItemProps) => {
  const navigate = useNavigate();
  
  const config = typeConfig[notification.type] || {
    icon: Info,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  };
  
  const Icon = config.icon;
  const SeverityIcon = severityConfig[notification.severity]?.icon;

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: false,
    locale: fr,
  });

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent',
          !notification.is_read && 'bg-primary/5'
        )}
        onClick={handleClick}
      >
        <div className={cn('p-2 rounded-full', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.textColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium text-sm truncate',
              !notification.is_read && 'text-foreground'
            )}>
              {notification.title}
            </span>
            {notification.severity === 'critical' && (
              <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {notification.message}
          </p>
          <span className="text-xs text-muted-foreground mt-1 block">
            {timeAgo}
          </span>
        </div>

        {!notification.is_read && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg border transition-colors',
        !notification.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
      )}
    >
      <div className={cn('p-3 rounded-full', config.bgColor)}>
        <Icon className={cn('h-5 w-5', config.textColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{notification.title}</span>
          {SeverityIcon && (
            <SeverityIcon className={cn('h-4 w-4', severityConfig[notification.severity].color)} />
          )}
          {!notification.is_read && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Nouveau
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {notification.metadata?.business_name && (
            <span className="flex items-center gap-1">
              <Store className="h-3 w-3" />
              {notification.metadata.business_name}
            </span>
          )}
          {notification.metadata?.total_amount && (
            <span className="font-medium">
              {notification.metadata.total_amount.toLocaleString('fr-FR')} {notification.metadata.currency || 'XOF'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {notification.action_url && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClick}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        {!notification.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
