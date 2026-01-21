import { ReactNode } from "react";
import { Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface AnimatedRoutesProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 8 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    y: -8 
  },
};

const noMotionVariants = {
  initial: {},
  animate: {},
  exit: {},
};

/**
 * AnimatedRoutes - Wrapper for React Router's Routes with page transitions
 * 
 * Replaces the standard <Routes> component with an animated version
 * that provides smooth fade + slide transitions between pages.
 * 
 * Usage:
 * ```tsx
 * // In App.tsx, replace:
 * <Routes>...</Routes>
 * 
 * // With:
 * <AnimatedRoutes>...</AnimatedRoutes>
 * ```
 * 
 * Features:
 * - Automatic exit/enter animations based on route changes
 * - Respects prefers-reduced-motion for accessibility
 * - Uses AnimatePresence mode="wait" for sequential transitions
 */
export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, render without animations
  if (shouldReduceMotion) {
    return <Routes location={location}>{children}</Routes>;
  }

  const variants = pageVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ 
          duration: 0.2, 
          ease: "easeOut" 
        }}
        className="min-h-screen"
      >
        <Routes location={location}>{children}</Routes>
      </motion.div>
    </AnimatePresence>
  );
}
