import { AlertTriangle, TrendingDown, Clock, Star, BarChart3, Eye, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBusinessPerformanceAlerts, BusinessPerformanceAlert } from '@/hooks/useBusinessPerformanceAlerts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const alertIcons: Record<string, typeof TrendingDown> = {
  revenue_drop: TrendingDown,
  orders_drop: BarChart3,
  inactivity: Clock,
  rating_drop: Star,
  conversion_drop: TrendingDown,
};

const severityStyles = {
  critical: {
    container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
  },
};

export function BusinessPerformanceAlertsBanner() {
  const { 
    alerts, 
    loading, 
    unreadCount, 
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    resolveAlert,
  } = useBusinessPerformanceAlerts();

  if (loading || alerts.length === 0) {
    return null;
  }

  const displayAlerts = alerts.slice(0, 3);
  const remainingCount = alerts.length - 3;

  return (
    <div className="space-y-3 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Alertes de performance</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge variant="destructive">
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        {displayAlerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onMarkAsRead={() => markAsRead(alert.id)}
            onDismiss={() => dismissAlert(alert.id)}
            onResolve={() => resolveAlert(alert.id)}
          />
        ))}
      </div>

      {remainingCount > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          + {remainingCount} autre{remainingCount > 1 ? 's' : ''} alerte{remainingCount > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function AlertItem({ 
  alert, 
  onMarkAsRead, 
  onDismiss, 
  onResolve 
}: { 
  alert: BusinessPerformanceAlert;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  onResolve: () => void;
}) {
  const Icon = alertIcons[alert.alert_type] || TrendingDown;
  const styles = severityStyles[alert.severity];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles.container} ${!alert.is_read ? 'ring-2 ring-primary/20' : ''}`}>
      <div className={`p-2 rounded-full bg-background/50 ${styles.icon}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={styles.badge} variant="secondary">
            {alert.severity === 'critical' ? 'Critique' : 'Attention'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {alert.message}
        </p>
        {alert.change_percentage !== null && alert.change_percentage > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Variation: -{alert.change_percentage.toFixed(1)}%
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {!alert.is_read && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMarkAsRead} title="Marquer comme lu">
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={onResolve} title="Résoudre">
          <CheckCircle className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onDismiss} title="Ignorer">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
