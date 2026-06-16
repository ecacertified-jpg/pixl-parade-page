import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Gift } from "lucide-react";
import { DIGITAL_GIFTS, getGift } from "./digitalGifts";
import { useDigitalGifts } from "@/hooks/useCelebrationPremium";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  recipientUserId?: string | null;
}

export function DigitalGiftBar({ postId, recipientUserId }: Props) {
  const { gifts, send } = useDigitalGifts(postId);
  const [open, setOpen] = useState(false);
  const [burst, setBurst] = useState<{ id: string; emoji: string } | null>(null);

  const handle = async (g: (typeof DIGITAL_GIFTS)[number]) => {
    setOpen(false);
    const ok = await send(g, recipientUserId);
    if (ok) {
      setBurst({ id: crypto.randomUUID(), emoji: g.emoji });
      setTimeout(() => setBurst(null), 1800);
    }
  };

  // Show last 6 unique emojis
  const recent = gifts.slice(0, 6);

  return (
    <div className="relative flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-celebration"
          >
            <Gift className="h-4 w-4" />
            <span className="text-xs">Offrir</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Cadeaux numériques
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DIGITAL_GIFTS.map((g) => (
              <button
                key={g.key}
                onClick={() => handle(g)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border p-2 transition-all hover:scale-105 hover:border-primary",
                  g.isPremium
                    ? "border-amber-400/40 bg-gradient-to-br from-amber-50 to-pink-50"
                    : "border-border bg-card"
                )}
                title={g.label}
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-[10px] font-medium">{g.label}</span>
                <span className="text-[9px] text-muted-foreground">
                  {g.amount_xof === 0 ? "Gratuit" : `${g.amount_xof} F`}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Les cadeaux premium sont à régler via Wave après envoi.
          </p>
        </PopoverContent>
      </Popover>

      {recent.length > 0 && (
        <div className="flex -space-x-1 overflow-hidden">
          {recent.map((g) => {
            const meta = getGift(g.gift_key);
            return (
              <span
                key={g.id}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-card text-sm shadow-sm ring-2 ring-background"
                title={meta?.label || g.gift_key}
              >
                {meta?.emoji || "🎁"}
              </span>
            );
          })}
          {gifts.length > 6 && (
            <span className="ml-1 text-xs text-muted-foreground">+{gifts.length - 6}</span>
          )}
        </div>
      )}

      <AnimatePresence>
        {burst && (
          <motion.div
            key={burst.id}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -60, opacity: [0, 1, 0], scale: 1.6 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="pointer-events-none absolute left-6 top-0 text-3xl"
          >
            {burst.emoji}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}