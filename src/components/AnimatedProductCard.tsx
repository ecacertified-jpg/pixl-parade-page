import { ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";

interface AnimatedProductCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  onClick?: () => void;
}

export function AnimatedProductCard({ 
  children, 
  index = 0, 
  className,
  onClick 
}: AnimatedProductCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  const transition: Transition = {
    delay: index * 0.05,
    duration: 0.3,
    ease: "easeOut" as const
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transition}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        boxShadow: "0 8px 30px hsl(var(--primary) / 0.15)",
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
