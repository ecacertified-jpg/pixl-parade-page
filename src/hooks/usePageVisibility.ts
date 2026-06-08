import { useEffect, useState } from 'react';

/**
 * Indique si la page est visible. Permet de suspendre les polls,
 * intervals et animations quand l'onglet est caché (économie batterie).
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return isVisible;
}