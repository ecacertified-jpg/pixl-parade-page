

# Plan : Corriger la race condition dans useOnboarding

## Probleme

Quand un utilisateur vient de s'inscrire, le trigger `handle_new_user()` cree le profil en base. Mais si le dashboard charge avant que le profil soit cree, la requete retourne `profile === null`. Actuellement, le code tombe sur `return false` (ligne 29), ce qui **masque l'onboarding** pour ce nouvel utilisateur.

## Solution

Dans `fetchOnboardingStatus`, ajouter une condition apres la requete : si `profile` est `null` (profil pas encore cree), retourner `true` pour afficher l'onboarding. Un nouvel utilisateur dont le profil n'existe pas encore est forcement un nouvel inscrit.

## Modification dans `src/hooks/useOnboarding.ts`

Apres la requete Supabase (ligne 20), ajouter :

```typescript
// Profile not yet created (race condition) → new user → show onboarding
if (!profile) return true;
```

Avant le check `profile?.onboarding_completed === false`.

Egalement ajouter `retry: 2` a la query React Query pour re-essayer en cas d'echec reseau, ce qui laisse le temps au profil d'etre cree.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/hooks/useOnboarding.ts` | Ajouter guard `!profile` + retry sur la query |

