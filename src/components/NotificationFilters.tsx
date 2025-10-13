import { Gift, Users, Calendar, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationFilter } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationFiltersProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  counts: Record<NotificationFilter, number>;
}

const filterConfig = {
  all: { label: 'Tous', icon: Filter },
  gift: { label: 'Cadeaux', icon: Gift },
  fund: { label: 'Cagnottes', icon: Users },
  birthday: { label: 'Anniversaires', icon: Calendar },
  event: { label: 'Événements', icon: Calendar },
  ai: { label: 'IA', icon: Sparkles },
};

export const NotificationFilters = ({ 
  activeFilter, 
  onFilterChange, 
  counts 
}: NotificationFiltersProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide">
      {(Object.keys(filterConfig) as NotificationFilter[]).map((filter) => {
        const config = filterConfig[filter];
        const Icon = config.icon;
        const count = counts[filter] || 0;
        const isActive = activeFilter === filter;

        return (
          <Button
            key={filter}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap transition-all",
              isActive && "ring-2 ring-primary/20"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
            {count > 0 && (
              <Badge 
                variant={isActive ? "secondary" : "default"} 
                className="ml-1 h-5 min-w-5 px-1.5"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};
