

# Plan : Sauvegarder automatiquement les catégories sélectionnées

## Problème

Les catégories (goûts) sélectionnées à l'étape 2 de l'onboarding ne sont sauvegardées en base de données que lorsque l'utilisateur clique sur "Suivant". Si l'utilisateur ferme l'application avant de cliquer "Suivant", ses sélections sont perdues.

## Solution

Sauvegarder automatiquement les catégories dans `profiles.selected_tastes` à chaque changement de sélection, via un `useEffect` avec debounce.

### Modification dans `src/components/OnboardingExperience.tsx`

1. Ajouter un `useEffect` qui surveille `selectedCategories` et sauvegarde automatiquement en DB dès que la sélection change (avec un délai de 500ms pour éviter trop d'appels) :

```typescript
useEffect(() => {
  if (!user || selectedCategories.length === 0) return;
  const timeout = setTimeout(() => {
    supabase.from('profiles')
      .update({ selected_tastes: selectedCategories })
      .eq('user_id', user.id);
  }, 500);
  return () => clearTimeout(timeout);
}, [selectedCategories, user]);
```

2. La sauvegarde dans `handleNext` (ligne 566-568) reste en place comme filet de sécurité.

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Ajouter auto-save des catégories via `useEffect` debounce |

