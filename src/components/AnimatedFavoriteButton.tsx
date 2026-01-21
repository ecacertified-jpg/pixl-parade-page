import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedFavoriteButtonProps {
  isFavorite: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "md";
}

export function AnimatedFavoriteButton({
  isFavorite,
  onClick,
  className,
  size = "md"
}: AnimatedFavoriteButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const iconSize = size === "sm" ? "h-4 w-4" : "h-4 w-4";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  if (shouldReduceMotion) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "p-1.5 rounded-full bg-background/80 backdrop-blur-sm transition-colors",
          isFavorite ? "text-destructive" : "text-muted-foreground hover:text-destructive",
          className
        )}
      >
        <Heart className={cn(iconSize, isFavorite && "fill-current")} />
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleClick}
      className={cn(
        "p-1.5 rounded-full bg-background/80 backdrop-blur-sm transition-colors",
        isFavorite ? "text-destructive" : "text-muted-foreground hover:text-destructive",
        className
      )}
    >
      <motion.div
        animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart className={cn(iconSize, isFavorite && "fill-current")} />
      </motion.div>
    </motion.button>
  );
}
