import { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article' | 'business.business';
  keywords?: string;
  noIndex?: boolean;
}

const APP_NAME = "JOIE DE VIVRE";
const DEFAULT_IMAGE = "https://joiedevivre-africa.com/og-image.png";
const BASE_URL = "https://joiedevivre-africa.com";

/**
 * Updates or creates a meta tag in the document head
 */
function updateMetaTag(property: string, content: string, isProperty = true) {
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, property);
    document.head.appendChild(meta);
  }
  
  meta.content = content;
}

/**
 * Updates or creates a link tag in the document head
 */
function updateLinkTag(rel: string, href: string, hreflang?: string) {
  const selector = hreflang 
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  
  let link = document.querySelector(selector) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    if (hreflang) link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  
  link.href = href;
}

/**
 * SEOHead Component - Dynamically updates document meta tags for SEO
 * 
 * Usage:
 * <SEOHead 
 *   title="Boutique Cadeaux Abidjan"
 *   description="Découvrez les meilleurs cadeaux locaux"
 *   keywords="cadeaux, Abidjan, artisanat ivoirien"
 * />
 */
export function SEOHead({ 
  title, 
  description, 
  image = DEFAULT_IMAGE, 
  url, 
  type = 'website',
  keywords,
  noIndex = false
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    const fullTitle = title.includes(APP_NAME) ? title : `${title} | ${APP_NAME}`;
    document.title = fullTitle;
    
    // Get current URL if not provided
    const currentUrl = url || `${BASE_URL}${window.location.pathname}`;
    
    // Primary Meta Tags
    updateMetaTag('title', fullTitle, false);
    updateMetaTag('description', description, false);
    if (keywords) {
      updateMetaTag('keywords', keywords, false);
    }
    
    // Robots
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow', false);
    } else {
      updateMetaTag('robots', 'index, follow', false);
    }
    
    // Open Graph / Facebook
    updateMetaTag('og:type', type);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:title', fullTitle);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:site_name', APP_NAME);
    updateMetaTag('og:locale', 'fr_FR');
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', currentUrl);
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Canonical URL
    updateLinkTag('canonical', currentUrl);
    
    // Cleanup function - reset to defaults when component unmounts
    return () => {
      document.title = `${APP_NAME} - Cadeaux Collectifs Côte d'Ivoire`;
    };
  }, [title, description, image, url, type, keywords, noIndex]);
  
  return null;
}

/**
 * Pre-configured SEO configurations for common pages
 */
export const SEO_CONFIGS = {
  landing: {
    title: "Cadeaux Collectifs Côte d'Ivoire & Bénin | Cagnottes Anniversaire Abidjan",
    description: "Plateforme #1 de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages, promotions. Boutiques artisanales locales à Abidjan.",
    keywords: "cadeaux Abidjan, cagnotte anniversaire Côte d'Ivoire, cadeau groupe Afrique, artisanat ivoirien, cagnotte collective Bénin",
  },
  shop: {
    title: "Boutique Cadeaux Abidjan - Artisanat Ivoirien",
    description: "Découvrez les meilleurs cadeaux locaux : bijoux, mode, décoration, gastronomie. Livraison rapide à Abidjan et en Côte d'Ivoire. Artisans vérifiés.",
    keywords: "boutique cadeaux Abidjan, artisanat Côte d'Ivoire, bijoux africains, cadeaux locaux Afrique, mode ivoirienne",
  },
  about: {
    title: "À Propos - Cadeaux Collectifs Afrique Francophone",
    description: "Notre mission : célébrer les moments de joie en Afrique francophone avec des cadeaux collaboratifs. Découvrez l'histoire de JOIE DE VIVRE.",
    keywords: "joie de vivre application, cadeaux Afrique, startup ivoirienne, cagnottes en ligne",
  },
  faq: {
    title: "FAQ - Questions Fréquentes Cagnottes Collectives",
    description: "Réponses aux questions fréquentes sur les cagnottes, paiements Mobile Money (Orange, MTN, Wave), livraisons en Côte d'Ivoire et Bénin.",
    keywords: "FAQ cagnotte, Orange Money paiement, MTN Mobile Money, livraison Abidjan, aide cadeaux",
  },
  contact: {
    title: "Contactez-nous | Support Client JOIE DE VIVRE",
    description: "Une question ? Contactez l'équipe JOIE DE VIVRE. Support client réactif à Abidjan. Aide pour cagnottes, commandes et livraisons.",
    keywords: "contact joie de vivre, support client Abidjan, aide cagnotte, service client",
  },
} as const;

export default SEOHead;
