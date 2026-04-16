import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS: { type: string; emoji: string }[] = [
  { type: "heart", emoji: "❤️" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "clap", emoji: "👏" },
  { type: "party", emoji: "🎉" },
];

export interface ReactionCounts {
  [reactionType: string]: number;
}

export interface UserReactions {
  [reactionType: string]: boolean;
}

interface AlbumItemReactionsProps {
  photoId: string;
  userId: string | null;
  counts: ReactionCounts;
  userReactions: UserReactions;
  onToggle: (photoId: string, type: string, added: boolean) => void;
  compact?: boolean;
}

export function AlbumItemReactions({
  photoId,
  userId,
  counts,
  userReactions,
  onToggle,
  compact = false,
}: AlbumItemReactionsProps) {
  const [animating, setAnimating] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    if (!userId) return;

    const isActive = userReactions[type];
    setAnimating(type);
    setTimeout(() => setAnimating(null), 400);

    // Optimistic update
    onToggle(photoId, type, !isActive);

    try {
      if (isActive) {
        await supabase
          .from("album_photo_reactions")
          .delete()
          .eq("photo_id", photoId)
          .eq("user_id", userId)
          .eq("reaction_type", type);
      } else {
        await supabase.from("album_photo_reactions").insert({
          photo_id: photoId,
          user_id: userId,
          reaction_type: type,
        });
      }
    } catch {
      // Revert on error
      onToggle(photoId, type, isActive);
    }
  };

  const hasAny = Object.values(counts).some((c) => c > 0);

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 flex-wrap",
        compact ? "gap-0" : "gap-1"
      )}
    >
      {REACTION_EMOJIS.map(({ type, emoji }) => {
        const count = counts[type] || 0;
        const isActive = userReactions[type];
        const isAnimating = animating === type;

        if (compact && count === 0 && !isActive) return null;

        return (
          <motion.button
            key={type}
            onClick={(e) => handleClick(e, type)}
            animate={isAnimating ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={cn(
              "inline-flex items-center rounded-full transition-colors text-xs",
              compact ? "px-1 py-0.5 gap-0.5" : "px-1.5 py-0.5 gap-1",
              isActive
                ? "bg-primary/20 ring-1 ring-primary/40"
                : "bg-muted/60 hover:bg-muted",
              !userId && "opacity-50 cursor-default"
            )}
            disabled={!userId}
          >
            <span className={compact ? "text-[10px]" : "text-xs"}>{emoji}</span>
            {count > 0 && (
              <span
                className={cn(
                  "font-medium",
                  compact ? "text-[9px]" : "text-[10px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}

      {!hasAny && !compact && (
        <span className="text-[10px] text-muted-foreground/50 ml-0.5">Réagis !</span>
      )}
    </div>
  );
}
