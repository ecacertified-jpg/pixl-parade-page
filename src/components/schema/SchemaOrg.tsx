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
  getEmbedUrlForSchema,
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
  type ArticleSchemaProps,
  type VideoSchemaProps,
} from './types';
import { organizationData } from '@/data/brand-schema';

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
  itemCondition = 'NewCondition',
  gtin,
  mpn,
  priceValidUntil,
  returnPolicy,
  shippingDetails,
}: ProductSchemaProps) {
  const schema = useMemo(() => {
    const url = `${SCHEMA_DOMAIN}/p/${id}`;
    
    // Calculate default priceValidUntil (30 days from now)
    const defaultPriceValidUntil = new Date();
    defaultPriceValidUntil.setDate(defaultPriceValidUntil.getDate() + 30);

    const offersObj: Record<string, unknown> = {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      priceValidUntil: priceValidUntil || defaultPriceValidUntil.toISOString().split('T')[0],
      url,
    };

    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': url,
      name,
      description,
      url,
      itemCondition: `https://schema.org/${itemCondition}`,
      offers: offersObj,
    };

    // Add images (array if multiple, single if one)
    if (images && images.length > 1) {
      schemaObj.image = images;
    } else {
      schemaObj.image = image;
    }

    if (sku) schemaObj.sku = sku;
    if (category) schemaObj.category = category;
    if (gtin) schemaObj.gtin = gtin;
    if (mpn) schemaObj.mpn = mpn;

    if (brand) {
      schemaObj.brand = {
        '@type': 'Brand',
        name: brand,
      };
    }

    if (seller) {
      offersObj.seller = {
        '@type': 'Organization',
        name: seller.name,
        url: seller.url,
      };
    }

    // Add shipping details for Rich Results
    if (shippingDetails) {
      offersObj.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'CI',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shippingDetails.shippingCost.toString(),
          currency: shippingDetails.shippingCurrency || 'XOF',
        },
      };
    }

    // Add return policy for Rich Results
    if (returnPolicy) {
      offersObj.hasMerchantReturnPolicy = {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: `https://schema.org/${returnPolicy.returnPolicyCategory}`,
        ...(returnPolicy.returnDays && {
          merchantReturnDays: returnPolicy.returnDays,
        }),
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
  }, [id, name, description, image, images, price, currency, availability, brand, seller, category, sku, aggregateRating, reviews, itemCondition, gtin, mpn, priceValidUntil, returnPolicy, shippingDetails]);

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

// ============================================
// Article Schema Component (for Blog/Guides)
// ============================================

export function ArticleSchema({
  id,
  type = 'BlogPosting',
  headline,
  description,
  image,
  images,
  datePublished,
  dateModified,
  author,
  publisher,
  articleSection,
  keywords,
  wordCount,
  inLanguage = 'fr',
  isAccessibleForFree = true,
  mainEntityOfPage,
}: ArticleSchemaProps) {
  const schema = useMemo(() => {
    const url = mainEntityOfPage || `${SCHEMA_DOMAIN}/blog/${id}`;
    
    // Default publisher = JOIE DE VIVRE
    const publisherData = publisher || {
      name: organizationData.name,
      logo: organizationData.logo,
    };

    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': type,
      '@id': url,
      headline,
      description,
      url,
      datePublished,
      inLanguage,
      isAccessibleForFree,
      
      // Author
      author: {
        '@type': 'Person',
        name: author.name,
        ...(author.url && { url: author.url }),
        ...(author.image && { image: author.image }),
      },
      
      // Publisher (Organization)
      publisher: {
        '@type': 'Organization',
        name: publisherData.name,
        logo: {
          '@type': 'ImageObject',
          url: publisherData.logo,
        },
      },
      
      // Main entity
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    };

    // Image(s)
    if (images && images.length > 1) {
      schemaObj.image = images;
    } else {
      schemaObj.image = image;
    }

    // Optional fields
    if (dateModified) schemaObj.dateModified = dateModified;
    if (articleSection) schemaObj.articleSection = articleSection;
    if (keywords && keywords.length > 0) schemaObj.keywords = keywords.join(', ');
    if (wordCount) schemaObj.wordCount = wordCount;

    return schemaObj;
  }, [id, type, headline, description, image, images, datePublished, dateModified, author, publisher, articleSection, keywords, wordCount, inLanguage, isAccessibleForFree, mainEntityOfPage]);

  useSchemaInjector(`article-${id}`, schema);
  return null;
}

// ============================================
// Video Schema Component (for Rich Snippets vidéo)
// ============================================

export function VideoSchema({
  id,
  name,
  description,
  thumbnailUrl,
  uploadDate,
  contentUrl,
  embedUrl,
  duration,
  expires,
  hasPart,
  interactionStatistic,
  regionsAllowed,
  publisher,
  inLanguage = 'fr',
  isFamilyFriendly = true,
}: VideoSchemaProps) {
  const schema = useMemo(() => {
    const url = `${SCHEMA_DOMAIN}/video/${id}`;
    
    // Default publisher = JOIE DE VIVRE
    const publisherData = publisher || {
      name: organizationData.name,
      logo: organizationData.logo,
    };

    const schemaObj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      '@id': url,
      name,
      description,
      thumbnailUrl,
      uploadDate,
      inLanguage,
      isFamilyFriendly,
      
      // Publisher
      publisher: {
        '@type': 'Organization',
        name: publisherData.name,
        logo: {
          '@type': 'ImageObject',
          url: publisherData.logo,
        },
      },
    };

    // Content URLs (at least one required)
    if (contentUrl) schemaObj.contentUrl = contentUrl;
    if (embedUrl) {
      schemaObj.embedUrl = embedUrl;
    } else if (contentUrl) {
      // Try to generate embed URL from content URL
      const generatedEmbed = getEmbedUrlForSchema(contentUrl);
      if (generatedEmbed) schemaObj.embedUrl = generatedEmbed;
    }

    // Duration (format ISO 8601)
    if (duration) schemaObj.duration = duration;

    // Expiration
    if (expires) schemaObj.expires = expires;

    // Video chapters (Seek to action)
    if (hasPart && hasPart.length > 0) {
      schemaObj.hasPart = hasPart.map((clip, index) => ({
        '@type': 'Clip',
        name: clip.name,
        startOffset: clip.startOffset,
        endOffset: clip.endOffset,
        position: index + 1,
        ...(clip.url && { url: clip.url }),
      }));
    }

    // Engagement statistics
    if (interactionStatistic) {
      const stats: Record<string, unknown>[] = [];
      
      if (interactionStatistic.viewCount !== undefined) {
        stats.push({
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'WatchAction' },
          userInteractionCount: interactionStatistic.viewCount,
        });
      }
      
      if (interactionStatistic.likeCount !== undefined) {
        stats.push({
          '@type': 'InteractionCounter',
          interactionType: { '@type': 'LikeAction' },
          userInteractionCount: interactionStatistic.likeCount,
        });
      }
      
      if (stats.length > 0) schemaObj.interactionStatistic = stats;
    }

    // Regions allowed
    if (regionsAllowed && regionsAllowed.length > 0) {
      schemaObj.regionsAllowed = regionsAllowed;
    }

    return schemaObj;
  }, [id, name, description, thumbnailUrl, uploadDate, contentUrl, embedUrl, duration, expires, hasPart, interactionStatistic, regionsAllowed, publisher, inLanguage, isFamilyFriendly]);

  useSchemaInjector(`video-${id}`, schema);
  return null;
}
