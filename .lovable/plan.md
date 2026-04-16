

# Plan : Correction du filtrage des produits par catégorie + carte cliquable pour les favoris

## Problème 1 : Produits affichés ne correspondent pas à la catégorie sélectionnée

Dans l'étape 3 (Souhaits), le filtre `category_name` utilise `.in('category_name', tasteCategoryNames)`. Si aucun produit en base n'a exactement `category_name = 'Tech & Électronique'` ou `'Affaires & Bureau'`, la requête retourne 0 résultats... mais le code ne fait pas de fallback. Il est probable que les produits affichés proviennent d'un chargement précédent ou que le filtre n'est pas appliqué correctement.

**Correction** : Ajouter un log de debug et un fallback explicite — si le filtre par catégorie retourne 0 produits, afficher un message "Aucun produit Tech disponible" plutôt que des produits d'autres catégories. Aussi ajouter `category_name` au SELECT pour vérifier la cohérence.

## Problème 2 : Rendre toute la carte produit cliquable

Actuellement seul le bouton cœur (AnimatedFavoriteButton) permet de toggler le favori. L'utilisateur s'attend à cliquer n'importe où sur la carte (image incluse) pour sélectionner/désélectionner.

**Correction** : Ajouter un `onClick={() => toggleFavorite(product.id)}` sur le `motion.div` parent de chaque carte + un style visuel de sélection (bordure primary quand favori).

## Détails techniques

### Fichier : `src/components/OnboardingExperience.tsx`

**1. Requête produits (lignes 255-267)** :
- Ajouter `category_name` au SELECT pour debug
- Si `tasteCategoryNames.length > 0` et la requête retourne 0 résultats, ne PAS fallback sur tous les produits — garder le tableau vide et afficher un message adapté

**2. Carte produit (lignes 942-971)** :
- Ajouter `onClick={() => toggleFavorite(product.id)}` sur le `motion.div` conteneur
- Ajouter `cursor-pointer` sur la carte
- Ajouter une bordure visuelle quand le produit est favori : `border-2 border-primary` si sélectionné, `border border-border` sinon
- Supprimer le `e.stopPropagation()` du AnimatedFavoriteButton puisque les deux clics font la même action

**3. Message vide adapté (ligne 974-979)** :
- Changer le message vide en : "Aucun produit disponible dans cette catégorie. Essaie une autre catégorie de goûts !"

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Corriger filtrage + rendre cartes cliquables avec feedback visuel |

