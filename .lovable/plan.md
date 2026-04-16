

# Plan : Remplacer les filtres occasions par des catégories produit + image cliquable

## Problème actuel

Les badges sous la barre de recherche affichent des **occasions** (Anniversaire, Mariage, Baby Shower...) depuis la table `categories`. L'utilisateur veut des **catégories produit** (Mode, Bijoux, Tech, Gastronomie...) et pouvoir cliquer sur l'image pour ajouter/retirer un favori.

## Changements — `src/pages/WishlistCatalog.tsx`

### 1. Remplacer les filtres par les catégories produit (taste-categories)

Utiliser `TASTE_CATEGORIES` et `TASTE_TO_PRODUCT_CATEGORIES` de `src/data/taste-categories.ts` au lieu de la table `categories`. Les badges afficheront : Tous, Tech, Mode, Voyage, Musique, Gastronomie, Sport, Bijoux, Bien-être.

Le filtre côté client utilisera `matchesTaste(product.category_name, selectedTaste)` au lieu de comparer `category_id`.

### 2. Ajouter `category_name` à la requête produit

Modifier le SELECT pour inclure `category_name` dans les colonnes récupérées, car le filtrage se fera sur ce champ au lieu de `category_id`.

### 3. Recherche par nom d'article

La recherche existe déjà (`searchQuery` filtre sur `p.name`). On va l'étendre pour chercher aussi dans `category_name`, permettant de trouver "chemise", "bijoux", "collier", "chaussures", "sac", etc. Le placeholder sera mis à jour : "Rechercher un article (chemise, bijoux, sac...)".

### 4. Rendre l'image cliquable pour toggler le favori

Ajouter un `onClick` sur le conteneur de l'image qui appelle `handleToggleFavorite`. L'image aura un `cursor-pointer` et un léger effet de feedback visuel (overlay au hover avec une icône cœur).

## Résumé technique

| Élément | Avant | Après |
|---------|-------|-------|
| Badges filtres | `categories` table (occasions) | `TASTE_CATEGORIES` (types produit) |
| Filtre logique | `category_id === selectedCategory` | `matchesTaste(category_name, tasteId)` |
| Recherche | Nom seulement | Nom + `category_name` |
| Image produit | Non cliquable | Cliquable → toggle favori |
| Requête SQL | Sans `category_name` | Avec `category_name` |

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/pages/WishlistCatalog.tsx` | Import taste-categories, modifier filtres, image cliquable, étendre recherche |

