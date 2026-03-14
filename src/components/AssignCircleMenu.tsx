import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";
import { type FriendCircle } from "@/hooks/useFriendCircles";

interface AssignCircleMenuProps {
  circles: FriendCircle[];
  currentCircleId?: string;
  onAssign: (circleId: string) => void;
  onRemove: () => void;
}

export function AssignCircleMenu({ circles, currentCircleId, onAssign, onRemove }: AssignCircleMenuProps) {
  if (circles.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
          <Users className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Assigner au cercle</p>
        <div className="space-y-0.5">
          {circles.map(circle => (
            <button
              key={circle.id}
              className={`w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md transition-colors ${
                currentCircleId === circle.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted'
              }`}
              onClick={() => onAssign(circle.id)}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: circle.color }}
              />
              {circle.name}
            </button>
          ))}
          {currentCircleId && (
            <>
              <div className="border-t my-1" />
              <button
                className="w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
                Retirer du cercle
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
