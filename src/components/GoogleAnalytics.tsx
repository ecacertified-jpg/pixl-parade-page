import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '';

export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      console.warn('[GA] ID de mesure non configuré - ajoutez VITE_GOOGLE_ANALYTICS_ID');
      return;
    }

    // Évite les doublons de scripts
    if (document.querySelector(`script[src*="googletagmanager"]`)) {
      return;
    }

    // Charger le script gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialiser dataLayer et gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
      send_page_view: true,
    });
  }, []);

  // Suivre les changements de page
  useEffect(() => {
    if (GA_MEASUREMENT_ID && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location.pathname, location.search]);

  return null;
}
