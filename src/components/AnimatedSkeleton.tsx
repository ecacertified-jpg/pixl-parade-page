import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedSkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "text";
  delay?: number;
}

export function AnimatedSkeleton({ 
  className, 
  variant = "default",
  delay = 0 
}: AnimatedSkeletonProps) {
  const shouldReduceMotion = useReducedMotion();

  const baseClasses = cn(
    "bg-muted rounded-md overflow-hidden relative",
    variant === "circular" && "rounded-full",
    variant === "text" && "rounded",
    className
  );

  if (shouldReduceMotion) {
    return <div className={cn(baseClasses, "animate-pulse")} />;
  }

  return (
    <motion.div
      className={baseClasses}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "linear",
          delay
        }}
      />
    </motion.div>
  );
}
