import { useCallback, useMemo } from 'react';
import {
  PRODUCT_TEMPLATES,
  FUND_TEMPLATES,
  OCCASION_TEMPLATES,
  generatePost,
  buildHashtags,
  getOccasionEmoji,
  type PostTemplate,
  type HashtagCategory,
} from '@/data/social-media-content';

interface ProductData {
  name: string;
  price: number;
  currency: string;
  city?: string;
  category?: string;
  url: string;
}

interface FundData {
  beneficiary: string;
  occasion: string;
  target: number;
  current: number;
  currency: string;
  deadline?: string;
  url: string;
}

type Platform = 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'sms' | 'email';

export function useSocialPost() {
  /**
   * Génère un post pour un produit
   */
  const generateProductPost = useCallback((
    templateId: string,
    product: ProductData,
    platform: Platform = 'instagram'
  ): string => {
    const template = PRODUCT_TEMPLATES.find(t => t.id === templateId) || PRODUCT_TEMPLATES[0];
    
    const variables: Record<string, string> = {
      product_name: product.name,
      price: product.price.toLocaleString('fr-FR'),
      currency: product.currency || 'XOF',
      city: product.city || 'Abidjan',
      url: product.url,
    };
    
    return generatePost(template, variables, {
      platform,
      includeHashtags: true,
      city: product.city,
      productCategory: product.category,
    });
  }, []);

  /**
   * Génère un post pour une cagnotte
   */
  const generateFundPost = useCallback((
    templateId: string,
    fund: FundData,
    platform: Platform = 'instagram'
  ): string => {
    const template = FUND_TEMPLATES.find(t => t.id === templateId) || FUND_TEMPLATES[0];
    
    const occasionEmoji = getOccasionEmoji(fund.occasion);
    const remaining = fund.target - fund.current;
    const percent = Math.round((fund.current / fund.target) * 100);
    
    const variables: Record<string, string> = {
      beneficiary: fund.beneficiary,
      occasion: fund.occasion,
      occasion_emoji: occasionEmoji,
      target: fund.target.toLocaleString('fr-FR'),
      current: fund.current.toLocaleString('fr-FR'),
      remaining: remaining.toLocaleString('fr-FR'),
      currency: fund.currency || 'XOF',
      percent: percent.toString(),
      deadline: fund.deadline || '',
      url: fund.url,
    };
    
    return generatePost(template, variables, {
      platform,
      includeHashtags: true,
    });
  }, []);

  /**
   * Génère un post pour une occasion spécifique
   */
  const generateOccasionPost = useCallback((
    occasion: string,
    variables: Record<string, string>,
    platform: Platform = 'instagram'
  ): string => {
    const template = OCCASION_TEMPLATES[occasion];
    if (!template) {
      return '';
    }
    
    return generatePost(template, variables, {
      platform,
      includeHashtags: true,
    });
  }, []);

  /**
   * Génère les hashtags pour un contexte donné
   */
  const getHashtags = useCallback((
    categories: HashtagCategory[],
    options?: {
      limit?: number;
      platform?: Platform;
      city?: string;
      productCategory?: string;
    }
  ): string => {
    return buildHashtags(categories, {
      limit: options?.limit,
      platform: options?.platform as 'instagram' | 'twitter' | 'facebook' | 'whatsapp',
      includeCity: options?.city,
      includeCategory: options?.productCategory,
    });
  }, []);

  /**
   * Liste des templates disponibles pour les produits
   */
  const productTemplates = useMemo(() => PRODUCT_TEMPLATES, []);

  /**
   * Liste des templates disponibles pour les cagnottes
   */
  const fundTemplates = useMemo(() => FUND_TEMPLATES, []);

  /**
   * Copie le texte dans le presse-papier
   */
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    generateProductPost,
    generateFundPost,
    generateOccasionPost,
    getHashtags,
    productTemplates,
    fundTemplates,
    copyToClipboard,
  };
}
