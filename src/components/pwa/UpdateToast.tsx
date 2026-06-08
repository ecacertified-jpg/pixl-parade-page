import { useEffect } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';

/**
 * Écoute l'événement `pwa:need-refresh` émis depuis main.tsx
 * et propose à l'utilisateur d'actualiser sans interrompre brutalement.
 */
export function UpdateToast() {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ update: () => void }>).detail;
      toast('Nouvelle version disponible', {
        description: '✨ Une mise à jour fraîche vous attend',
        icon: <Sparkles className="h-4 w-4 text-primary" />,
        duration: Infinity,
        action: {
          label: 'Actualiser',
          onClick: () => detail?.update?.(),
        },
      });
    };
    window.addEventListener('pwa:need-refresh', handler as EventListener);
    return () => window.removeEventListener('pwa:need-refresh', handler as EventListener);
  }, []);

  return null;
}