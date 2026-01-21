/**
 * Centralized types for Schema.org structured data
 */

export const SCHEMA_DOMAIN = 'https://joiedevivre-africa.com';

// ============ FAQPage Types ============
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQPageSchemaProps {
  faqs: FAQItem[];
}

// ============ BreadcrumbList Types ============
export interface BreadcrumbItem {
  name: string;
  path: string; // Relative path (e.g., '/shop', '/boutique/abc123')
}

export interface BreadcrumbListSchemaProps {
  items: BreadcrumbItem[];
}

// ============ Review Types ============
export interface ReviewItem {
  authorName: string;
  rating: number;
  reviewBody: string | null;
  datePublished: string; // ISO date string
  productName?: string;
}

export interface ReviewSchemaProps {
  reviews: ReviewItem[];
  itemReviewedType?: 'LocalBusiness' | 'Product';
  itemReviewedName: string;
}

// ============ LocalBusiness Types ============
export interface DBOpeningHours {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
}

export interface OpeningHoursSpec {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string;
  opens: string;
  closes: string;
}

export interface LocalBusinessSchemaProps {
  id: string;
  name: string;
  description: string;
  image?: string;
  telephone?: string;
  email?: string;
  address?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  priceRange?: string;
  openingHours?: DBOpeningHours | null;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  hasOfferCatalog?: {
    name: string;
    numberOfItems: number;
  };
  reviews?: ReviewItem[];
  websiteUrl?: string;
  additionalType?: string;
}

// ============ Product Types ============
export interface ProductShippingDetails {
  deliveryTime: string;           // Ex: "1-3 jours"
  shippingCost: number;           // Montant en devise locale
  shippingCurrency?: string;      // Défaut: XOF
}

export interface ProductReturnPolicy {
  returnPolicyCategory: 'MerchantReturnFiniteReturnWindow' | 'MerchantReturnNotPermitted';
  returnDays?: number;            // Nombre de jours pour retour
}

export interface ProductSchemaProps {
  id: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
  brand?: string;
  seller?: {
    name: string;
    url: string;
  };
  category?: string;
  sku?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  reviews?: ReviewItem[];
  // Nouvelles propriétés pour Rich Results optimisés
  itemCondition?: 'NewCondition' | 'UsedCondition' | 'RefurbishedCondition';
  gtin?: string;                  // Code-barres (si disponible)
  mpn?: string;                   // Numéro fabricant
  priceValidUntil?: string;       // Date ISO 8601
  returnPolicy?: ProductReturnPolicy;
  shippingDetails?: ProductShippingDetails;
}

// ============ Organization Types (NEW) ============
export interface OrganizationSchemaProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  socialLinks?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

// ============ WebSite Types (NEW) ============
export interface WebSiteSchemaProps {
  name: string;
  url: string;
  description: string;
  searchUrl?: string;
}

// ============ Event Types (Enriched for Cagnottes) ============
export interface EventSchemaProps {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  image?: string;
  organizer?: {
    name: string;
    url?: string;
  };
  eventStatus?: 'EventScheduled' | 'EventCancelled' | 'EventPostponed' | 'EventCompleted';
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
  // Cagnotte-specific properties
  offers?: {
    price: number;
    priceCurrency: string;
    availability?: 'InStock' | 'SoldOut';
  };
  about?: {
    name: string;
    type?: 'Person' | 'Organization';
  };
  isAccessibleForFree?: boolean;
  virtualLocation?: string;
}

// ============ HowTo Types (NEW) ============
export interface HowToStep {
  name: string;           // Titre court de l'étape
  text: string;           // Description détaillée
  image?: string;         // Image illustrative (optionnel)
  url?: string;           // Lien vers section spécifique
}

export interface HowToSupply {
  name: string;           // Nom du matériel/prérequis
}

export interface HowToTool {
  name: string;           // Nom de l'outil nécessaire
}

export interface HowToSchemaProps {
  id: string;                    // Identifiant unique
  name: string;                  // Titre du guide
  description: string;           // Description courte
  steps: HowToStep[];            // Étapes du guide
  image?: string;                // Image principale
  estimatedCost?: {              // Coût estimé (optionnel)
    value: number;
    currency: string;
  };
  totalTime?: string;            // Durée ISO 8601 (ex: "PT15M")
  supply?: HowToSupply[];        // Matériels nécessaires
  tool?: HowToTool[];            // Outils nécessaires
}

// ============ Article Types (NEW) ============
export interface ArticleAuthor {
  name: string;
  url?: string;
  image?: string;
}

export interface ArticleSchemaProps {
  id: string;                          // Identifiant unique (slug)
  type?: 'Article' | 'BlogPosting' | 'NewsArticle';  // Type d'article
  headline: string;                    // Titre de l'article (max 110 caractères)
  description: string;                 // Résumé (meta description)
  image: string;                       // Image principale
  images?: string[];                   // Images additionnelles
  datePublished: string;               // Date de publication ISO 8601
  dateModified?: string;               // Date de modification ISO 8601
  author: ArticleAuthor;               // Auteur de l'article
  publisher?: {                        // Organisation (défaut: JOIE DE VIVRE)
    name: string;
    logo: string;
  };
  articleSection?: string;             // Catégorie (ex: "Guides", "Actualités")
  keywords?: string[];                 // Mots-clés SEO
  wordCount?: number;                  // Nombre de mots
  inLanguage?: string;                 // Langue (défaut: "fr")
  isAccessibleForFree?: boolean;       // Contenu gratuit
  mainEntityOfPage?: string;           // URL canonique
}

// ============ Video Types (NEW) ============
export interface VideoSchemaProps {
  id: string;                          // Identifiant unique (slug ou product ID)
  name: string;                        // Titre de la vidéo
  description: string;                 // Description
  thumbnailUrl: string;                // Image de prévisualisation (REQUIS par Google)
  uploadDate: string;                  // Date de publication ISO 8601
  contentUrl?: string;                 // URL directe du fichier vidéo
  embedUrl?: string;                   // URL d'embed (YouTube/Vimeo)
  duration?: string;                   // Durée ISO 8601 (ex: "PT1M30S" = 1min30)
  expires?: string;                    // Date d'expiration (optionnel)
  hasPart?: VideoClip[];               // Chapitres/segments (Seek to actions)
  interactionStatistic?: {             // Statistiques d'engagement
    viewCount?: number;
    likeCount?: number;
  };
  regionsAllowed?: string[];           // Codes pays où la vidéo est disponible
  publisher?: {                        // Éditeur (défaut: JOIE DE VIVRE)
    name: string;
    logo: string;
  };
  inLanguage?: string;                 // Langue (défaut: "fr")
  isFamilyFriendly?: boolean;          // Contenu familial
}

export interface VideoClip {
  name: string;                        // Nom du chapitre
  startOffset: number;                 // Début en secondes
  endOffset: number;                   // Fin en secondes
  url?: string;                        // URL avec timestamp
}
