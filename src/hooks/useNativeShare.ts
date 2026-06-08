import { useCallback } from 'react';
import { toast } from 'sonner';

interface SharePayload {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * Web Share API avec fallback presse-papier.
 * Cohérent avec la stratégie virale JDV : on copie le texte complet + URL.
 */
export function useNativeShare() {
  const share = useCallback(async (payload: SharePayload) => {
    const fullText = [payload.text, payload.url].filter(Boolean).join('\n');
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share(payload);
        return { method: 'native' as const, success: true };
      } catch (err: any) {
        if (err?.name === 'AbortError') return { method: 'native' as const, success: false };
      }
    }
    try {
      await navigator.clipboard.writeText(fullText);
      toast.success('Lien copié 💛', { description: 'Collez-le dans WhatsApp pour partager' });
      return { method: 'clipboard' as const, success: true };
    } catch {
      toast.error('Impossible de copier le lien');
      return { method: 'clipboard' as const, success: false };
    }
  }, []);

  return { share, canNativeShare: typeof navigator !== 'undefined' && 'share' in navigator };
}