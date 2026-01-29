import { useSchemaInjector } from './useSchemaInjector';

const DOMAIN = 'https://joiedevivre-africa.com';

export interface SoftwareApplicationSchemaProps {
  variant: 'customer' | 'business';
}

/**
 * Schema.org SoftwareApplication/WebApplication for registration pages
 * Improves visibility in searches like "créer compte cagnotte", "inscription gratuite", "devenir vendeur"
 */
export function SoftwareApplicationSchema({ variant }: SoftwareApplicationSchemaProps) {
  const isCustomer = variant === 'customer';
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${DOMAIN}/#${isCustomer ? 'CustomerApp' : 'VendorApp'}`,
    "name": "Joie de Vivre",
    "alternateName": isCustomer ? "JDV - Cagnottes Collectives" : "JDV - Espace Vendeurs",
    "applicationCategory": isCustomer ? "ShoppingApplication" : "BusinessApplication",
    "applicationSubCategory": isCustomer ? "Gift Pooling" : "Marketplace Management",
    "operatingSystem": "Web, Android, iOS",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "2.0",
    "inLanguage": "fr",
    "isAccessibleForFree": true,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "XOF",
      "description": isCustomer 
        ? "Inscription gratuite, création de cagnottes sans frais"
        : "Création de boutique gratuite, commission uniquement sur les ventes"
    },
    "featureList": isCustomer ? [
      "Création de cagnottes collectives",
      "Rappels d'anniversaires automatiques",
      "Paiement Orange Money, MTN, Wave",
      "Boutiques artisanales africaines",
      "Cagnottes surprises avec révélation programmée",
      "Partage facile via WhatsApp"
    ] : [
      "Création de boutique en ligne gratuite",
      "Dashboard de gestion des commandes",
      "Notifications de nouvelles commandes",
      "Statistiques de ventes en temps réel",
      "Paiement sécurisé via Mobile Money",
      "Visibilité auprès de milliers d'acheteurs"
    ],
    "screenshot": `${DOMAIN}/og-image.png`,
    "author": {
      "@type": "Organization",
      "name": "AMTEY'S SARLU",
      "url": DOMAIN
    },
    "potentialAction": {
      "@type": "RegisterAction",
      "target": isCustomer 
        ? `${DOMAIN}/auth?tab=signup`
        : `${DOMAIN}/business-auth`,
      "name": isCustomer ? "Créer un compte gratuit" : "Créer ma boutique gratuite"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": isCustomer ? "234" : "45",
      "bestRating": "5"
    },
    "areaServed": [
      { "@type": "Country", "name": "Côte d'Ivoire" },
      { "@type": "Country", "name": "Bénin" },
      { "@type": "Country", "name": "Sénégal" }
    ]
  };

  useSchemaInjector(`software-app-${variant}`, schema);

  return null;
}

/**
 * Speakable Schema for voice search optimization (Google Assistant, Siri)
 * Add this to pages with content suitable for voice answers
 */
export interface SpeakableSchemaProps {
  /** CSS selectors of speakable content sections */
  cssSelectors: string[];
  /** Page name for identification */
  pageName: string;
}

export function SpeakableSchema({ cssSelectors, pageName }: SpeakableSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${DOMAIN}/#${pageName}`,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": cssSelectors
    }
  };

  useSchemaInjector(`speakable-${pageName}`, schema);

  return null;
}

/**
 * RegisterAction Schema - specifically for signup CTAs
 */
export interface RegisterActionSchemaProps {
  variant: 'customer' | 'business';
  occasionType?: string;
  sectorType?: string;
}

export function RegisterActionSchema({ variant, occasionType, sectorType }: RegisterActionSchemaProps) {
  const isCustomer = variant === 'customer';
  
  let targetUrl = isCustomer ? `${DOMAIN}/auth?tab=signup` : `${DOMAIN}/business-auth`;
  
  if (occasionType) {
    targetUrl += `&redirect=create-fund&occasion=${occasionType}`;
  }
  if (sectorType) {
    targetUrl += `?sector=${sectorType}`;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "RegisterAction",
    "agent": {
      "@type": "Organization",
      "name": "Joie de Vivre"
    },
    "object": {
      "@type": isCustomer ? "WebApplication" : "BusinessApplication",
      "name": isCustomer ? "Compte Client Joie de Vivre" : "Compte Vendeur Joie de Vivre"
    },
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": targetUrl,
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform"
      ]
    },
    "name": isCustomer ? "Créer un compte client" : "Créer une boutique vendeur",
    "description": isCustomer
      ? "Inscrivez-vous gratuitement pour créer des cagnottes collectives et offrir des cadeaux"
      : "Créez votre boutique en ligne pour vendre vos produits artisanaux"
  };

  useSchemaInjector(`register-action-${variant}`, schema);

  return null;
}
