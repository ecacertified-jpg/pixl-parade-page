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
  HowToSchema,
  ArticleSchema,
  VideoSchema,
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
  HowToSchemaProps,
  HowToStep,
  HowToSupply,
  HowToTool,
  ArticleAuthor,
  ArticleSchemaProps,
  VideoSchemaProps,
  VideoClip,
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
  getEventTypeFromOccasion,
  getEventStatusFromFundStatus,
  formatDurationISO8601,
  getEmbedUrlForSchema,
  SUPPORTED_COUNTRIES,
} from './helpers';
