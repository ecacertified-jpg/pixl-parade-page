import { useEffect } from 'react';

export interface ReviewItem {
  authorName: string;
  rating: number;
  reviewBody: string | null;
  datePublished: string; // ISO date string
  productName?: string;
}

export interface ReviewSchemaProps {
  reviews: ReviewItem[];
  itemReviewedType?: 'LocalBusiness' | 'Product';
  itemReviewedName: string;
}

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
function formatDateForSchema(dateString: string): string {
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
 * Standalone Review Schema component (for cases where reviews need their own script tag).
 */
export function ReviewSchema({ reviews, itemReviewedType = 'LocalBusiness', itemReviewedName }: ReviewSchemaProps) {
  const formattedReviews = formatReviewsForSchema(reviews);

  useEffect(() => {
    if (formattedReviews.length === 0) return;

    const scriptId = 'schema-reviews';

    // Remove existing script if any
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create schema with reviews
    const schema = {
      '@context': 'https://schema.org',
      '@type': itemReviewedType,
      name: itemReviewedName,
      review: formattedReviews,
    };

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
  }, [formattedReviews, itemReviewedType, itemReviewedName]);

  return null;
}
