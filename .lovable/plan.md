

# Corriger l'affichage du drapeau pays sur les boutiques

## Probleme identifie

La boutique "Ese Shop" est situee a Cotonou (Benin) mais affiche le drapeau de Cote d'Ivoire. Deux causes :

1. **Donnees incorrectes en base** : Le profil de l'utilisateur proprietaire (Esenam, telephone `+2290143716729`) a `country_code = 'CI'` au lieu de `'BJ'`. Le business a herite de cette mauvaise valeur.
2. **Fallback par defaut dans le code** : Dans `useVendorProducts.ts` ligne 90, le code fait `businessData.country_code || 'CI'`, ce qui met Cote d'Ivoire par defaut pour toute boutique sans pays.

## Solution

### 1. Correction des donnees existantes (SQL a executer)

Mettre a jour le profil et la boutique concernes, ainsi que tout autre profil/business avec un numero beninois mais un mauvais `country_code` :

```sql
-- Corriger les profils avec numero beninois
UPDATE profiles 
SET country_code = 'BJ' 
WHERE phone LIKE '+229%' AND country_code != 'BJ';

-- Corriger les profils avec numero senegalais
UPDATE profiles 
SET country_code = 'SN' 
WHERE phone LIKE '+221%' AND country_code != 'SN';

-- Propager aux business_accounts
UPDATE business_accounts ba
SET country_code = p.country_code
FROM profiles p
WHERE ba.user_id = p.user_id
AND ba.country_code != p.country_code;
```

### 2. Correction du code - Fichier `src/hooks/useVendorProducts.ts`

Ligne 90 : remplacer le fallback aveugle `|| 'CI'` par une detection intelligente basee sur l'adresse de la boutique :

```typescript
// Avant
countryCode: businessData.country_code || 'CI',

// Apres - deduire le pays depuis l'adresse si country_code est null
countryCode: businessData.country_code || inferCountryFromAddress(businessData.address) || 'CI',
```

Ajouter une fonction utilitaire simple en haut du fichier :

```typescript
function inferCountryFromAddress(address: string | null): string | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  // Villes du Benin
  if (['cotonou', 'porto-novo', 'parakou', 'bohicon', 'abomey'].some(c => lower.includes(c))) return 'BJ';
  // Villes du Senegal
  if (['dakar', 'thies', 'kaolack', 'saint-louis', 'ziguinchor'].some(c => lower.includes(c))) return 'SN';
  // Villes de Cote d'Ivoire
  if (['abidjan', 'bouake', 'yamoussoukro', 'korhogo', 'daloa'].some(c => lower.includes(c))) return 'CI';
  return null;
}
```

### Impact

- Un fichier code modifie : `src/hooks/useVendorProducts.ts`
- Requetes SQL de correction des donnees existantes
- Toutes les boutiques afficheront le bon drapeau immediatement apres la correction des donnees, et le fallback intelligent evitera ce probleme pour les futurs cas ou `country_code` serait null

