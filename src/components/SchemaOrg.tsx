import { useEffect } from 'react';
import { 
  formatOpeningHoursForSchema, 
  getCityFromCountryCode, 
  getCountryFromCode,
  type OpeningHoursSpec,
  type DBOpeningHours 
} from '@/utils/schemaHelpers';

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
// Product Schema Component (for future use)
// ============================================

export interface ProductSchemaProps {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock';
  brand?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function ProductSchema({
  id,
  name,
  description,
  image,
  price,
  currency = 'XOF',
  availability = 'InStock',
  brand,
  aggregateRating,
}: ProductSchemaProps) {
  const url = `${DOMAIN}/p/${id}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name,
    description,
    image,
    url,
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  };

  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: brand,
    };
  }

  if (aggregateRating && aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue.toFixed(1),
      reviewCount: aggregateRating.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
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
  }, [id, name, description, image, price, currency, availability, brand, aggregateRating?.ratingValue, aggregateRating?.reviewCount]);

  return null;
}
