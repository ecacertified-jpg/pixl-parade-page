import { useState } from 'react';
import { Bell, X, CheckCheck, ExternalLink, TrendingUp, TrendingDown, Target, Flame, AlertTriangle, Store, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAllAlerts, UnifiedAlert } from '@/hooks/useAllAlerts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const alertIcons: Record<string, React.ReactNode> = {
  milestone: <Target className="h-4 w-4" />,
  growth_spike: <TrendingUp className="h-4 w-4" />,
  daily_record: <Flame className="h-4 w-4" />,
  decline: <TrendingDown className="h-4 w-4" />,
  revenue_drop: <TrendingDown className="h-4 w-4" />,
  inactivity: <AlertTriangle className="h-4 w-4" />,
  rating_drop: <AlertTriangle className="h-4 w-4" />,
};

const severityColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
};

const alertTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  milestone: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600', border: 'border-green-200' },
  growth_spike: { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600', border: 'border-purple-200' },
  daily_record: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600', border: 'border-orange-200' },
  decline: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600', border: 'border-red-200' },
  revenue_drop: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600', border: 'border-red-200' },
  inactivity: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600', border: 'border-amber-200' },
  rating_drop: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600', border: 'border-amber-200' },
};

function AlertItem({ alert, onMarkRead, onDismiss }: {
  alert: UnifiedAlert;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const colors = alertTypeColors[alert.alert_type] || alertTypeColors.milestone;
  const icon = alertIcons[alert.alert_type] || <Bell className="h-4 w-4" />;
  const isEscalated = alert.escalation_count > 0;

  return (
    <div className={cn(
      'p-3 border rounded-lg transition-colors',
      isEscalated ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300' : colors.bg,
      !isEscalated && colors.border,
      !alert.is_read && 'ring-2 ring-primary/20'
    )}>
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5', isEscalated ? 'text-orange-600' : colors.text)}>
          {alert.type === 'business' ? <Store className="h-4 w-4" /> : icon}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium leading-snug', isEscalated ? 'text-orange-700 dark:text-orange-400' : colors.text)}>
              {alert.message}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {isEscalated && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="gap-1 text-[10px] border-orange-400 text-orange-600 bg-orange-100 dark:bg-orange-900/50">
                        <ArrowUpCircle className="h-3 w-3" />
                        {alert.escalation_count}x
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Escaladée {alert.escalation_count} fois</p>
                      {alert.original_severity && (
                        <p className="text-xs text-muted-foreground">
                          Sévérité initiale : {alert.original_severity}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Badge className={cn('text-[10px]', severityColors[alert.severity])}>
                {alert.severity}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true, locale: fr })}
            </span>
            {alert.business_name && (
              <>
                <span>•</span>
                <span className="truncate">{alert.business_name}</span>
              </>
            )}
            {alert.growth_percentage !== null && (
              <>
                <span>•</span>
                <span className={alert.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {alert.growth_percentage >= 0 ? '+' : ''}{alert.growth_percentage}%
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!alert.is_read && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMarkRead}>
              <CheckCheck className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AlertsCenter() {
  const [open, setOpen] = useState(false);
  const { alerts, loading, unreadCount, criticalCount, escalatedCount, markAsRead, dismissAlert } = useAllAlerts();

  const recentAlerts = alerts.filter(a => !a.is_dismissed).slice(0, 10);
  const hasUrgent = criticalCount > 0 || escalatedCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            hasUrgent && "text-destructive animate-pulse"
          )} />
          {unreadCount > 0 && (
            <Badge 
              className={cn(
                "absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]",
                hasUrgent ? "bg-destructive" : "bg-primary"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Alertes KPI</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} non lue(s)
              {criticalCount > 0 && <span className="text-destructive"> • {criticalCount} critique(s)</span>}
              {escalatedCount > 0 && <span className="text-orange-600"> • {escalatedCount} escaladée(s)</span>}
            </p>
          </div>
          <Link to="/admin/alerts" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="text-xs">
              Voir tout
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune alerte</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {recentAlerts.map(alert => (
                <AlertItem
                  key={`${alert.type}-${alert.id}`}
                  alert={alert}
                  onMarkRead={() => markAsRead(alert.id, alert.type)}
                  onDismiss={() => dismissAlert(alert.id, alert.type)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
