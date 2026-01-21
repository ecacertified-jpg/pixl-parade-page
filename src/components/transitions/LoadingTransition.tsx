import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * LoadingTransition - Indicateur de chargement animé pour Suspense
 * 
 * Affiche un loader spinning avec animation de scale pour
 * les pages lazy-loaded pendant leur chargement.
 * 
 * Usage:
 * ```tsx
 * <Suspense fallback={<LoadingTransition />}>
 *   <LazyPage />
 * </Suspense>
 * ```
 */
export function LoadingTransition() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <motion.div
          animate={{ 
            rotate: 360,
          }}
          transition={{ 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
          }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
        <motion.span 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Chargement...
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
