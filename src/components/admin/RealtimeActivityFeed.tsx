import { Users, Store, ShoppingCart, Gift, Coins, Trash2, Pause, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RealtimeEvent, RealtimeEventType } from '@/hooks/useRealtimeDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RealtimeActivityFeedProps {
  events: RealtimeEvent[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
}

const eventConfig: Record<RealtimeEventType, { icon: React.ElementType; color: string; bgColor: string }> = {
  user: { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  business: { icon: Store, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  order: { icon: ShoppingCart, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  fund: { icon: Gift, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  contribution: { icon: Coins, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
};

function EventItem({ event }: { event: RealtimeEvent }) {
  const config = eventConfig[event.type];
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(event.timestamp, { addSuffix: true, locale: fr });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-3 rounded-lg border mb-2",
        config.bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full bg-background", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              🆕 Nouveau
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="font-medium mt-1">{event.title}</p>
          <p className="text-sm text-muted-foreground truncate">{event.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function RealtimeActivityFeed({ events, isPaused, onTogglePause, onClear }: RealtimeActivityFeedProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header - responsive layout */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Row 1: Live indicator + title */}
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <span className="flex h-3 w-3">
              <span className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                isPaused ? "bg-amber-400" : "bg-red-400 animate-ping"
              )} />
              <span className={cn(
                "relative inline-flex rounded-full h-3 w-3",
                isPaused ? "bg-amber-500" : "bg-red-500"
              )} />
            </span>
          </div>
          <h3 className="font-semibold text-sm sm:text-base">
            Activité en direct
          </h3>
          {isPaused && (
            <span className="text-amber-600 text-xs sm:text-sm">(En pause)</span>
          )}
        </div>
        
        {/* Row 2: Badge + action buttons */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {events.length} événements
          </Badge>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onTogglePause}
              title={isPaused ? "Reprendre" : "Pause"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClear}
              title="Effacer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-muted-foreground"
            >
              <Gift className="h-12 w-12 mb-4 opacity-50" />
              <p>En attente d'activité...</p>
              <p className="text-sm">Les nouveaux événements apparaîtront ici</p>
            </motion.div>
          ) : (
            events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
