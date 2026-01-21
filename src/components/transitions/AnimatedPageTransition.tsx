import { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

export type TransitionMode = "fade" | "slide" | "slideUp" | "scale";

interface AnimatedPageTransitionProps {
  children: ReactNode;
  mode?: TransitionMode;
  duration?: number;
  className?: string;
}

const pageVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
};

const noMotionVariants = {
  initial: {},
  animate: {},
  exit: {},
};

/**
 * AnimatedPageTransition - Wrapper component for animating page transitions
 * 
 * Usage:
 * ```tsx
 * <AnimatedPageTransition mode="slideUp">
 *   <YourPageContent />
 * </AnimatedPageTransition>
 * ```
 * 
 * Modes:
 * - fade: Simple opacity fade (default)
 * - slide: Horizontal slide with fade
 * - slideUp: Vertical slide up with fade
 * - scale: Subtle zoom with fade
 */
export function AnimatedPageTransition({
  children,
  mode = "fade",
  duration = 0.25,
  className = "",
}: AnimatedPageTransitionProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Respect accessibility preferences
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = pageVariants[mode];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration,
          ease: "easeInOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
