import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useObjectiveAlerts, ObjectiveAlert } from '@/hooks/useObjectiveAlerts';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Target, 
  ChevronRight, 
  X, 
  CheckCheck,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const COUNTRY_FLAGS: Record<string, string> = {
  CI: '🇨🇮',
  SN: '🇸🇳',
  BJ: '🇧🇯',
  ML: '🇲🇱',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

const COUNTRY_NAMES: Record<string, string> = {
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BJ: "Bénin",
  ML: "Mali",
  BF: "Burkina Faso",
  TG: "Togo",
};

const METRIC_LABELS: Record<string, string> = {
  users: "Utilisateurs",
  businesses: "Entreprises",
  revenue: "Revenus",
  orders: "Commandes",
};

interface ObjectiveAlertsBannerProps {
  className?: string;
  maxAlerts?: number;
  showDismissed?: boolean;
}

function AlertItem({ 
  alert, 
  onMarkRead, 
  onDismiss 
}: { 
  alert: ObjectiveAlert; 
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        alert.severity === 'critical' 
          ? "bg-destructive/5 border-destructive/20" 
          : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
        !alert.is_read && "ring-1 ring-offset-1",
        alert.severity === 'critical' && !alert.is_read && "ring-destructive/50",
        alert.severity === 'warning' && !alert.is_read && "ring-amber-400/50"
      )}
    >
      <div className={cn(
        "p-2 rounded-full",
        alert.severity === 'critical' ? "bg-destructive/10" : "bg-amber-100 dark:bg-amber-900/50"
      )}>
        {alert.severity === 'critical' ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{COUNTRY_FLAGS[alert.country_code]}</span>
          <span className="font-medium text-sm">
            {COUNTRY_NAMES[alert.country_code]}
          </span>
          <Badge 
            variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
            className={cn(
              "text-xs",
              alert.severity === 'warning' && "border-amber-400 text-amber-700 dark:text-amber-400"
            )}
          >
            {alert.severity === 'critical' ? 'Critique' : 'Attention'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          <span className="font-medium text-foreground">
            {METRIC_LABELS[alert.metric_type]}
          </span>
          {' '}à {alert.achievement_rate.toFixed(0)}% de l'objectif
        </p>

        <div className="flex items-center gap-2 mb-2">
          <Progress 
            value={Math.min(alert.achievement_rate, 100)} 
            className={cn(
              "h-2 flex-1",
              alert.severity === 'critical' && "[&>div]:bg-destructive",
              alert.severity === 'warning' && "[&>div]:bg-amber-500"
            )}
          />
          <span className="text-xs font-medium w-16 text-right">
            {alert.actual_value.toLocaleString('fr-FR')} / {alert.target_value.toLocaleString('fr-FR')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true, locale: fr })}
          </span>
          
          <div className="flex items-center gap-1">
            {!alert.is_read && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Marquer lu
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2"
              onClick={() => navigate(`/admin/objectives?country=${alert.country_code}`)}
            >
              Voir
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ObjectiveAlertsBanner({ 
  className, 
  maxAlerts = 5,
}: ObjectiveAlertsBannerProps) {
  const navigate = useNavigate();
  const { 
    alerts, 
    loading, 
    unreadCount, 
    criticalCount, 
    alertsByCountry,
    markAsRead, 
    markAllAsRead,
    dismissAlert,
    dismissAll,
  } = useObjectiveAlerts();
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading || alerts.length === 0) {
    return null;
  }

  const displayedAlerts = alerts.slice(0, maxAlerts);
  const hasMore = alerts.length > maxAlerts;

  return (
    <Card className={cn(
      "border-l-4",
      criticalCount > 0 ? "border-l-destructive" : "border-l-amber-500",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Alertes Objectifs
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} non lu{unreadCount > 1 ? 'es' : 'e'}
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="h-8"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout lire
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8"
            >
              {isCollapsed ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Summary by country */}
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(alertsByCountry).map(([code, countryAlerts]) => {
            const hasCritical = countryAlerts.some(a => a.severity === 'critical');
            return (
              <Badge 
                key={code}
                variant="outline"
                className={cn(
                  "cursor-pointer hover:bg-accent",
                  hasCritical && "border-destructive text-destructive"
                )}
                onClick={() => navigate(`/admin/objectives?country=${code}`)}
              >
                {COUNTRY_FLAGS[code]} {countryAlerts.length}
              </Badge>
            );
          })}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-2">
          {displayedAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onMarkRead={() => markAsRead(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/admin/alerts?type=objective')}
            >
              Voir les {alerts.length - maxAlerts} autres alertes
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/objectives')}
            >
              <Target className="h-4 w-4 mr-1" />
              Gérer les objectifs
            </Button>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={dismissAll}
              >
                Masquer tout
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}