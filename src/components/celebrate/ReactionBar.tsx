import { useCelebrationReactions, CELEBRATION_EMOJIS } from "@/hooks/useCelebrationReactions";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
}

export function ReactionBar({ postId }: Props) {
  const { summary, toggle } = useCelebrationReactions(postId);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CELEBRATION_EMOJIS.map((emoji) => {
        const r = summary.find((s) => s.emoji === emoji);
        const count = r?.count || 0;
        const active = r?.reactedByMe || false;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-all",
              active
                ? "border-primary bg-primary/10 scale-105"
                : "border-border bg-card hover:bg-secondary"
            )}
          >
            <span className="text-base leading-none">{emoji}</span>
            {count > 0 && <span className="text-xs font-medium tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}