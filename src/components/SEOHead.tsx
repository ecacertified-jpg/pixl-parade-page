import { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'product' | 'article' | 'business.business';
  keywords?: string;
  noIndex?: boolean;
  publishedTime?: string;
  twitterCreator?: string;
}

const APP_NAME = "JOIE DE VIVRE";
const DEFAULT_IMAGE = "https://joiedevivre-africa.com/og-image.png";
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;
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
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  imageAlt,
  url, 
  type = 'website',
  keywords,
  noIndex = false,
  publishedTime,
  twitterCreator
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
    updateMetaTag('og:image:width', String(imageWidth));
    updateMetaTag('og:image:height', String(imageHeight));
    if (imageAlt) {
      updateMetaTag('og:image:alt', imageAlt);
    }
    updateMetaTag('og:site_name', APP_NAME);
    updateMetaTag('og:locale', 'fr_FR');
    
    // Article specific
    if (type === 'article' && publishedTime) {
      updateMetaTag('article:published_time', publishedTime);
    }
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:url', currentUrl);
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    if (twitterCreator) {
      updateMetaTag('twitter:creator', twitterCreator, false);
    }
    
    // Canonical URL
    updateLinkTag('canonical', currentUrl);
    
    // Cleanup function - reset to defaults when component unmounts
    return () => {
      document.title = `${APP_NAME} - Cadeaux Collectifs Côte d'Ivoire`;
    };
  }, [title, description, image, imageWidth, imageHeight, imageAlt, url, type, keywords, noIndex, publishedTime, twitterCreator]);
  
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
  home: {
    title: "Tableau de Bord | Gérez vos Cadeaux",
    description: "Accédez à votre espace personnel. Gérez vos cagnottes, contacts et cadeaux collectifs. Suivez les anniversaires de vos proches.",
    keywords: "dashboard cadeaux, gestion cagnotte, anniversaires proches",
  },
  community: {
    title: "Communauté | Célébrations et Partages",
    description: "Rejoignez la communauté JOIE DE VIVRE. Partagez vos moments de joie, découvrez les célébrations et inspirez-vous.",
    keywords: "communauté cadeaux, célébrations Afrique, partage joie",
  },
  giftIdeas: {
    title: "Idées Cadeaux | Inspiration pour Toutes les Occasions",
    description: "Trouvez l'inspiration pour vos cadeaux. Suggestions personnalisées pour anniversaires, mariages, promotions en Côte d'Ivoire.",
    keywords: "idées cadeaux Abidjan, inspiration cadeau, suggestions anniversaire",
  },
  dashboard: {
    title: "Mon Espace | Cagnottes et Contacts",
    description: "Gérez vos cagnottes collectives, suivez les contributions et organisez les cadeaux pour vos proches.",
    keywords: "espace personnel, cagnottes, contacts anniversaires",
  },
  cart: {
    title: "Panier | Vos Articles",
    description: "Finalisez votre commande. Articles artisanaux ivoiriens prêts à être offerts.",
    keywords: "panier cadeaux, commande Abidjan",
  },
  privacy: {
    title: "Politique de Confidentialité",
    description: "Découvrez comment JOIE DE VIVRE protège vos données personnelles et respecte votre vie privée.",
    keywords: "confidentialité, protection données, RGPD Afrique",
  },
  terms: {
    title: "Conditions d'Utilisation",
    description: "Consultez les conditions générales d'utilisation de la plateforme JOIE DE VIVRE.",
    keywords: "CGU, conditions utilisation, mentions légales",
  },
  legal: {
    title: "Mentions Légales",
    description: "Informations légales sur la société JOIE DE VIVRE, éditeur du site et hébergement.",
    keywords: "mentions légales, informations société, éditeur site",
  },
} as const;

export default SEOHead;
