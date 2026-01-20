/**
 * Schema.org Structured Data Module
 * Centralized exports for SEO JSON-LD components
 */

// Generic hook for custom schemas
export { useSchemaInjector } from './useSchemaInjector';

// Schema components
export {
  FAQPageSchema,
  BreadcrumbListSchema,
  LocalBusinessSchema,
  ProductSchema,
  ReviewSchema,
  OrganizationSchema,
  WebSiteSchema,
  EventSchema,
} from './SchemaOrg';

// Types
export type {
  FAQItem,
  FAQPageSchemaProps,
  BreadcrumbItem,
  BreadcrumbListSchemaProps,
  ReviewItem,
  ReviewSchemaProps,
  LocalBusinessSchemaProps,
  ProductSchemaProps,
  OrganizationSchemaProps,
  WebSiteSchemaProps,
  EventSchemaProps,
  DBOpeningHours,
  OpeningHoursSpec,
} from './types';

export { SCHEMA_DOMAIN } from './types';

// Helpers
export {
  anonymizeAuthorName,
  formatDateForSchema,
  formatReviewsForSchema,
  formatOpeningHoursForSchema,
  getCityFromCountryCode,
  getCountryFromCode,
  truncateForCaption,
  SUPPORTED_COUNTRIES,
} from './helpers';
