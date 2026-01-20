/**
 * Helper functions for Schema.org structured data formatting
 */

import type { ReviewItem, DBOpeningHours, OpeningHoursSpec } from './types';

// Day mapping from French to English for Schema.org
const DAY_MAPPING: Record<string, string> = {
  lundi: 'Monday',
  mardi: 'Tuesday',
  mercredi: 'Wednesday',
  jeudi: 'Thursday',
  vendredi: 'Friday',
  samedi: 'Saturday',
  dimanche: 'Sunday',
};

/**
 * Anonymize author name: "Koffi Atta" -> "Koffi A."
 */
export function anonymizeAuthorName(fullName: string): string {
  if (!fullName) return 'Utilisateur';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Format date to ISO format for Schema.org
 */
export function formatDateForSchema(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return dateString;
  }
}

/**
 * Generates an array of Review schema objects for embedding in LocalBusiness or Product schemas.
 */
export function formatReviewsForSchema(reviews: ReviewItem[]): Record<string, unknown>[] {
  return reviews
    .filter(review => review.reviewBody) // Only include reviews with text
    .slice(0, 5) // Limit to 5 reviews
    .map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: anonymizeAuthorName(review.authorName),
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: review.reviewBody,
      datePublished: formatDateForSchema(review.datePublished),
      ...(review.productName && {
        itemReviewed: {
          '@type': 'Product',
          name: review.productName,
        },
      }),
    }));
}

/**
 * Convert database opening hours format to Schema.org OpeningHoursSpecification
 */
export function formatOpeningHoursForSchema(
  openingHours: DBOpeningHours | null | undefined
): OpeningHoursSpec[] | undefined {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    return undefined;
  }

  const specs: OpeningHoursSpec[] = [];

  for (const [frenchDay, hours] of Object.entries(openingHours)) {
    const englishDay = DAY_MAPPING[frenchDay.toLowerCase()];
    if (!englishDay) continue;

    // Skip closed days
    if (hours.closed === true || !hours.open || !hours.close) continue;

    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: englishDay,
      opens: hours.open,
      closes: hours.close,
    });
  }

  return specs.length > 0 ? specs : undefined;
}

/**
 * Get city name from country code
 */
export function getCityFromCountryCode(countryCode: string | undefined): string {
  const cityMapping: Record<string, string> = {
    CI: 'Abidjan',
    BJ: 'Cotonou',
    SN: 'Dakar',
    ML: 'Bamako',
    TG: 'Lomé',
    BF: 'Ouagadougou',
    NE: 'Niamey',
  };
  return cityMapping[countryCode || 'CI'] || 'Abidjan';
}

/**
 * Get country name from country code
 */
export function getCountryFromCode(countryCode: string | undefined): string {
  const countryMapping: Record<string, string> = {
    CI: "Côte d'Ivoire",
    BJ: 'Bénin',
    SN: 'Sénégal',
    ML: 'Mali',
    TG: 'Togo',
    BF: 'Burkina Faso',
    NE: 'Niger',
  };
  return countryMapping[countryCode || 'CI'] || "Côte d'Ivoire";
}

/**
 * Truncate text to a maximum length for captions
 */
export function truncateForCaption(text: string | undefined, maxLength: number = 150): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Supported countries for area served
 */
export const SUPPORTED_COUNTRIES = [
  { '@type': 'Country', name: "Côte d'Ivoire" },
  { '@type': 'Country', name: 'Bénin' },
  { '@type': 'Country', name: 'Sénégal' },
  { '@type': 'Country', name: 'Mali' },
  { '@type': 'Country', name: 'Togo' },
  { '@type': 'Country', name: 'Burkina Faso' },
  { '@type': 'Country', name: 'Niger' },
];

/**
 * Map fund occasion to human-readable event type (French)
 */
export function getEventTypeFromOccasion(occasion: string | null | undefined): string {
  const occasionMap: Record<string, string> = {
    birthday: "Fête d'anniversaire",
    wedding: 'Mariage',
    graduation: 'Remise de diplôme',
    baby: 'Baby shower',
    retirement: 'Départ à la retraite',
    promotion: 'Célébration de promotion',
    other: 'Événement cadeau',
  };
  return occasionMap[occasion || 'other'] || occasionMap.other;
}

/**
 * Get event status from fund status
 */
/**
 * Map French business types to Schema.org LocalBusiness subtypes
 */
export const BUSINESS_TYPE_MAPPING: Record<string, string> = {
  'Pâtisserie': 'Bakery',
  'Boulangerie': 'Bakery',
  'Restaurant': 'Restaurant',
  'Café': 'CafeOrCoffeeShop',
  'Traiteur': 'FoodEstablishment',
  'Fleuriste': 'Florist',
  'Bijouterie': 'JewelryStore',
  'Mode': 'ClothingStore',
  'Chaussures': 'ShoeStore',
  'Décoration': 'HomeGoodsStore',
  'Alimentation': 'GroceryStore',
  'Spa': 'HealthAndBeautyBusiness',
  'Coiffure': 'HairSalon',
  'Beauté': 'BeautySalon',
  'Électronique': 'ElectronicsStore',
  'Librairie': 'BookStore',
  'Jouets': 'ToyStore',
  'Sport': 'SportingGoodsStore',
};

/**
 * Get Schema.org business type from French business type
 */
export function getSchemaBusinessType(businessType: string | null): string {
  if (!businessType) return 'LocalBusiness';
  
  // Exact match
  if (BUSINESS_TYPE_MAPPING[businessType]) {
    return BUSINESS_TYPE_MAPPING[businessType];
  }
  
  // Partial match (case insensitive)
  const lowerType = businessType.toLowerCase();
  for (const [key, value] of Object.entries(BUSINESS_TYPE_MAPPING)) {
    if (lowerType.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return 'LocalBusiness';
}

export function getEventStatusFromFundStatus(
  status: string | null | undefined
): 'EventScheduled' | 'EventCompleted' | 'EventCancelled' {
  switch (status) {
    case 'completed':
      return 'EventCompleted';
    case 'expired':
    case 'cancelled':
      return 'EventCancelled';
    default:
      return 'EventScheduled';
  }
}

/**
 * Convertit une durée en secondes vers le format ISO 8601
 * @param seconds - Durée en secondes
 * @returns Format ISO 8601 (ex: "PT1M30S")
 */
export function formatDurationISO8601(seconds: number): string {
  if (seconds <= 0) return 'PT0S';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let duration = 'PT';
  if (hours > 0) duration += `${hours}H`;
  if (minutes > 0) duration += `${minutes}M`;
  if (secs > 0 || duration === 'PT') duration += `${secs}S`;
  
  return duration;
}

/**
 * Génère l'URL d'embed pour YouTube ou Vimeo
 * @param url - URL de la vidéo
 * @returns URL d'embed ou undefined
 */
export function getEmbedUrlForSchema(url: string): string | undefined {
  if (!url) return undefined;
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  
  return undefined;
}
