/**
 * Centralized article data for SEO structured data
 * Used with ArticleSchema component for Rich Snippets
 */

import { type ArticleSchemaProps, type ArticleAuthor } from '@/components/schema/types';

// Default author for platform guides
export const DEFAULT_AUTHOR: ArticleAuthor = {
  name: 'Équipe JOIE DE VIVRE',
  url: 'https://joiedevivre-africa.com/a-propos',
};

// Article metadata for existing and future content
export const articlesData: Record<string, Omit<ArticleSchemaProps, 'id'>> = {
  'guide-cagnotte-collective': {
    type: 'BlogPosting',
    headline: 'Comment créer une cagnotte collective en Afrique',
    description: 'Guide complet pour organiser une cagnotte entre amis ou famille. Créez, partagez et collectez facilement avec JOIE DE VIVRE.',
    image: 'https://joiedevivre-africa.com/images/guide-cagnotte.png',
    datePublished: '2024-06-01T10:00:00+00:00',
    dateModified: '2025-01-15T08:30:00+00:00',
    author: DEFAULT_AUTHOR,
    articleSection: 'Guides',
    keywords: ['cagnotte', 'cadeau collectif', 'anniversaire', 'Afrique', 'Mobile Money'],
    wordCount: 1200,
  },
  'guide-cadeau-anniversaire': {
    type: 'BlogPosting',
    headline: 'Idées cadeaux anniversaire en Côte d\'Ivoire',
    description: 'Découvrez les meilleures idées de cadeaux pour un anniversaire réussi à Abidjan et partout en Côte d\'Ivoire.',
    image: 'https://joiedevivre-africa.com/images/guide-anniversaire.png',
    datePublished: '2024-07-15T10:00:00+00:00',
    author: DEFAULT_AUTHOR,
    articleSection: 'Idées cadeaux',
    keywords: ['anniversaire', 'cadeaux', 'Côte d\'Ivoire', 'Abidjan', 'idées'],
    wordCount: 900,
  },
  'guide-devenir-vendeur': {
    type: 'BlogPosting',
    headline: 'Comment devenir vendeur sur JOIE DE VIVRE',
    description: 'Guide pour les artisans et boutiques souhaitant vendre leurs produits sur notre marketplace de cadeaux en Afrique.',
    image: 'https://joiedevivre-africa.com/images/guide-vendeur.png',
    datePublished: '2024-08-01T10:00:00+00:00',
    author: DEFAULT_AUTHOR,
    articleSection: 'Vendeurs',
    keywords: ['vendeur', 'marketplace', 'artisan', 'boutique', 'Afrique'],
    wordCount: 1500,
  },
  'guide-mobile-money': {
    type: 'BlogPosting',
    headline: 'Payer par Mobile Money sur JOIE DE VIVRE',
    description: 'Comment utiliser Orange Money, MTN Money et Wave pour contribuer à une cagnotte ou acheter un cadeau.',
    image: 'https://joiedevivre-africa.com/images/guide-mobile-money.png',
    datePublished: '2024-09-01T10:00:00+00:00',
    author: DEFAULT_AUTHOR,
    articleSection: 'Guides',
    keywords: ['Mobile Money', 'Orange Money', 'MTN', 'Wave', 'paiement', 'Afrique'],
    wordCount: 800,
  },
  'guide-mariage-cagnotte': {
    type: 'BlogPosting',
    headline: 'Organiser une cagnotte mariage en Afrique',
    description: 'Guide complet pour créer une cagnotte de mariage et collecter les contributions de vos invités facilement.',
    image: 'https://joiedevivre-africa.com/images/guide-mariage.png',
    datePublished: '2024-10-01T10:00:00+00:00',
    author: DEFAULT_AUTHOR,
    articleSection: 'Guides',
    keywords: ['mariage', 'cagnotte', 'cadeau collectif', 'Afrique', 'célébration'],
    wordCount: 1100,
  },
};

/**
 * Get article data by ID
 */
export function getArticleData(id: string): ArticleSchemaProps | null {
  const article = articlesData[id];
  if (!article) return null;
  return { id, ...article };
}

/**
 * Get all articles for sitemap generation
 */
export function getAllArticles(): ArticleSchemaProps[] {
  return Object.entries(articlesData).map(([id, data]) => ({ id, ...data }));
}
