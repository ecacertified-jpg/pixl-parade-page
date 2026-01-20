/**
 * Country flag emoji helper
 * Maps ISO 3166-1 alpha-2 country codes to flag emojis
 */

const FLAGS: Record<string, string> = {
  CI: '🇨🇮', // Côte d'Ivoire
  BJ: '🇧🇯', // Bénin
  SN: '🇸🇳', // Sénégal
  ML: '🇲🇱', // Mali
  BF: '🇧🇫', // Burkina Faso
  TG: '🇹🇬', // Togo
  GN: '🇬🇳', // Guinée
  NE: '🇳🇪', // Niger
  CM: '🇨🇲', // Cameroun
  GA: '🇬🇦', // Gabon
};

/**
 * Get the flag emoji for a given country code
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., 'CI', 'BJ', 'SN')
 * @returns Flag emoji or globe emoji if country not found
 */
export function getCountryFlag(countryCode: string): string {
  return FLAGS[countryCode?.toUpperCase()] || '🌍';
}

/**
 * Get all available country flags
 * @returns Record of country codes to flag emojis
 */
export function getAllCountryFlags(): Record<string, string> {
  return { ...FLAGS };
}
