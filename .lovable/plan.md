

# Plan : Corriger le filtrage Tech + ajouter texte "Continuer" au bouton clignotant

## Problème 1 : Produits non-Tech affichés

Le mapping `tech` dans `src/data/taste-categories.ts` inclut `'Affaires & Bureau'` en plus de `'Tech & Électronique'`. Or en base, la catégorie "Affaires & Bureau" contient des produits mal catégorisés (Détox, MEGA HAPPY, DJELI DJELI, MAHUDJLO — des produits pharmaceutiques/bien-être). Résultat : sélectionner "Tech" affiche ces produits non pertinents.

**Correction** : Retirer `'Affaires & Bureau'` du mapping `tech`. Ce n'est pas un problème de code de filtrage mais de mapping trop large.

## Problème 2 : Bouton clignotant sans texte

Le bouton "suivant" (ligne 644-667 de `OnboardingExperience.tsx`) est un `<button>` rond rouge clignotant qui ne contient que l'icône `<ChevronRight>`. Il manque le texte "Continuer".

**Correction** : Transformer le bouton rond en bouton avec texte "Continuer" + icône, en gardant le style rouge clignotant.

## Détails techniques

### Fichier 1 : `src/data/taste-categories.ts`

Ligne 29 — retirer `'Affaires & Bureau'` du mapping `tech` :
```typescript
'tech': ['Tech & Électronique'],
```

### Fichier 2 : `src/components/OnboardingExperience.tsx`

Lignes 644-667 — transformer le bouton rond en bouton avec texte :
- Remplacer le `<button>` rond par un bouton allongé avec `"Continuer"` + `<ChevronRight>`
- Garder le style `animate-pulse bg-red-500` quand `canGoNext` est vrai
- Adapter les classes : `rounded-full px-4 py-2 flex items-center gap-1 text-sm font-semibold`

| Fichier | Action |
|---------|--------|
| `src/data/taste-categories.ts` | Retirer 'Affaires & Bureau' du mapping tech |
| `src/components/OnboardingExperience.tsx` | Ajouter texte "Continuer" au bouton clignotant |

