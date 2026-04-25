# Plan — Empty state intelligent du catalogue de souhaits

## Objectif

Quand aucun article n'est trouvé sur `/wishlist-catalog`, aider l'utilisateur à rebondir au lieu d'afficher un simple message statique :

1. **Réinitialiser automatiquement le filtre de goût** quand il est responsable du vide (résultats existants côté serveur mais filtrés à zéro côté client).
2. **Proposer des suggestions de recherche concrètes** quand la recherche elle-même ne renvoie rien.

## Comportement attendu

Trois scénarios distincts :

### A. Filtre de goût trop restrictif (auto-reset)
- Condition : `products.length > 0` mais `filteredProducts.length === 0` ET `selectedTaste !== 'tous'`.
- Action : afficher un bandeau discret « Aucun article dans **Mode** — affichage de tous les articles » + bouton « Annuler » et auto-bascule vers `tous` après ~1.5 s (ou immédiatement, voir détails techniques).
- Justification : l'utilisateur cherche « robe » → trouve des résultats, mais son filtre « Tech » les masque tous. On déverrouille au lieu de montrer un cul-de-sac.

### B. Recherche sans résultat (suggestions)
- Condition : `isSearching === true` et `products.length === 0`.
- Affichage :
  - Icône + « Aucun article pour "robe" »
  - Sous-titre : « Essayez une recherche plus courte ou l'une de ces idées »
  - **Chips de suggestions cliquables** (4–6 termes populaires) : `robe`, `chemise`, `parfum`, `bijoux`, `gâteau`, `chaussures`. Au clic → remplit la barre de recherche.
  - Bouton secondaire « Effacer la recherche » → reset `searchQuery`.
  - Si un filtre de goût est actif : ligne supplémentaire « Filtre actif : **Mode** » + bouton « Retirer le filtre ».

### C. Catalogue vide pour le pays (cas rare)
- Condition : pas de recherche, pas de filtre, et `products.length === 0`.
- Garder le message actuel mais avec invitation à changer de pays via le `CountrySelector` déjà présent en haut.

## Détails techniques

**Fichier modifié** : `src/pages/WishlistCatalog.tsx` uniquement.

1. **Auto-reset du filtre (scénario A)** via `useEffect` :
   ```
   useEffect(() => {
     if (!loading && products.length > 0 && filteredProducts.length === 0 && selectedTaste !== 'tous') {
       setSelectedTaste('tous');
       toast.info(`Aucun article dans cette catégorie — affichage de tous les articles`);
     }
   }, [loading, products.length, filteredProducts.length, selectedTaste]);
   ```
   Toast via `sonner` (déjà utilisé dans le projet) pour signaler le changement sans bloquer le flux.

2. **Suggestions de recherche** : constante locale `SEARCH_SUGGESTIONS = ['robe', 'chemise', 'parfum', 'bijoux', 'gâteau', 'chaussures']`. Rendues comme `Badge` cliquables qui appellent `setSearchQuery(suggestion)`.

3. **Empty state restructuré** : un seul bloc `else if (filteredProducts.length === 0)` qui branche sur les trois scénarios via des conditions claires sur `isSearching` et `selectedTaste`.

4. **Pas de changement de hooks ni de DB**. Pas d'impact sur les performances (cartes mémoïsées déjà en place).

## Fichiers touchés

- `src/pages/WishlistCatalog.tsx` (logique empty state + auto-reset + suggestions)
