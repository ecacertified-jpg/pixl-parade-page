

# Plan : Filtrer les articles de l'étape Souhaits par les goûts sélectionnés

## Problème

À l'étape 3 (Souhaits) de l'onboarding, la requête charge simplement 12 produits actifs sans tenir compte des goûts choisis à l'étape 2. Un utilisateur qui sélectionne "Tech" voit des robes et des gâteaux au lieu de smartphones et montres connectées.

## Solution

Utiliser les `selectedCategories` (goûts choisis à l'étape 2) pour filtrer les produits via le mapping `TASTE_TO_PRODUCT_CATEGORIES`. La requête Supabase utilisera un filtre `.in('category_name', [...])` avec les noms de catégories correspondant aux goûts sélectionnés.

## Modification

### `src/components/OnboardingExperience.tsx`

**Lignes 210-222** — Refonte de la requête produits :

1. Importer `TASTE_TO_PRODUCT_CATEGORIES` depuis `@/data/taste-categories.ts`
2. Construire la liste des `category_name` correspondant aux goûts sélectionnés :
   ```typescript
   const categoryNames = selectedCategories.flatMap(
     taste => TASTE_TO_PRODUCT_CATEGORIES[taste] || []
   );
   ```
3. Si des catégories sont trouvées, ajouter `.in('category_name', categoryNames)` à la requête
4. Augmenter la limite à 20 pour compenser le filtrage
5. Ajouter `selectedCategories` dans les dépendances du `useEffect` pour recharger si l'utilisateur revient modifier ses goûts

```text
Avant :  .eq('is_active', true).limit(12)
Après :  .eq('is_active', true).in('category_name', categoryNames).limit(20)
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Filtrer les produits par goûts sélectionnés à l'étape 2 |

