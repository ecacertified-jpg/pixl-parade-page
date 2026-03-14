import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FriendCircle } from "@/hooks/useFriendCircles";

interface FriendCircleChipsProps {
  circles: FriendCircle[];
  selectedCircleId: string | null;
  onSelectCircle: (circleId: string | null) => void;
  onCreateCircle: () => void;
  onDeleteCircle: (circleId: string) => void;
}

export function FriendCircleChips({
  circles,
  selectedCircleId,
  onSelectCircle,
  onCreateCircle,
  onDeleteCircle,
}: FriendCircleChipsProps) {
  if (circles.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-xs h-7 rounded-full border-dashed"
          onClick={onCreateCircle}
        >
          <Plus className="h-3 w-3" />
          Créer un cercle
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
      <button
        className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-all whitespace-nowrap ${
          selectedCircleId === null
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
        onClick={() => onSelectCircle(null)}
      >
        Tous
      </button>

      {circles.map(circle => (
        <div key={circle.id} className="relative group">
          <button
            className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 transition-all whitespace-nowrap ${
              selectedCircleId === circle.id
                ? 'text-primary-foreground shadow-soft'
                : 'text-foreground/80 hover:opacity-90'
            }`}
            style={{
              backgroundColor: selectedCircleId === circle.id ? circle.color : `${circle.color}20`,
              borderColor: circle.color,
            }}
            onClick={() => onSelectCircle(selectedCircleId === circle.id ? null : circle.id)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedCircleId === circle.id ? 'white' : circle.color }}
            />
            {circle.name}
            <span className="text-[10px] opacity-70">({circle.member_count})</span>
          </button>
          <button
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onDeleteCircle(circle.id); }}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}

      <Button
        size="sm"
        variant="ghost"
        className="gap-1 text-xs h-7 rounded-full flex-shrink-0"
        onClick={onCreateCircle}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
