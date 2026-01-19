import { useCallback } from 'react';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '';

type EventParams = {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
};

export function useGoogleAnalytics() {
  
  // Tracker un événement personnalisé
  const trackEvent = useCallback((
    eventName: string,
    params?: EventParams
  ) => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;
    window.gtag('event', eventName, params);
  }, []);

  // Événements spécifiques aux réseaux sociaux
  const trackSocialShare = useCallback((
    platform: string,
    contentType: 'product' | 'fund' | 'business' | 'post',
    contentId: string
  ) => {
    trackEvent('share', {
      method: platform,
      content_type: contentType,
      item_id: contentId,
    });
  }, [trackEvent]);

  // Tracker une conversion (achat, contribution)
  const trackConversion = useCallback((
    type: 'purchase' | 'contribution' | 'signup',
    value: number,
    currency: string = 'XOF'
  ) => {
    trackEvent(type, {
      value,
      currency,
      event_category: 'conversion',
    });
  }, [trackEvent]);

  // Tracker le clic depuis un partage social
  const trackSocialReferral = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    
    if (source && medium === 'social') {
      trackEvent('social_referral', {
        event_category: 'acquisition',
        event_label: source,
        social_platform: source,
      });
    }
  }, [trackEvent]);

  // Tracker l'ajout au panier
  const trackAddToCart = useCallback((
    productId: string,
    productName: string,
    value: number
  ) => {
    trackEvent('add_to_cart', {
      currency: 'XOF',
      value,
      items: [{
        item_id: productId,
        item_name: productName,
        price: value,
      }],
    });
  }, [trackEvent]);

  // Tracker la vue d'un produit
  const trackViewItem = useCallback((
    productId: string,
    productName: string,
    value: number,
    category?: string
  ) => {
    trackEvent('view_item', {
      currency: 'XOF',
      value,
      items: [{
        item_id: productId,
        item_name: productName,
        price: value,
        item_category: category,
      }],
    });
  }, [trackEvent]);

  // Tracker l'inscription
  const trackSignUp = useCallback((method: string = 'email') => {
    trackEvent('sign_up', {
      method,
    });
  }, [trackEvent]);

  // Tracker la connexion
  const trackLogin = useCallback((method: string = 'email') => {
    trackEvent('login', {
      method,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSocialShare,
    trackConversion,
    trackSocialReferral,
    trackAddToCart,
    trackViewItem,
    trackSignUp,
    trackLogin,
  };
}

// Fonction standalone pour le tracking (sans hook)
export function trackGAEvent(eventName: string, params?: EventParams) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', eventName, params);
}
