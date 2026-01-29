import { type OrganizationSchemaProps, type WebSiteSchemaProps } from '@/components/schema/types';

const DOMAIN = 'https://joiedevivre-africa.com';

export const organizationData: OrganizationSchemaProps = {
  name: 'JOIE DE VIVRE',
  url: DOMAIN,
  logo: `${DOMAIN}/logo-jv.png`,
  description: "Plateforme #1 de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages et promotions avec vos proches.",
  socialLinks: [
    'https://web.facebook.com/profile.php?id=61579100215241',
    'https://www.tiktok.com/@joiedevivre_46',
    'https://wa.me/22546566646',
  ],
  contactEmail: 'contact@joiedevivre-africa.com',
  contactPhone: '+225 05 46 56 6646',
};

export const websiteData: WebSiteSchemaProps = {
  name: 'JOIE DE VIVRE - Cadeaux Collectifs Afrique',
  url: DOMAIN,
  description: "Plateforme collaborative de cadeaux en Afrique francophone. Cagnottes anniversaires, boutiques artisanales, paiements Mobile Money.",
  searchUrl: `${DOMAIN}/shop`,
};

/**
 * Enhanced Organization Schema for Google Knowledge Graph
 * Provides rich structured data for brand recognition
 */
export const enhancedOrganizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "Corporation"],
  "@id": `${DOMAIN}/#organization`,
  "name": "Joie de Vivre",
  "legalName": "AMTEY'S SARLU",
  "alternateName": ["JDV", "JDV Africa", "Joie de Vivre Africa", "JOIE DE VIVRE"],
  "url": DOMAIN,
  "logo": `${DOMAIN}/logo-jv.png`,
  "description": "Première plateforme de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes gratuites pour anniversaires, mariages et occasions spéciales. Mission : renforcer les liens familiaux et amicaux à travers la générosité collective.",
  "slogan": "La joie d'offrir ensemble",
  "foundingDate": "2024",
  "foundingLocation": {
    "@type": "Place",
    "name": "Abidjan, Côte d'Ivoire",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Abidjan",
      "addressCountry": "CI"
    }
  },
  "knowsAbout": [
    "Cadeaux collaboratifs",
    "Cagnottes en ligne",
    "E-commerce Afrique",
    "Mobile Money",
    "Artisanat africain",
    "Pot commun anniversaire",
    "Financement participatif cadeaux",
    "Renforcement des liens familiaux",
    "Amélioration des relations amicales",
    "Générosité collaborative",
    "Bien-être relationnel",
    "Célébrations collectives Afrique",
    "Marketplace e-commerce artisanal",
    "Vente en ligne artisanat africain",
    "Créer boutique en ligne Afrique"
  ],
  "areaServed": [
    { "@type": "Country", "name": "Côte d'Ivoire" },
    { "@type": "Country", "name": "Bénin" },
    { "@type": "Country", "name": "Sénégal" },
    { "@type": "Country", "name": "Mali" },
    { "@type": "Country", "name": "Togo" },
    { "@type": "Country", "name": "Burkina Faso" },
    { "@type": "Country", "name": "Niger" }
  ],
  "sameAs": [
    "https://web.facebook.com/profile.php?id=61579100215241",
    "https://www.tiktok.com/@joiedevivre_46",
    "https://wa.me/22546566646"
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+225 05 46 56 6646",
      "contactType": "customer service",
      "availableLanguage": ["French"],
      "areaServed": ["CI", "BJ", "SN"]
    }
  ],
  "email": "contact@joiedevivre-africa.com",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "234",
    "bestRating": "5",
    "worstRating": "1"
  },
  "potentialAction": [
    {
      "@type": "RegisterAction",
      "target": `${DOMAIN}/auth?tab=signup`,
      "name": "Créer un compte gratuit sur JDV"
    },
    {
      "@type": "SearchAction",
      "target": `${DOMAIN}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  ]
};
