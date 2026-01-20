/**
 * Unified Schema.org components for SEO structured data
 * All components use the generic useSchemaInjector hook
 */

import { useMemo } from 'react';
import { useSchemaInjector } from './useSchemaInjector';
import {
  formatReviewsForSchema,
  formatOpeningHoursForSchema,
  getCityFromCountryCode,
  getCountryFromCode,
  getSchemaBusinessType,
  SUPPORTED_COUNTRIES,
} from './helpers';
import {
  SCHEMA_DOMAIN,
  type FAQPageSchemaProps,
  type BreadcrumbListSchemaProps,
  type LocalBusinessSchemaProps,
  type ProductSchemaProps,
  type OrganizationSchemaProps,
  type WebSiteSchemaProps,
  type EventSchemaProps,
  type ReviewSchemaProps,
  type HowToSchemaProps,
} from './types';

// ============================================
// FAQPage Schema Component
// ============================================

export function FAQPageSchema({ faqs }: FAQPageSchemaProps) {
  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }), [faqs]);

  useSchemaInjector('faq-page', schema);
  return null;
}

// ============================================
// BreadcrumbList Schema Component
// ============================================

export function BreadcrumbListSchema({ items }: BreadcrumbListSchemaProps) {
  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SCHEMA_DOMAIN}${item.path}`,
    })),
  }), [items]);

  useSchemaInjector('breadcrumb-list', schema);
  return null;
}

// ============================================
// LocalBusiness Schema Component
// ============================================

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
  websiteUrl,
  additionalType,
}: LocalBusinessSchemaProps) {
  const schema = useMemo(() => {
    const url = `${SCHEMA_DOMAIN}/boutique/${id}`;
    const city = getCityFromCountryCode(countryCode);
    const formattedHours = formatOpeningHoursForSchema(openingHours);
    const schemaType = additionalType || 'LocalBusiness';

    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      '@id': url,
      name,
      description,
      url,
      priceRange,
      paymentAccepted: 'Mobile Money, Orange Money, MTN, Wave',
      currenciesAccepted: 'XOF',
    };

    // Add official website link
    if (websiteUrl) {
      schemaObj.sameAs = [websiteUrl];
    }

    if (image) schemaObj.image = image;
    if (telephone) schemaObj.telephone = telephone;
    if (email) schemaObj.email = email;

    schemaObj.address = {
      '@type': 'PostalAddress',
      streetAddress: address || city,
      addressLocality: city,
      addressCountry: countryCode,
    };

    if (latitude && longitude) {
      schemaObj.geo = {
        '@type': 'GeoCoordinates',
        latitude,
        longitude,
      };
    }

    if (formattedHours && formattedHours.length > 0) {
      schemaObj.openingHoursSpecification = formattedHours;
    }

    if (aggregateRating && aggregateRating.reviewCount > 0) {
      schemaObj.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toFixed(1),
        reviewCount: aggregateRating.reviewCount,
        bestRating: '5',
        worstRating: '1',
      };
    }

    if (hasOfferCatalog && hasOfferCatalog.numberOfItems > 0) {
      schemaObj.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: hasOfferCatalog.name,
        numberOfItems: hasOfferCatalog.numberOfItems,
      };
    }

    if (reviews && reviews.length > 0) {
      const formattedReviews = formatReviewsForSchema(reviews);
      if (formattedReviews.length > 0) {
        schemaObj.review = formattedReviews;
      }
    }

    schemaObj.areaServed = SUPPORTED_COUNTRIES;

    return schemaObj;
  }, [id, name, description, image, telephone, email, address, countryCode, latitude, longitude, priceRange, openingHours, aggregateRating, hasOfferCatalog, reviews, websiteUrl, additionalType]);

  useSchemaInjector(`local-business-${id}`, schema);
  return null;
}

// ============================================
// Product Schema Component
// ============================================

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
  const schema = useMemo(() => {
    const url = `${SCHEMA_DOMAIN}/p/${id}`;

    const schemaObj: Record<string, unknown> = {
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
      schemaObj.image = images;
    } else {
      schemaObj.image = image;
    }

    if (sku) schemaObj.sku = sku;
    if (category) schemaObj.category = category;

    if (brand) {
      schemaObj.brand = {
        '@type': 'Brand',
        name: brand,
      };
    }

    if (seller) {
      (schemaObj.offers as Record<string, unknown>).seller = {
        '@type': 'Organization',
        name: seller.name,
        url: seller.url,
      };
    }

    if (aggregateRating && aggregateRating.reviewCount > 0) {
      schemaObj.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toFixed(1),
        reviewCount: aggregateRating.reviewCount,
        bestRating: '5',
        worstRating: '1',
      };
    }

    if (reviews && reviews.length > 0) {
      const formattedReviews = formatReviewsForSchema(reviews);
      if (formattedReviews.length > 0) {
        schemaObj.review = formattedReviews;
      }
    }

    return schemaObj;
  }, [id, name, description, image, images, price, currency, availability, brand, seller, category, sku, aggregateRating, reviews]);

  useSchemaInjector(`product-${id}`, schema);
  return null;
}

// ============================================
// Review Schema Component (Standalone)
// ============================================

export function ReviewSchema({ reviews, itemReviewedType = 'LocalBusiness', itemReviewedName }: ReviewSchemaProps) {
  const schema = useMemo(() => {
    const formattedReviews = formatReviewsForSchema(reviews);
    if (formattedReviews.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': itemReviewedType,
      name: itemReviewedName,
      review: formattedReviews,
    };
  }, [reviews, itemReviewedType, itemReviewedName]);

  useSchemaInjector('reviews', schema);
  return null;
}

// ============================================
// Organization Schema Component (NEW)
// ============================================

export function OrganizationSchema({
  name,
  url,
  logo,
  description,
  socialLinks,
  contactEmail,
  contactPhone,
}: OrganizationSchemaProps) {
  const schema = useMemo(() => {
    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      url,
      logo,
      description,
    };

    if (socialLinks && socialLinks.length > 0) {
      schemaObj.sameAs = socialLinks;
    }

    if (contactEmail || contactPhone) {
      schemaObj.contactPoint = {
        '@type': 'ContactPoint',
        ...(contactEmail && { email: contactEmail }),
        ...(contactPhone && { telephone: contactPhone }),
        contactType: 'customer service',
        availableLanguage: 'French',
      };
    }

    return schemaObj;
  }, [name, url, logo, description, socialLinks, contactEmail, contactPhone]);

  useSchemaInjector('organization', schema);
  return null;
}

// ============================================
// WebSite Schema Component (NEW)
// ============================================

export function WebSiteSchema({
  name,
  url,
  description,
  searchUrl,
}: WebSiteSchemaProps) {
  const schema = useMemo(() => {
    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      url,
      description,
    };

    if (searchUrl) {
      schemaObj.potentialAction = {
        '@type': 'SearchAction',
        target: `${searchUrl}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      };
    }

    return schemaObj;
  }, [name, url, description, searchUrl]);

  useSchemaInjector('website', schema);
  return null;
}

// ============================================
// Event Schema Component (Enriched for Cagnottes)
// ============================================

export function EventSchema({
  id,
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  organizer,
  eventStatus = 'EventScheduled',
  eventAttendanceMode = 'OnlineEventAttendanceMode',
  offers,
  about,
  isAccessibleForFree = false,
  virtualLocation,
}: EventSchemaProps) {
  const schema = useMemo(() => {
    const url = `${SCHEMA_DOMAIN}/cagnotte/${id}`;

    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      '@id': url,
      name,
      description,
      url,
      startDate,
      eventStatus: `https://schema.org/${eventStatus}`,
      eventAttendanceMode: `https://schema.org/${eventAttendanceMode}`,
      isAccessibleForFree,
    };

    if (endDate) schemaObj.endDate = endDate;
    if (image) schemaObj.image = image;

    // Virtual location for online events (cagnottes)
    if (virtualLocation || eventAttendanceMode === 'OnlineEventAttendanceMode') {
      schemaObj.location = {
        '@type': 'VirtualLocation',
        url: virtualLocation || url,
      };
    } else if (location) {
      schemaObj.location = {
        '@type': 'Place',
        name: location,
        address: {
          '@type': 'PostalAddress',
          addressLocality: location,
        },
      };
    }

    // Organizer
    if (organizer) {
      schemaObj.organizer = {
        '@type': 'Person',
        name: organizer.name,
        ...(organizer.url && { url: organizer.url }),
      };
    }

    // Offer (target amount for cagnotte)
    if (offers) {
      schemaObj.offers = {
        '@type': 'Offer',
        price: offers.price.toString(),
        priceCurrency: offers.priceCurrency,
        availability: `https://schema.org/${offers.availability || 'InStock'}`,
        url,
      };
    }

    // Beneficiary (about)
    if (about) {
      schemaObj.about = {
        '@type': about.type || 'Person',
        name: about.name,
      };
    }

    return schemaObj;
  }, [id, name, description, startDate, endDate, location, image, organizer, eventStatus, eventAttendanceMode, offers, about, isAccessibleForFree, virtualLocation]);

  useSchemaInjector(`event-${id}`, schema);
  return null;
}

// ============================================
// HowTo Schema Component (NEW)
// ============================================

export function HowToSchema({
  id,
  name,
  description,
  steps,
  image,
  estimatedCost,
  totalTime,
  supply,
  tool,
}: HowToSchemaProps) {
  const schema = useMemo(() => {
    const url = `${SCHEMA_DOMAIN}/guides/${id}`;

    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      '@id': url,
      name,
      description,
      url,
      step: steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        ...(step.image && { image: step.image }),
        ...(step.url && { url: step.url }),
      })),
    };

    if (image) schemaObj.image = image;
    if (totalTime) schemaObj.totalTime = totalTime;

    if (estimatedCost) {
      schemaObj.estimatedCost = {
        '@type': 'MonetaryAmount',
        value: estimatedCost.value.toString(),
        currency: estimatedCost.currency,
      };
    }

    if (supply && supply.length > 0) {
      schemaObj.supply = supply.map(s => ({
        '@type': 'HowToSupply',
        name: s.name,
      }));
    }

    if (tool && tool.length > 0) {
      schemaObj.tool = tool.map(t => ({
        '@type': 'HowToTool',
        name: t.name,
      }));
    }

    return schemaObj;
  }, [id, name, description, steps, image, estimatedCost, totalTime, supply, tool]);

  useSchemaInjector(`howto-${id}`, schema);
  return null;
}
