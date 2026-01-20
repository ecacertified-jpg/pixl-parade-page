import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Sparkles, 
  ShoppingCart, 
  Target, 
  X, 
  Check, 
  ChevronDown,
  ChevronUp,
  Flame,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProductViralityAlerts, ProductViralityAlert } from '@/hooks/useProductViralityAlerts';

interface ViralityAlertsBannerProps {
  businessId: string;
  maxVisible?: number;
  className?: string;
}

const alertTypeConfig = {
  shares_milestone: {
    icon: Sparkles,
    label: 'Jalon partages',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-500'
  },
  shares_spike: {
    icon: TrendingUp,
    label: 'Pic de partages',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500'
  },
  conversions_milestone: {
    icon: ShoppingCart,
    label: 'Jalon ventes',
    gradient: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-500'
  },
  high_conversion_rate: {
    icon: Target,
    label: 'Conversion élevée',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-500'
  },
  viral_trending: {
    icon: Flame,
    label: 'Tendance virale',
    gradient: 'from-red-500/20 to-pink-500/20',
    iconColor: 'text-red-500'
  }
};

const severityStyles = {
  info: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30',
  warning: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30',
  success: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30'
};

export function ViralityAlertsBanner({ 
  businessId, 
  maxVisible = 3,
  className 
}: ViralityAlertsBannerProps) {
  const { alerts, loading, unreadCount, markAsRead, markAllAsRead, dismissAlert } = useProductViralityAlerts(businessId);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  const visibleAlerts = expanded ? alerts : alerts.slice(0, maxVisible);
  const hasMore = alerts.length > maxVisible;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-primary" />
            Alertes de viralité
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Tout lire
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleAlerts.map((alert, index) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onMarkAsRead={() => markAsRead(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
              index={index}
            />
          ))}
        </AnimatePresence>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Réduire
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Voir {alerts.length - maxVisible} de plus
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: ProductViralityAlert;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  index: number;
}

function AlertItem({ alert, onMarkAsRead, onDismiss, index }: AlertItemProps) {
  const config = alertTypeConfig[alert.alert_type] || alertTypeConfig.shares_milestone;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative p-3 rounded-lg border transition-all",
        severityStyles[alert.severity],
        !alert.is_read && "ring-2 ring-primary/20"
      )}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 rounded-lg bg-gradient-to-r opacity-30",
        config.gradient
      )} />
      
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 p-2 rounded-full bg-background/80",
          config.iconColor
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            {!alert.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          
          <p className="text-sm font-medium text-foreground">
            {alert.message}
          </p>
          
          {alert.product_name && (
            <p className="text-xs text-muted-foreground mt-1">
              Produit : {alert.product_name}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(alert.created_at), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
            
            {alert.current_shares > 0 && (
              <span className="flex items-center gap-1">
                📤 {alert.current_shares} partages
              </span>
            )}
            
            {alert.current_conversions > 0 && (
              <span className="flex items-center gap-1">
                🛒 {alert.current_conversions} ventes
              </span>
            )}
            
            {alert.share_growth_percentage && alert.share_growth_percentage > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                📈 +{Math.round(alert.share_growth_percentage)}%
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {!alert.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onMarkAsRead}
              title="Marquer comme lu"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDismiss}
            title="Ignorer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for sidebar or widgets
export function ViralityAlertsCompact({ businessId }: { businessId: string }) {
  const { unreadCount, alerts } = useProductViralityAlerts(businessId);
  
  if (unreadCount === 0) return null;

  const latestAlert = alerts[0];
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20"
    >
      <div className="relative">
        <Bell className="h-4 w-4 text-primary" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-[8px] text-white flex items-center justify-center">
          {unreadCount}
        </span>
      </div>
      <span className="text-xs text-foreground truncate">
        {latestAlert?.message || `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} de viralité`}
      </span>
    </motion.div>
  );
}