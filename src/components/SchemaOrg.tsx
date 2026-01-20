import { useEffect } from 'react';
import { 
  formatOpeningHoursForSchema, 
  getCityFromCountryCode, 
  getCountryFromCode,
  type OpeningHoursSpec,
  type DBOpeningHours 
} from '@/utils/schemaHelpers';
import { formatReviewsForSchema, type ReviewItem } from '@/components/schema/ReviewSchema';
const DOMAIN = 'https://joiedevivre-africa.com';

// ============================================
// LocalBusiness Schema Component
// ============================================

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
}

export function LocalBusinessSchema({
  id,
  name,
  description,
  image,
  telephone,
  email,
  address,
  countryCode = 'CI',
  latitude,
  longitude,
  priceRange = '$$',
  openingHours,
  aggregateRating,
  hasOfferCatalog,
  reviews,
}: LocalBusinessSchemaProps) {
  const url = `${DOMAIN}/boutique/${id}`;
  const city = getCityFromCountryCode(countryCode);
  const country = getCountryFromCode(countryCode);
  const formattedHours = formatOpeningHoursForSchema(openingHours);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name,
    description,
    url,
    priceRange,
    paymentAccepted: 'Mobile Money, Orange Money, MTN, Wave',
    currenciesAccepted: 'XOF',
  };

  // Add image if provided
  if (image) {
    schema.image = image;
  }

  // Add contact info
  if (telephone) {
    schema.telephone = telephone;
  }
  if (email) {
    schema.email = email;
  }

  // Add address
  schema.address = {
    '@type': 'PostalAddress',
    streetAddress: address || city,
    addressLocality: city,
    addressCountry: countryCode,
  };

  // Add geo coordinates if available
  if (latitude && longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    };
  }

  // Add opening hours if available
  if (formattedHours && formattedHours.length > 0) {
    schema.openingHoursSpecification = formattedHours;
  }

  // Add aggregate rating if available
  if (aggregateRating && aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add offer catalog if available
  if (hasOfferCatalog && hasOfferCatalog.numberOfItems > 0) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: hasOfferCatalog.name,
      numberOfItems: hasOfferCatalog.numberOfItems,
    };
  }

  // Add individual reviews if available
  if (reviews && reviews.length > 0) {
    const formattedReviews = formatReviewsForSchema(reviews);
    if (formattedReviews.length > 0) {
      schema.review = formattedReviews;
    }
  }

  // Add area served (all supported countries)
  schema.areaServed = [
    { '@type': 'Country', name: "Côte d'Ivoire" },
    { '@type': 'Country', name: 'Bénin' },
    { '@type': 'Country', name: 'Sénégal' },
    { '@type': 'Country', name: 'Mali' },
    { '@type': 'Country', name: 'Togo' },
    { '@type': 'Country', name: 'Burkina Faso' },
    { '@type': 'Country', name: 'Niger' },
  ];

  useEffect(() => {
    const scriptId = `schema-local-business-${id}`;
    
    // Remove existing script if any
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create and inject new script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [id, name, description, image, telephone, email, address, countryCode, latitude, longitude, priceRange, aggregateRating?.ratingValue, aggregateRating?.reviewCount, hasOfferCatalog?.numberOfItems]);

  return null;
}

// ============================================
// Product Schema Component (enhanced)
// ============================================

export interface ProductSchemaProps {
  id: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock';
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
}

export function ProductSchema({
  id,
  name,
  description,
  image,
  images,
  price,
  currency = 'XOF',
  availability = 'InStock',
  brand,
  seller,
  category,
  sku,
  aggregateRating,
  reviews,
}: ProductSchemaProps) {
  const url = `${DOMAIN}/p/${id}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name,
    description,
    url,
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  };

  // Add images (array if multiple, single if one)
  if (images && images.length > 1) {
    schema.image = images;
  } else {
    schema.image = image;
  }

  // Add SKU
  if (sku) {
    schema.sku = sku;
  }

  // Add category
  if (category) {
    schema.category = category;
  }

  // Add brand
  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: brand,
    };
  }

  // Add seller
  if (seller) {
    (schema.offers as Record<string, unknown>).seller = {
      '@type': 'Organization',
      name: seller.name,
      url: seller.url,
    };
  }

  // Add aggregate rating
  if (aggregateRating && aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add individual reviews
  if (reviews && reviews.length > 0) {
    const formattedReviews = formatReviewsForSchema(reviews);
    if (formattedReviews.length > 0) {
      schema.review = formattedReviews;
    }
  }

  useEffect(() => {
    const scriptId = `schema-product-${id}`;
    
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [id, name, description, image, images, price, currency, availability, brand, seller, category, sku, aggregateRating?.ratingValue, aggregateRating?.reviewCount, reviews]);

  return null;
}
