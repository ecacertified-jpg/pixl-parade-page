## Objectif
Utiliser `https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/` comme **unique** lien Wave pour tous les paiements (abonnements, premium célébrations, cagnottes, etc.), avec montant pré-rempli quand connu.

## Constat
Plusieurs constructions de liens Wave coexistent :
- ✅ `src/components/WavePaymentRedirect.tsx` : utilise déjà le bon lien marchand.
- ❌ `supabase/functions/create-wave-subscription/index.ts` : construit `https://pay.wave.com/?recipient=<phone>&amount=...` à partir de `platform_wave_phone` (setting admin).
- ❌ `src/hooks/useCelebrationPremium.ts` : `SUPPORT_WAVE_LINK` est un placeholder bidon (`Mer8ZpZpQZpQZ`).
- ℹ️ `src/pages/FundPreview.tsx` : lien générique `https://pay.wave.com/` sans marchand.

## Changements

### 1. Centraliser le lien
Créer `src/lib/waveConfig.ts` :
```ts
export const WAVE_MERCHANT_URL = "https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/";
export function buildWaveMerchantLink(amount?: number) {
  return amount && amount > 0
    ? `${WAVE_MERCHANT_URL}?amount=${Math.round(amount)}`
    : WAVE_MERCHANT_URL;
}
```
Faire pointer `WavePaymentRedirect.tsx` dessus (suppression de la constante locale).

### 2. Abonnements (edge function)
Dans `supabase/functions/create-wave-subscription/index.ts` :
- Remplacer `buildWaveLink(recipient, amount)` par un lien marchand fixe :
  `https://pay.wave.com/m/M_ci_u0CaFw3Aj1Mt/c/ci/?amount=<amount_xof>`
- Garder la lecture de `platform_wave_phone` uniquement comme info de référence (ou la retirer si plus utile), mais le lien renvoyé au front utilise le marchand.

### 3. Premium célébrations
Dans `src/hooks/useCelebrationPremium.ts` :
- Remplacer `SUPPORT_WAVE_LINK` placeholder par le lien marchand officiel.
- `buildWaveLink(amount, reference)` devient :
  `${WAVE_MERCHANT_URL}?amount=${amount}` (Wave marchand ne propage pas de `ref` custom ; on garde la référence côté DB via `celebration_premium_orders.id` déjà inséré avant redirection).

### 4. FundPreview
Remplacer `https://pay.wave.com/` par `WAVE_MERCHANT_URL` (sans montant car contribution libre).

## Hors périmètre
- Les champs `wave_merchant_phone` des comptes business (lien Wave propre au vendeur) restent inchangés — ce sont les liens marchands des prestataires, pas la plateforme.
- L'UI admin "platform_wave_phone" reste (utilisé pour les payouts/splits internes), mais n'est plus utilisé pour générer le lien de paiement client.
