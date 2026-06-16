import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  size?: "sm" | "md";
  className?: string;
}

export function VipBadge({ size = "sm", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm",
        size === "md" && "px-2.5 py-1 text-xs",
        className
      )}
      title="Membre VIP"
    >
      <Crown className="h-3 w-3" />
      VIP
    </span>
  );
}