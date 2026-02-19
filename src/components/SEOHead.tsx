import { useEffect } from 'react';

export type AIContentType = 'marketplace' | 'faq' | 'article' | 'product' | 'business-profile' | 'fund' | 'documentation' | 'landing' | 'dashboard';
export type AIAudience = 'consumers' | 'gift-givers' | 'business-owners' | 'developers' | 'all';

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
  // AI/LLM specific meta tags
  aiContentType?: AIContentType;
  aiSummary?: string;
  audience?: AIAudience;
  contentRegion?: string;
  aiKeywords?: string;
  // Product-specific meta tags (for type='product')
  productPrice?: number;
  productCurrency?: string;
  productAvailability?: 'in stock' | 'out of stock' | 'preorder';
  productBrand?: string;
  productRating?: number;
  productReviewCount?: number;
  // Fund-specific meta tags (for aiContentType='fund')
  fundTargetAmount?: number;
  fundCurrentAmount?: number;
  fundCurrency?: string;
  fundProgress?: number;
  fundOccasion?: string;
  // Business-specific meta tags (for aiContentType='business-profile')
  businessProductsCount?: number;
  businessRating?: number;
  businessReviewCount?: number;
  businessType?: string;
  businessAddress?: string;
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
  twitterCreator,
  aiContentType,
  aiSummary,
  audience,
  contentRegion,
  aiKeywords,
  productPrice,
  productCurrency,
  productAvailability,
  productBrand,
  productRating,
  productReviewCount,
  fundTargetAmount,
  fundCurrentAmount,
  fundCurrency,
  fundProgress,
  fundOccasion,
  businessProductsCount,
  businessRating,
  businessReviewCount,
  businessType,
  businessAddress
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
    
    // Product-specific Open Graph meta tags
    if (type === 'product') {
      if (productPrice !== undefined) {
        updateMetaTag('product:price:amount', String(productPrice));
        updateMetaTag('og:price:amount', String(productPrice));
      }
      if (productCurrency) {
        updateMetaTag('product:price:currency', productCurrency);
        updateMetaTag('og:price:currency', productCurrency);
      }
      if (productAvailability) {
        updateMetaTag('product:availability', productAvailability);
      }
      if (productBrand) {
        updateMetaTag('product:brand', productBrand);
      }
      updateMetaTag('product:condition', 'new');
      updateMetaTag('og:updated_time', new Date().toISOString());
      
      // Pinterest Rich Pin support
      updateMetaTag('pinterest-rich-pin', 'true', false);
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
    
    // AI/LLM Discovery Meta Tags
    updateMetaTag('content-language', 'fr', false);
    updateMetaTag('content-region', contentRegion || 'West-Africa', false);
    
    if (aiContentType) {
      updateMetaTag('ai-content-type', aiContentType, false);
    }
    
    if (aiSummary) {
      updateMetaTag('ai-summary', aiSummary, false);
    }
    
    if (audience) {
      updateMetaTag('audience', audience, false);
    }
    
    if (aiKeywords) {
      updateMetaTag('ai-keywords', aiKeywords, false);
    }
    
    // Fund-specific meta tags
    if (aiContentType === 'fund') {
      if (fundTargetAmount !== undefined) {
        updateMetaTag('fund:target_amount', String(fundTargetAmount), false);
      }
      if (fundCurrentAmount !== undefined) {
        updateMetaTag('fund:current_amount', String(fundCurrentAmount), false);
      }
      if (fundProgress !== undefined) {
        updateMetaTag('fund:progress', String(fundProgress), false);
      }
      if (fundCurrency) {
        updateMetaTag('fund:currency', fundCurrency, false);
      }
      if (fundOccasion) {
        updateMetaTag('fund:occasion', fundOccasion, false);
      }
    }
    
    // Business-specific meta tags
    if (aiContentType === 'business-profile' || type === 'business.business') {
      if (businessProductsCount !== undefined) {
        updateMetaTag('business:products_count', String(businessProductsCount), false);
      }
      if (businessRating !== undefined) {
        updateMetaTag('business:average_rating', String(businessRating), false);
      }
      if (businessReviewCount !== undefined) {
        updateMetaTag('business:review_count', String(businessReviewCount), false);
      }
      if (businessType) {
        updateMetaTag('business:type', businessType, false);
      }
      if (businessAddress) {
        updateMetaTag('business:address', businessAddress, false);
      }
    }
    
    // AI Resource Links
    updateLinkTag('ai-resource', `${BASE_URL}/llms.txt`);
    updateLinkTag('ai-documentation', `${BASE_URL}/llms-full.txt`);
    
    // Cleanup function - reset to defaults when component unmounts
    return () => {
      document.title = `${APP_NAME} - Cadeaux Collectifs Côte d'Ivoire`;
    };
  }, [title, description, image, imageWidth, imageHeight, imageAlt, url, type, keywords, noIndex, publishedTime, twitterCreator, aiContentType, aiSummary, audience, contentRegion, aiKeywords, productPrice, productCurrency, productAvailability, productBrand, productRating, productReviewCount, fundTargetAmount, fundCurrentAmount, fundCurrency, fundProgress, fundOccasion, businessProductsCount, businessRating, businessReviewCount, businessType, businessAddress]);
  
  return null;
}

/**
 * Pre-configured SEO configurations for common pages
 */
export const SEO_CONFIGS = {
  landing: {
    title: "Cadeaux Collectifs Côte d'Ivoire & Bénin | Cagnottes Anniversaire Abidjan",
    description: "Plateforme #1 de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages, promotions. Boutiques artisanales locales à Abidjan.",
    keywords: "cadeaux Abidjan, cagnotte anniversaire Côte d'Ivoire, cadeau groupe Afrique, pot commun en ligne, cotisation cadeau collectif, financement participatif cadeau, crowdfunding anniversaire Afrique, collecte argent mariage, offrir ensemble cadeau, cagnotte sans frais, Orange Money cadeaux, artisanat ivoirien",
    aiContentType: 'landing' as AIContentType,
    aiSummary: "Plateforme collaborative de cadeaux en Afrique francophone. Cagnottes anniversaires, boutiques artisanales, paiements Mobile Money (Orange, MTN, Wave).",
    audience: 'consumers' as AIAudience,
    contentRegion: 'CI,BJ,SN,ML,TG,BF,NE',
    aiKeywords: "cadeaux collectifs, cagnotte anniversaire, artisanat africain, Mobile Money, pot commun, cotisation groupe, Abidjan, Côte d'Ivoire, Bénin, Sénégal",
  },
  shop: {
    title: "Boutique Cadeaux Abidjan - Artisanat Ivoirien & Mode Africaine",
    description: "Découvrez les meilleurs cadeaux locaux : bijoux africains, mode wax, décoration, gastronomie. Livraison rapide à Abidjan. Artisans vérifiés, paiement Mobile Money.",
    keywords: "boutique cadeaux Abidjan, artisanat Côte d'Ivoire, bijoux africains, cadeaux locaux Afrique, mode ivoirienne, panier cadeau en ligne, livraison express Abidjan, commande cadeau WhatsApp, achat Mobile Money, artisans vérifiés, cadeaux personnalisés Afrique, boubou wax",
    aiContentType: 'marketplace' as AIContentType,
    aiSummary: "Marketplace de produits artisanaux africains. Mode, bijoux, pâtisserie, fleurs. Livraison à Abidjan. Paiement Orange Money, MTN, Wave.",
    audience: 'gift-givers' as AIAudience,
    contentRegion: 'CI,BJ',
    aiKeywords: "boutique africaine, artisanat ivoirien, cadeaux locaux, mode africaine, bijoux fait-main, marketplace Afrique",
  },
  about: {
    title: "À Propos - Cadeaux Collectifs Afrique Francophone",
    description: "Notre mission : célébrer les moments de joie en Afrique francophone avec des cadeaux collaboratifs. Découvrez l'histoire de JOIE DE VIVRE, startup ivoirienne.",
    keywords: "joie de vivre application, cadeaux Afrique, startup ivoirienne, cagnottes en ligne, plateforme cadeaux africaine, fintech Afrique",
    aiContentType: 'article' as AIContentType,
    aiSummary: "Mission et fonctionnalités de JOIE DE VIVRE. Startup ivoirienne facilitant les cadeaux collaboratifs en Afrique francophone depuis Abidjan.",
    audience: 'all' as AIAudience,
    contentRegion: 'CI',
    aiKeywords: "à propos, mission, startup ivoirienne, cadeaux Afrique, histoire entreprise, première plateforme cadeaux",
  },
  faq: {
    title: "FAQ - Questions Fréquentes Cagnottes & Paiements Mobile Money",
    description: "Réponses aux questions fréquentes sur les cagnottes collectives, paiements Mobile Money (Orange, MTN, Wave), livraisons en Côte d'Ivoire, Bénin et Sénégal.",
    keywords: "FAQ cagnotte, Orange Money paiement, MTN Mobile Money, livraison Abidjan, aide cadeaux, comment créer cagnotte, pot commun en ligne, Wave paiement",
    aiContentType: 'faq' as AIContentType,
    aiSummary: "25+ réponses sur les cagnottes collectives, paiements Mobile Money (Orange, MTN, Wave), livraisons en Côte d'Ivoire, création de compte et support.",
    audience: 'all' as AIAudience,
    contentRegion: 'CI,BJ',
    aiKeywords: "aide cagnotte, FAQ cadeaux, Orange Money, MTN, Wave, livraison Abidjan, support client, questions fréquentes",
  },
  contact: {
    title: "Contactez-nous | Support Client JOIE DE VIVRE Abidjan",
    description: "Une question ? Contactez l'équipe JOIE DE VIVRE. Support client réactif à Abidjan. Aide pour cagnottes, commandes et livraisons en Côte d'Ivoire.",
    keywords: "contact joie de vivre, support client Abidjan, aide cagnotte, service client, téléphone, email, WhatsApp support",
    aiContentType: 'article' as AIContentType,
    aiSummary: "Contact support client JOIE DE VIVRE. Email: contact@joiedevivre-africa.com. Téléphone: +225 05 465 666 46. Abidjan, Côte d'Ivoire.",
    audience: 'all' as AIAudience,
  },
  home: {
    title: "Tableau de Bord | Gérez vos Cadeaux & Cagnottes",
    description: "Accédez à votre espace personnel. Gérez vos cagnottes, contacts et cadeaux collectifs. Suivez les anniversaires de vos proches.",
    keywords: "dashboard cadeaux, gestion cagnotte, anniversaires proches, espace personnel, suivi contributions",
    aiContentType: 'dashboard' as AIContentType,
    aiSummary: "Tableau de bord utilisateur pour gérer cagnottes, contacts et rappels d'anniversaires.",
    audience: 'consumers' as AIAudience,
  },
  community: {
    title: "Communauté | Célébrations et Partages en Afrique",
    description: "Rejoignez la communauté JOIE DE VIVRE. Partagez vos moments de joie, découvrez les célébrations et inspirez-vous des cadeaux offerts.",
    keywords: "communauté cadeaux, célébrations Afrique, partage joie, témoignages cagnottes, photos cadeaux",
    aiContentType: 'article' as AIContentType,
    aiSummary: "Communauté sociale pour partager célébrations, remerciements et moments de joie entre utilisateurs.",
    audience: 'consumers' as AIAudience,
  },
  giftIdeas: {
    title: "Idées Cadeaux | Inspiration Anniversaire, Mariage, Promotion",
    description: "Trouvez l'inspiration pour vos cadeaux. Suggestions personnalisées pour anniversaires, mariages, promotions en Côte d'Ivoire et Afrique francophone.",
    keywords: "idées cadeaux Abidjan, inspiration cadeau, suggestions anniversaire, quel cadeau offrir, cadeau original Afrique, idée cadeau collègue",
    aiContentType: 'article' as AIContentType,
    aiSummary: "Suggestions et idées de cadeaux pour anniversaires, mariages, promotions et occasions spéciales.",
    audience: 'gift-givers' as AIAudience,
  },
  dashboard: {
    title: "Mon Espace | Cagnottes, Contacts & Contributions",
    description: "Gérez vos cagnottes collectives, suivez les contributions et organisez les cadeaux pour vos proches.",
    keywords: "espace personnel, cagnottes, contacts anniversaires, suivi contributions, historique cadeaux",
    aiContentType: 'dashboard' as AIContentType,
    aiSummary: "Espace personnel pour gérer cagnottes, contributions et contacts.",
    audience: 'consumers' as AIAudience,
  },
  cart: {
    title: "Panier | Vos Articles Artisanaux",
    description: "Finalisez votre commande. Articles artisanaux ivoiriens prêts à être offerts. Livraison Abidjan.",
    keywords: "panier cadeaux, commande Abidjan, finaliser achat, livraison rapide",
    aiContentType: 'marketplace' as AIContentType,
    aiSummary: "Panier d'achat pour finaliser commandes de produits artisanaux.",
    audience: 'gift-givers' as AIAudience,
  },
  privacy: {
    title: "Politique de Confidentialité | Protection Données JOIE DE VIVRE",
    description: "Découvrez comment JOIE DE VIVRE protège vos données personnelles et respecte votre vie privée. Conformité RGPD.",
    keywords: "confidentialité, protection données, RGPD Afrique, vie privée, données personnelles",
    aiContentType: 'documentation' as AIContentType,
    aiSummary: "Politique de confidentialité et protection des données personnelles conforme aux standards internationaux.",
    audience: 'all' as AIAudience,
  },
  terms: {
    title: "Conditions d'Utilisation | CGU JOIE DE VIVRE",
    description: "Consultez les conditions générales d'utilisation de la plateforme JOIE DE VIVRE. Droits et obligations des utilisateurs.",
    keywords: "CGU, conditions utilisation, mentions légales, règles plateforme, droits utilisateurs",
    aiContentType: 'documentation' as AIContentType,
    aiSummary: "Conditions générales d'utilisation de la plateforme JOIE DE VIVRE.",
    audience: 'all' as AIAudience,
  },
  legal: {
    title: "Mentions Légales | AMTEY'S SARLU Côte d'Ivoire",
    description: "Informations légales sur la société JOIE DE VIVRE (AMTEY'S SARLU), éditeur du site, hébergement et contact.",
    keywords: "mentions légales, informations société, éditeur site, AMTEY'S, Abidjan",
    aiContentType: 'documentation' as AIContentType,
    aiSummary: "Mentions légales: AMTEY'S SARLU, Abidjan, Côte d'Ivoire. Éditeur et hébergeur du site joiedevivre-africa.com.",
    audience: 'all' as AIAudience,
  },
  dataDeletion: {
    title: "Suppression des Données | JOIE DE VIVRE",
    description: "Demandez la suppression de vos données personnelles sur JOIE DE VIVRE. Découvrez vos droits, les données concernées et les délais de traitement.",
    keywords: "suppression données, RGPD, droit à l'oubli, protection données personnelles, supprimer compte",
    aiContentType: 'documentation' as AIContentType,
    aiSummary: "Page de demande de suppression des données utilisateur conforme aux exigences Meta et RGPD.",
    audience: 'all' as AIAudience,
  },
  funds: {
    title: "Cagnottes Publiques - Pot Commun & Cadeaux Collectifs | JOIE DE VIVRE",
    description: "Découvrez et contribuez aux cagnottes collectives pour anniversaires, mariages, naissances et promotions. Participez à la joie de donner en groupe en Afrique.",
    keywords: "cagnotte collective, cadeau groupe, pot commun Afrique, collecte cadeau en ligne, financer ensemble, cotisation groupe cadeau, cagnotte participative, anniversaire, mariage, contribution",
    aiContentType: 'fund' as AIContentType,
    aiSummary: "Liste des cagnottes publiques pour cadeaux collectifs. Filtrable par occasion: anniversaires, mariages, naissances, diplômes, promotions.",
    audience: 'gift-givers' as AIAudience,
  },
} as const;

export default SEOHead;
