
# Plan : Utiliser les catégories de goûts de l'onboarding dans les boutiques

## Principe

Remplacer les catégories produit actuelles de la boutique principale (Bijoux & Accessoires, Tech & Électronique, etc.) par les 8 catégories de goûts de l'onboarding (Tech, Mode, Voyage, Musique, Gastronomie, Sport, Bijoux, Bien-être). Un mapping associe chaque goût aux catégories produit existantes en base. Le même filtre est ajouté dans les boutiques prestataires.

## Mapping goûts → catégories produit en base

```text
tech        → Tech & Électronique, Loisirs & Divertissement
mode        → Mode & Vêtements, Bijoux & Accessoires
voyage      → Séjours & Hébergement, Expériences VIP
musique     → Loisirs & Divertissement, Culture & Loisirs
gastronomie → Gastronomie & Délices, Restaurants & Gastronomie
sport       → Loisirs & Divertissement
bijoux      → Bijoux & Accessoires, Parfums & Beauté
bien-etre   → Bien-être & Spa, Parfums & Beauté
```

## Modifications

### 1. Nouveau fichier : `src/data/taste-categories.ts`
- Exporter `TASTE_CATEGORIES` (8 catégories avec id, label, icône, couleur)
- Exporter `TASTE_TO_PRODUCT_CATEGORIES` : mapping goût → tableau de `category_name`
- Exporter `ALL_TASTE` (option "Tous")
- Exporter `matchesTaste(categoryName, tasteId)` : fonction de filtrage

### 2. `src/pages/Shop.tsx`
- Supprimer les tableaux `productCategories` et `experienceCategories` en dur (lignes 282-308)
- Importer `TASTE_CATEGORIES`, `ALL_TASTE`, `matchesTaste`
- Remplacer `selectedCategory` par `selectedTaste` (string = taste id)
- Adapter `filteredProducts` : utiliser `matchesTaste(product.categoryName, selectedTaste)` au lieu de `product.categoryName === selectedCategory`
- Remplacer les boutons de catégorie (lignes 525-542, 557-574) par les boutons de goûts avec icônes colorées, dans les deux onglets (produits et expériences)
- Adapter `getCategoryCount` pour utiliser `matchesTaste`

### 3. `src/pages/VendorShop.tsx`
- Importer `TASTE_CATEGORIES`, `ALL_TASTE`, `matchesTaste`
- Ajouter état `selectedTaste`
- Ajouter une barre de filtres horizontale avant la grille de produits
- Filtrer `filteredProducts` via `matchesTaste`

### 4. `src/components/OnboardingExperience.tsx`
- Importer `TASTE_CATEGORIES` depuis `@/data/taste-categories`
- Supprimer la définition locale `GIFT_CATEGORIES` (lignes 32-41)
- Adapter les références : `GIFT_CATEGORIES` → `TASTE_CATEGORIES`, `cat.id` reste identique

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/data/taste-categories.ts` | Créer : catégories partagées + mapping |
| `src/pages/Shop.tsx` | Modifier : remplacer catégories par goûts |
| `src/pages/VendorShop.tsx` | Modifier : ajouter filtre par goûts |
| `src/components/OnboardingExperience.tsx` | Modifier : importer depuis fichier partagé |
