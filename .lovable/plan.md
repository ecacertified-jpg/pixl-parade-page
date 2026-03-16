

# Plan : Corriger l'onboarding et le compte à rebours anniversaire

## Problèmes identifiés

### 1. Onboarding ne s'affiche jamais (bug critique)

Dans `useOnboarding.ts` ligne 16, la requête utilise `.eq('id', userId)` au lieu de `.eq('user_id', userId)`. La table `profiles` a un `id` auto-généré et un `user_id` qui référence `auth.users.id`. Le profil n'est donc jamais trouvé, la vérification `diffMinutes < 5` ne s'exécute jamais, et `fetchOnboardingStatus` retourne toujours `false`.

Résultat : l'onboarding en 3 étapes ne se lance **jamais** après inscription.

### 2. Compte à rebours anniversaire

Le compte à rebours fonctionne correctement côté code — il affiche le CTA "Quand est ton anniversaire ?" quand `birthday` est `null`, ce qui est le cas ici. La chaîne de sauvegarde (metadata → trigger `handle_new_user` → profiles.birthday) est correcte. Cependant, puisque l'onboarding ne se lance pas, l'utilisateur n'est pas guidé à compléter son profil, ce qui explique le birthday manquant dans certains cas.

Un deuxième problème lié : `staleTime: Infinity` dans `useOnboarding` empêche tout re-fetch si la première requête échoue ou retourne `false` à tort.

## Corrections

### Fichier : `src/hooks/useOnboarding.ts`

| Ligne | Avant | Après |
|-------|-------|-------|
| 16 | `.eq('id', userId)` | `.eq('user_id', userId)` |
| 43 | `staleTime: Infinity` | `staleTime: 300000` (5 min, permet un re-fetch si la première tentative échoue) |

Aucun autre fichier à modifier. Le `OnboardingModal`, le `BirthdayCountdownCard` et le `useDashboardData` fonctionnent correctement.

