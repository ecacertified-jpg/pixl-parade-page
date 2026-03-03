

# Optimiser le chargement des favoris

## Probleme

Le hook `useFavorites` utilise `useState`/`useEffect` bruts sans cache. Il est appele dans 11 composants differents (Dashboard, Shop, WishlistCatalog, Favorites, CategoryPage, VendorShop, etc.), et chaque instance declenche sa propre requete Supabase independante. Cela cause :
- Des requetes reseau dupliquees (meme donnees chargees plusieurs fois)
- Un appel supplementaire a `supabase.auth.getUser()` a chaque chargement
- Un rechargement complet apres chaque mutation (add, remove, update)

## Solution

Migrer `useFavorites` vers **TanStack Query** (deja installe dans le projet) pour beneficier de :
- **Deduplication automatique** : un seul fetch partage entre tous les composants
- **Cache de 30 secondes** (staleTime) pour eviter les re-fetches inutiles
- **Invalidation ciblee** apres les mutations au lieu de tout recharger
- **Mises a jour optimistes** pour les actions rapides (ajouter/supprimer un favori)

## Changements techniques

### Fichier : `src/hooks/useFavorites.ts`

1. Remplacer `useState`/`useEffect` par `useQuery` pour le chargement des favoris
2. Utiliser `useMutation` + `queryClient.invalidateQueries` pour les mutations (add, remove, update)
3. Ajouter un `staleTime` de 30 secondes pour eviter les requetes repetees
4. Calculer les stats directement depuis les donnees du cache (pas de state separe)
5. Supprimer l'appel `supabase.auth.getUser()` dans chaque mutation en utilisant le user du contexte auth existant

```text
Avant (architecture actuelle):
+------------------+    +------------------+    +------------------+
| Dashboard        |    | Shop             |    | WishlistCatalog  |
| useFavorites()   |    | useFavorites()   |    | useFavorites()   |
|   -> fetch #1    |    |   -> fetch #2    |    |   -> fetch #3    |
+------------------+    +------------------+    +------------------+

Apres (avec TanStack Query):
+------------------+    +------------------+    +------------------+
| Dashboard        |    | Shop             |    | WishlistCatalog  |
| useFavorites()   |    | useFavorites()   |    | useFavorites()   |
+--------+---------+    +--------+---------+    +--------+---------+
         |                       |                       |
         +----------+------------+-----------+-----------+
                    |                        |
              useQuery('favorites')     (cache partage)
                    |
              1 seul fetch Supabase
```

### Approche detaillee

- **Query key** : `['favorites', userId]` pour isoler par utilisateur
- **staleTime** : 30 secondes -- les donnees sont considerees fraiches pendant 30s
- **Mutations** : chaque mutation (addFavorite, removeFavorite, updatePriority, etc.) utilise `queryClient.invalidateQueries({ queryKey: ['favorites'] })` pour rafraichir le cache apres modification
- **Stats calculees** : les stats (total, urgent, estimatedBudget) sont derivees avec `useMemo` depuis les donnees du cache, pas de state separee
- L'interface publique du hook (noms de fonctions, types) reste identique pour eviter de modifier les 11 fichiers consommateurs

### Resume

- 1 fichier modifie : `src/hooks/useFavorites.ts`
- Aucun changement dans les composants consommateurs (API identique)
- Aucun changement de base de donnees

