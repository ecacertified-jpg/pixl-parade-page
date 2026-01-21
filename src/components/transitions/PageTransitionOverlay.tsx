import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface PageTransitionOverlayProps {
  isTransitioning: boolean;
}

/**
 * PageTransitionOverlay - Overlay subtil pendant les transitions de page
 * 
 * Affiche un fond semi-transparent avec blur léger pour masquer
 * les "sauts" visuels pendant les changements de page.
 * 
 * Usage:
 * ```tsx
 * const { isTransitioning } = usePageTransition();
 * <PageTransitionOverlay isTransitioning={isTransitioning} />
 * ```
 */
export function PageTransitionOverlay({ isTransitioning }: PageTransitionOverlayProps) {
  const shouldReduceMotion = useReducedMotion();

  // Pas d'overlay si reduced motion ou pas de transition
  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 bg-background/30 backdrop-blur-[1px] z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </AnimatePresence>
  );
}
