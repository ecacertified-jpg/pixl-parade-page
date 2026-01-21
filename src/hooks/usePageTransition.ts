import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type TransitionDirection = 'forward' | 'backward' | 'same';

interface PageTransitionState {
  isTransitioning: boolean;
  previousPath: string | null;
  currentPath: string;
  direction: TransitionDirection;
}

/**
 * usePageTransition - Hook pour gérer l'état des transitions de page
 * 
 * Détecte automatiquement la direction de navigation basée sur la
 * profondeur de l'URL et fournit un état de transition.
 * 
 * Usage:
 * ```tsx
 * const { isTransitioning, direction, previousPath } = usePageTransition();
 * ```
 * 
 * @returns {PageTransitionState} État de la transition
 */
export function usePageTransition(): PageTransitionState {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);
  const [state, setState] = useState<PageTransitionState>({
    isTransitioning: false,
    previousPath: null,
    currentPath: location.pathname,
    direction: 'same'
  });

  useEffect(() => {
    // Ignorer le premier render ou si même chemin
    if (previousPathRef.current === null) {
      previousPathRef.current = location.pathname;
      return;
    }
    
    if (previousPathRef.current === location.pathname) {
      return;
    }

    const previousDepth = previousPathRef.current.split('/').filter(Boolean).length;
    const currentDepth = location.pathname.split('/').filter(Boolean).length;
    
    let direction: TransitionDirection = 'same';
    if (currentDepth > previousDepth) {
      direction = 'forward';
    } else if (currentDepth < previousDepth) {
      direction = 'backward';
    }

    setState({
      isTransitioning: true,
      previousPath: previousPathRef.current,
      currentPath: location.pathname,
      direction
    });

    previousPathRef.current = location.pathname;

    // Fin de la transition après l'animation
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isTransitioning: false }));
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return state;
}
