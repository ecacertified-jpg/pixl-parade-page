

# Plan : Corriger le filtre Tech — produits tronqués par la limite de 200

## Problème

Le catalogue récupère les 200 produits les plus récents (`ORDER BY created_at DESC LIMIT 200`). Il y a 219 produits actifs en CI, donc les 19 plus anciens sont exclus. Les 6 produits tech sur 7 ont été créés en janvier (les plus anciens) et sont coupés par cette limite. Seul le Samsung S25 Ultra (février) apparaît.

## Solution

Supprimer la limite de 200 ou l'augmenter significativement (ex: 1000). Avec 219 produits en CI, il n'y a aucun risque de performance à tout charger.

## Changement — `src/pages/WishlistCatalog.tsx`

Ligne 54 : remplacer `.limit(200)` par `.limit(1000)` pour s'assurer que tous les produits du pays sont récupérés, quel que soit leur date de création.

```typescript
// Avant
.limit(200)

// Après
.limit(1000)
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/WishlistCatalog.tsx` | Augmenter la limite de 200 à 1000 |

