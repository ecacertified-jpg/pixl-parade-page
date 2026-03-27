import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarHeart, Gift, X } from "lucide-react";
import { motion } from "framer-motion";

interface BirthdayCountdownNotifCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata?: {
      days_until?: number;
      contact_name?: string;
      is_own_birthday?: boolean;
    };
  };
  onDismiss: () => void;
  onAction?: () => void;
}

export const BirthdayCountdownNotifCard = ({ notification, onDismiss, onAction }: BirthdayCountdownNotifCardProps) => {
  const daysUntil = notification.metadata?.days_until || 0;
  const isOwn = notification.metadata?.is_own_birthday !== false;

  const getUrgencyColor = () => {
    if (daysUntil <= 1) return "from-red-500/20 to-pink-500/20 border-red-300";
    if (daysUntil <= 3) return "from-orange-500/20 to-amber-500/20 border-orange-300";
    return "from-primary/10 to-accent/10 border-primary/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`p-4 bg-gradient-to-r ${getUrgencyColor()} relative overflow-hidden`}>
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <CalendarHeart className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-2xl font-bold text-primary">J-{daysUntil}</span>
              {isOwn && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={onAction}
                >
                  <Gift className="h-3 w-3 mr-1" />
                  Ma wishlist
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
