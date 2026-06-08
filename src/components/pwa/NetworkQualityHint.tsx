import { useEffect, useState } from 'react';
import { useDataSaver } from '@/hooks/useDataSaver';
import { Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'jdv_lowdata_hint_dismissed';

/**
 * Bannière douce qui informe l'utilisateur que la connexion est lente
 * et que JDV passe en mode économie. Visible 8 secondes puis fade out.
 */
export function NetworkQualityHint() {
  const { isLowData, effectiveType } = useDataSaver();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLowData) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(DISMISS_KEY, '1');
    }, 8000);
    return () => clearTimeout(t);
  }, [isLowData]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]',
        'flex items-center gap-2 px-4 py-2.5 rounded-full',
        'bg-gradient-to-r from-secondary/95 to-accent/30 backdrop-blur-md',
        'border border-primary/20 shadow-soft text-xs font-medium text-foreground',
        'animate-fade-in max-w-[90vw]'
      )}
    >
      <Signal className="h-3.5 w-3.5 text-primary shrink-0" />
      <span>
        Connexion {effectiveType.toUpperCase()} détectée · mode économie activé 💛
      </span>
    </div>
  );
}