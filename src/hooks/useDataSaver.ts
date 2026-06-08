import { useEffect, useState } from 'react';

/**
 * Détecte les connexions lentes (2G/slow-2g) ou le mode économie de données
 * activé par l'utilisateur. Utile pour adapter l'UI : désactiver l'autoplay
 * vidéo, charger des images basse résolution, réduire les animations.
 * Optimisé pour les réseaux mobiles africains.
 */
export function useDataSaver() {
  const getState = () => {
    if (typeof navigator === 'undefined') return { isLowData: false, effectiveType: '4g' as string };
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!conn) return { isLowData: false, effectiveType: '4g' };
    const effectiveType = conn.effectiveType || '4g';
    const isLowData = !!conn.saveData || effectiveType === '2g' || effectiveType === 'slow-2g';
    return { isLowData, effectiveType };
  };

  const [state, setState] = useState(getState);

  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;
    const handler = () => setState(getState());
    conn.addEventListener?.('change', handler);
    return () => conn.removeEventListener?.('change', handler);
  }, []);

  return state;
}