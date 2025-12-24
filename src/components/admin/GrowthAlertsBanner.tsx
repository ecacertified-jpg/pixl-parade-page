import { useGrowthAlerts, GrowthAlert } from '@/hooks/useGrowthAlerts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, Target, Flame, Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const alertIcons: Record<string, React.ReactNode> = {
  milestone: <Target className="h-4 w-4" />,
  growth_spike: <TrendingUp className="h-4 w-4" />,
  daily_record: <Flame className="h-4 w-4" />,
};

const alertColors: Record<string, { border: string; bg: string; text: string }> = {
  milestone: {
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600',
  },
  growth_spike: {
    border: 'border-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600',
  },
  daily_record: {
    border: 'border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600',
  },
};

export function GrowthAlertsBanner() {
  const { alerts, loading, unreadCount, markAsRead, markAllAsRead, dismissAlert } = useGrowthAlerts();

  if (loading || alerts.length === 0) {
    return null;
  }

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const displayAlerts = unreadAlerts.slice(0, 3);

  if (displayAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header with mark all as read */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>{unreadCount} alerte(s) de croissance</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Tout marquer lu
          </Button>
        </div>
      )}

      {/* Alerts */}
      {displayAlerts.map((alert) => {
        const colors = alertColors[alert.alert_type] || alertColors.milestone;
        
        return (
          <Alert
            key={alert.id}
            className={`${colors.border} ${colors.bg} relative`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className={colors.text}>
                  {alertIcons[alert.alert_type] || <Bell className="h-4 w-4" />}
                </span>
                <div>
                  <AlertTitle className={`${colors.text} text-sm font-medium`}>
                    {alert.message}
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(alert.triggered_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                    {alert.growth_percentage && (
                      <span className="ml-2">
                        • Croissance: +{alert.growth_percentage}%
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!alert.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => markAsRead(alert.id)}
                  >
                    <CheckCheck className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Alert>
        );
      })}

      {/* Show more indicator */}
      {unreadAlerts.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          +{unreadAlerts.length - 3} autre(s) alerte(s)
        </p>
      )}
    </div>
  );
}
