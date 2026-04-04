

# Plan : Afficher l'onboarding pour les étapes non achevées (tous utilisateurs)

## Problème

Actuellement, `onboarding_completed` est un flag binaire. Une fois mis à `true`, l'onboarding ne réapparaît jamais, même si l'utilisateur n'a pas réellement complété toutes les étapes (anniversaire, goûts, souhaits, amis).

## Solution

Remplacer la vérification binaire par une vérification des étapes réelles en base. L'onboarding s'affiche si au moins une étape est incomplète, et démarre directement à la première étape non achevée.

## Conditions de complétion vérifiées en base

| Étape | Vérification |
|-------|-------------|
| 1 - Anniversaire | `profiles.birthday IS NOT NULL` |
| 2 - Goûts | Au moins 1 entrée dans `user_preferences` ou `selectedCategories` stockées |
| 3 - Souhaits | `user_favorites` count ≥ 3 |
| 4 - Amis | `friend_form_tokens` avec `status = 'completed'` count ≥ 3 |

## Modifications

### 1. `src/hooks/useOnboarding.ts` — Refonte de `fetchOnboardingStatus`

Remplacer la logique binaire par une fonction qui :
1. Vérifie chaque condition en base (birthday, favorites count, completed friend forms count)
2. Retourne `{ shouldShow: boolean, firstIncompleteStep: number }` au lieu d'un simple `boolean`
3. Ignore le flag `onboarding_completed` — se base uniquement sur les données réelles
4. Conserve le cache localStorage mais par étape (invalidé si les données changent)

```typescript
interface OnboardingStatus {
  shouldShow: boolean;
  firstIncompleteStep: number;
}

const fetchOnboardingStatus = async (userId: string): Promise<OnboardingStatus> => {
  // Vérifier chaque étape en parallèle
  const [profile, favCount, friendCount] = await Promise.all([
    supabase.from('profiles').select('birthday').eq('user_id', userId).single(),
    supabase.from('user_favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('friend_form_tokens').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
  ]);

  if (!profile.data?.birthday) return { shouldShow: true, firstIncompleteStep: 1 };
  // Note: step 2 (goûts) — vérifier si des catégories existent
  if ((favCount.count || 0) < 3) return { shouldShow: true, firstIncompleteStep: 3 };
  if ((friendCount.count || 0) < 3) return { shouldShow: true, firstIncompleteStep: 4 };
  return { shouldShow: false, firstIncompleteStep: 0 };
};
```

### 2. `src/hooks/useOnboarding.ts` — Exposer `firstIncompleteStep`

Le hook retourne `firstIncompleteStep` en plus de `shouldShowOnboarding`. Le `currentStep` est initialisé à `firstIncompleteStep` au lieu de 0 ou du localStorage.

### 3. `src/hooks/useOnboarding.ts` — Mettre à jour `completeOnboarding`

Ne marquer `onboarding_completed = true` que si toutes les étapes sont réellement complétées (vérification en base). Sinon, simplement fermer le modal (l'utilisateur pourra être re-sollicité à la prochaine visite).

### 4. `src/components/OnboardingExperience.tsx` — Skip des étapes déjà complétées

Quand l'utilisateur navigue, les étapes déjà complétées sont franchies automatiquement (le `handleNext` saute à la prochaine étape incomplète). L'étape 0 (accueil) est toujours skippée pour les utilisateurs qui reviennent.

### 5. `src/pages/Dashboard.tsx` — Passer `firstIncompleteStep`

Utiliser `firstIncompleteStep` du hook pour initialiser `currentStep` correctement.

## Comportement final

```text
Nouvel utilisateur :
  → Onboarding complet (étapes 0-4 ou 0-5)

Utilisateur existant sans anniversaire :
  → Onboarding s'ouvre à l'étape 1 (Anniversaire)

Utilisateur avec anniversaire + goûts mais < 3 favoris :
  → Onboarding s'ouvre à l'étape 3 (Souhaits)

Utilisateur tout complété :
  → Pas d'onboarding
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/hooks/useOnboarding.ts` | Refonte : vérification par étape au lieu du flag binaire |
| `src/components/OnboardingExperience.tsx` | Skip automatique des étapes complétées, pas d'étape 0 pour les retours |
| `src/pages/Dashboard.tsx` | Passer `firstIncompleteStep` au composant |

