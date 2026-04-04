

# Diagnostic : Les catégories de goûts ne matchent pas les articles

## Problème identifié

La grande majorité des produits en base (481 sur 522) ont un `category_name` **NULL**. Le mapping actuel dans `matchesTaste()` compare le `category_name` du produit aux noms de catégories attendus, mais comme presque tous les produits n'ont pas de catégorie assignée, aucun filtre de goût ne retourne de résultat (sauf "Tous").

**Données réelles en base :**
| category_name | Nombre de produits |
|---|---|
| NULL | 481 |
| Mode & Vêtements | 21 |
| Parfums & Beauté | 6 |
| Tech & Électronique | 6 |
| Gastronomie & Délices | 2 |
| Autres (5 catégories) | 5 chacune ~1 |

## Solution proposée

### 1. Assigner automatiquement une catégorie aux produits sans `category_name`

Créer un script (migration SQL) qui analyse le **nom** et la **description** de chaque produit sans catégorie et leur assigne une `category_name` par mots-clés :

```text
"perruque", "robe", "jean", "boubou", "pagne", "wax", "talon" → Mode & Vêtements
"gâteau", "chocolat", "vin", "café" → Gastronomie & Délices
"parfum", "soin", "crème", "garnier", "beauté" → Parfums & Beauté
"montre", "bracelet", "collier", "bague", "bijou" → Bijoux & Accessoires
"téléphone", "écouteur", "chargeur" → Tech & Électronique
"spa", "massage", "bien-être" → Bien-être & Spa
(produits non classifiés) → Mode & Vêtements (catégorie par défaut, car majorité mode)
```

### 2. Rendre le mapping bidirectionnel plus large

Ajuster `TASTE_TO_PRODUCT_CATEGORIES` pour couvrir les catégories réellement présentes en base, y compris celles qui ne sont pas encore mappées :

```text
mode → Mode & Vêtements, Décoration & Maison
gastronomie → Gastronomie & Délices, Restaurants & Gastronomie
bijoux → Bijoux & Accessoires, Occasions Spéciales
bien-etre → Bien-être & Spa, Parfums & Beauté
tech → Tech & Électronique, Affaires & Bureau
```

### 3. Assurer que les futurs produits reçoivent une catégorie

Modifier le formulaire de création de produit business pour rendre le champ catégorie **obligatoire** et pré-remplir avec les catégories existantes.

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| Migration SQL | Assigner `category_name` aux 481 produits NULL |
| `src/data/taste-categories.ts` | Élargir le mapping pour couvrir toutes les catégories existantes |
| Formulaire produit business | Rendre la catégorie obligatoire (optionnel, étape suivante) |

## Impact

Après la migration, chaque produit aura une catégorie, et les filtres de goûts retourneront des résultats pertinents dans toutes les boutiques.

