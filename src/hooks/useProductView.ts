import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour tracker les vues de produits
 * Utilise un debounce et évite les doublons par session
 */
export function useProductView(productId: string | undefined) {
  const hasLogged = useRef(false);
  const productIdRef = useRef(productId);

  useEffect(() => {
    // Reset si le productId change
    if (productIdRef.current !== productId) {
      hasLogged.current = false;
      productIdRef.current = productId;
    }

    if (!productId || hasLogged.current) return;

    const logView = async () => {
      try {
        // Obtenir ou créer un session ID pour les utilisateurs anonymes
        let sessionId = sessionStorage.getItem('jdv_session_id');
        if (!sessionId) {
          sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          sessionStorage.setItem('jdv_session_id', sessionId);
        }

        // Vérifier si cette session a déjà vu ce produit récemment (dans les 30 dernières minutes)
        const viewKey = `product_view_${productId}`;
        const lastView = sessionStorage.getItem(viewKey);
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        
        if (lastView && parseInt(lastView) > thirtyMinutesAgo) {
          // Vue déjà enregistrée récemment pour ce produit
          hasLogged.current = true;
          return;
        }

        // Obtenir l'utilisateur connecté (optionnel)
        const { data: { session } } = await supabase.auth.getSession();

        // Enregistrer la vue
        const { error } = await supabase.from('product_views').insert({
          product_id: productId,
          viewer_id: session?.user?.id || null,
          session_id: sessionId,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent || null,
        });

        if (error) {
          console.error('Error logging product view:', error);
          return;
        }

        // Marquer comme vu pour cette session
        sessionStorage.setItem(viewKey, Date.now().toString());
        hasLogged.current = true;
      } catch (error) {
        console.error('Error in useProductView:', error);
      }
    };

    // Debounce de 1.5 secondes pour éviter les vues accidentelles
    const timer = setTimeout(logView, 1500);
    return () => clearTimeout(timer);
  }, [productId]);
}
