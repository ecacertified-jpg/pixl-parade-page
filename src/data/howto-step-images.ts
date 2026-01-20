/**
 * Images for HowTo guide steps
 * Used in Schema.org HowTo structured data for SEO Rich Snippets
 */

import step1Inscription from '@/assets/howto/step-1-inscription.png';
import step2CreationCagnotte from '@/assets/howto/step-2-creation-cagnotte.png';
import step3InvitationProches from '@/assets/howto/step-3-invitation-proches.png';
import step4Contributions from '@/assets/howto/step-4-contributions.png';
import step5OffrirCadeau from '@/assets/howto/step-5-offrir-cadeau.png';

import { SCHEMA_DOMAIN } from '@/components/schema/types';

/**
 * HowTo step images as ES6 imports
 * These are used directly in components
 */
export const HOWTO_STEP_IMAGES = {
  inscription: step1Inscription,
  creationCagnotte: step2CreationCagnotte,
  invitationProches: step3InvitationProches,
  contributions: step4Contributions,
  offrirCadeau: step5OffrirCadeau,
} as const;

/**
 * Get absolute URL for HowTo step image (for Schema.org)
 * Schema.org requires absolute URLs for images
 */
export function getHowToStepImageAbsoluteUrl(imagePath: string): string {
  // In production, images are served from the root
  // Extract the filename from the bundled path and construct absolute URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  // For bundled assets, use the domain + path
  return `${SCHEMA_DOMAIN}${imagePath}`;
}

export type HowToStepImageKey = keyof typeof HOWTO_STEP_IMAGES;
