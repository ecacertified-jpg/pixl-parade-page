

# Fix: Fallback géolocalisation → pays d'origine au lieu de CI

## Problème

Ligne 253 de `Shop.tsx`, quand la géolocalisation échoue, le fallback est hardcodé à `'CI'` :
```typescript
const activeCountryFilter = effectiveCountryFilter ?? (userLocation ? null : 'CI');
```

Un utilisateur béninois sans géolocalisation voit uniquement les produits CI au lieu des produits BJ.

## Correction

Dans `src/pages/Shop.tsx` :
1. Importer `profileCountryCode` depuis `useCountry()` (déjà disponible dans le contexte)
2. Remplacer le fallback `'CI'` par `profileCountryCode || 'CI'` — utilise le pays d'origine de l'utilisateur, avec CI en dernier recours pour les non-connectés

```typescript
const { effectiveCountryFilter, profileCountryCode } = useCountry();
// ...
const activeCountryFilter = effectiveCountryFilter ?? (userLocation ? null : (profileCountryCode || 'CI'));
```

Un seul fichier modifié, une seule ligne changée.

