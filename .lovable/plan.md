
# Optimiser le chargement de la page Shop avec TanStack Query

## Probleme identifie

La page `Shop.tsx` declenche **5+ requetes Supabase** au montage sans cache ni deduplication :

| Source | Requetes |
|--------|:--------:|
| `loadProducts()` | 3 (products + business_accounts + product_ratings en parallele) |
| `loadPopularShops()` | 3 (business_public_info + products + product_ratings) |
| `useFavorites()` | 1 (deja migre vers TanStack Query) |
| Shop search (debounced) | 2-3 par recherche |
| Canal Realtime `products-changes` | 1 subscription |

**Total : ~6 requetes au montage + 1 canal Realtime**, sans cache. Chaque navigation vers /shop relance tout.

## Solution

Extraire la logique de chargement dans deux hooks TanStack Query dedies, puis simplifier `Shop.tsx`.

### Etape 1 : Creer `src/hooks/useShopProducts.ts`

Nouveau hook qui encapsule `loadProducts()` avec `useQuery` :
- **Query key** : `['shop-products']`
- **staleTime** : `30000` (30 secondes)
- **queryFn** : la logique actuelle de `loadProducts()` (fetch products, business_accounts, ratings en parallele, puis formatage)
- Retourne les produits formates, sans gestion de geolocation (celle-ci reste locale dans Shop.tsx via `useMemo`)
- Le canal Realtime declenche `queryClient.invalidateQueries` au lieu de manipuler le state directement

### Etape 2 : Creer `src/hooks/usePopularShops.ts`

Nouveau hook qui encapsule `loadPopularShops()` avec `useQuery` :
- **Query key** : `['popular-shops']`
- **staleTime** : `60000` (60 secondes, change rarement)
- **queryFn** : la logique actuelle (fetch businesses, product counts, ratings, tri par popularite)

### Etape 3 : Simplifier `Shop.tsx`

- Remplacer `loadProducts()` et son `useEffect` par `useShopProducts()`
- Remplacer `loadPopularShops()` et son state par `usePopularShops()`
- Supprimer les `useState` pour `products`, `popularShops`, `isInitialLoading`
- Garder la logique de tri par distance via `useMemo` applique sur les donnees du cache
- Deplacer le canal Realtime dans `useShopProducts` avec invalidation du cache

## Resultat attendu

```text
Avant :
  Navigation vers /shop -> 6 requetes a chaque fois (~1-2s)

Apres :
  Premier chargement -> 6 requetes (identique)
  Navigations suivantes dans les 30s -> 0 requetes (instantane depuis le cache)
  Retour au shop apres >30s -> refetch en arriere-plan (donnees affichees immediatement)
```

## Fichiers

1. **Nouveau** : `src/hooks/useShopProducts.ts` -- hook TanStack Query pour les produits
2. **Nouveau** : `src/hooks/usePopularShops.ts` -- hook TanStack Query pour les boutiques populaires
3. **Modifie** : `src/pages/Shop.tsx` -- remplacement des fetches manuels par les nouveaux hooks
