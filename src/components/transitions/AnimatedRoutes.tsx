import { ReactNode, useRef, useEffect, useState } from "react";
import { Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface AnimatedRoutesProps {
  children: ReactNode;
}

// Déterminer la profondeur de l'URL pour la direction de navigation
function getRouteDepth(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}

// Variants pour navigation "forward" (aller plus profond)
const forwardVariants = {
  initial: { opacity: 0, x: 30, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 },
};

// Variants pour navigation "backward" (remonter)
const backwardVariants = {
  initial: { opacity: 0, x: -30, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.98 },
};

// Variants pour navigation "same level" (même profondeur)
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Pas de motion pour accessibilité
const noMotionVariants = {
  initial: {},
  animate: {},
  exit: {},
};

/**
 * AnimatedRoutes - Wrapper pour React Router avec transitions directionnelles
 * 
 * Détecte automatiquement la direction de navigation :
 * - Forward (plus profond) : slide droite → gauche
 * - Backward (moins profond) : slide gauche → droite  
 * - Same level : fade + slide vertical
 * 
 * Respecte prefers-reduced-motion pour l'accessibilité
 */
export function AnimatedRoutes({ children }: AnimatedRoutesProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const previousDepth = useRef(getRouteDepth(location.pathname));
  const previousPath = useRef(location.pathname);
  const [direction, setDirection] = useState<'forward' | 'backward' | 'same'>('same');

  useEffect(() => {
    // Ne pas animer si c'est la même page
    if (previousPath.current === location.pathname) return;
    
    const currentDepth = getRouteDepth(location.pathname);
    
    if (currentDepth > previousDepth.current) {
      setDirection('forward');
    } else if (currentDepth < previousDepth.current) {
      setDirection('backward');
    } else {
      setDirection('same');
    }
    
    previousDepth.current = currentDepth;
    previousPath.current = location.pathname;
  }, [location.pathname]);

  // Si l'utilisateur préfère réduire les animations
  if (shouldReduceMotion) {
    return <Routes location={location}>{children}</Routes>;
  }

  // Sélectionner les variants selon la direction
  const variants = direction === 'forward' 
    ? forwardVariants 
    : direction === 'backward' 
      ? backwardVariants 
      : fadeVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{ 
          duration: 0.25, 
          ease: [0.25, 0.1, 0.25, 1] // Custom cubic-bezier pour fluidité
        }}
        className="min-h-screen"
      >
        <Routes location={location}>{children}</Routes>
      </motion.div>
    </AnimatePresence>
  );
}
