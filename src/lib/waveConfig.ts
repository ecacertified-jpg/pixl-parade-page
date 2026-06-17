export const WAVE_MERCHANT_URL = "https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/";

/**
 * Build a Wave payment link to the official JDV merchant.
 * If an amount is provided, it is pre-filled on the Wave page.
 */
export function buildWaveMerchantLink(amount?: number): string {
  if (amount && amount > 0) {
    return `${WAVE_MERCHANT_URL}?amount=${Math.round(amount)}`;
  }
  return WAVE_MERCHANT_URL;
}