/**
 * Helper functions for Schema.org structured data formatting
 */

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

export interface OpeningHoursSpec {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string;
  opens: string;
  closes: string;
}

export interface DBOpeningHours {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
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
