# Plan : Utiliser les catégories de l'onboarding dans les boutiques

## Principe

Remplacer les catégories actuelles de la boutique (Bijoux & Accessoires, Tech & Électronique, etc.) par les 8 catégories de goûts de l'onboarding (Tech, Mode, Voyage, Musique, Gastronomie, Sport, Bijoux, Bien-être). Quand un utilisateur sélectionne une catégorie, les produits sont filtrés via un mapping qui associe chaque goût aux catégories produit existantes en base.

## Mapping goûts → catégories produit

```text
tech       → Tech & Électronique, Loisirs & Divertissement
mode       → Mode & Vêtements, Bijoux & Accessoires
voyage     → Séjours & Hébergement, Expériences VIP
musique    → Loisirs & Divertissement, Culture & Loisirs
gastronomie → Gastronomie & Délices, Restaurants & Gastronomie
sport      → Loisirs & Divertissement
bijoux     → Bijoux & Accessoires, Parfums & Beauté
bien-etre  → Bien-être & Spa, Parfums & Beauté
```

## Modifications

### 1. Nouveau fichier : `src/data/taste-categories.ts`

- Exporter `TASTE_CATEGORIES` (les 8 catégories avec id, label, icône, couleur — extraites de `OnboardingExperience.tsx`)
- Exporter `TASTE_TO_PRODUCT_CATEGORIES_MAP` : mapping d'un taste id vers un tableau de `category_name` en base
- Exporter une fonction `filterProductsByTaste(products, tasteId)` qui retourne les produits dont le `categoryName` matche

### 2. Fichier : `src/pages/Shop.tsx`

- Remplacer `productCategories` et `experienceCategories` par les `TASTE_CATEGORIES` importées
- Adapter le filtre `matchesCategory` : au lieu de comparer `product.categoryName === selectedCategory`, utiliser le mapping pour vérifier si le `categoryName` du produit fait partie des catégories associées au goût sélectionné
- Conserver "Tous" comme première option
- Supprimer la séparation produits/expériences dans le filtre catégorie (les goûts couvrent les deux)

### 3. Fichier : `src/pages/VendorShop.tsx`

- Ajouter un filtre par catégorie de goûts (actuellement pas de filtre catégorie)
- Importer `TASTE_CATEGORIES` et le mapping
- Ajouter un état `selectedTaste` et une barre de filtres horizontale
- Filtrer `filteredProducts` par goût sélectionné

### 4. Fichier : `src/components/OnboardingExperience.tsx`

- Importer `TASTE_CATEGORIES` depuis le fichier partagé au lieu de les définir en dur (factorisation)

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/data/taste-categories.ts` | Nouveau : catégories partagées + mapping |
| `src/pages/Shop.tsx` | Remplacer catégories par goûts, adapter filtre |
| `src/pages/VendorShop.tsx` | Ajouter filtre par goûts |
| `src/components/OnboardingExperience.tsx` | Importer depuis fichier partagé |
