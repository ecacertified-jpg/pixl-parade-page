

# Plan : Afficher le nombre de proches (relations confirmées) dans le dashboard

## Problème

Actuellement, `useUserStats` compte les **contacts** (carnet d'adresses) via la table `contacts`. Ce chiffre inclut des personnes non inscrites et sans relation confirmée. Il faut afficher le nombre de **proches** — les relations bidirectionnelles confirmées dans `contact_relationships`.

## Changements

### 1. `src/hooks/useUserStats.ts` — Ajouter `closeRelationsCount`

Ajouter une requête parallèle sur `contact_relationships` comptant les lignes où `user_a = userId` OU `user_b = userId`. Exposer le résultat dans `UserStats` sous `closeRelationsCount`.

### 2. `src/components/ProfileDropdown.tsx` — Afficher "Proches" à côté de "Amis"

Remplacer ou compléter la stat "Amis" (qui affiche `friendsCount` = contacts) par "Proches" affichant `closeRelationsCount`. Deux options :
- **Option A** : Remplacer "Amis" par "Proches" (relations confirmées uniquement)
- **Option B** : Garder "Amis" et ajouter une 4e stat "Proches"

Proposition : **Option A** — remplacer, car c'est la métrique la plus pertinente (les contacts non liés n'ont pas de valeur sociale réelle). Le label reste "Amis" mais la source devient `contact_relationships`.

### 3. `src/pages/UserProfile.tsx` — Même correction

Remplacer le comptage `contacts` par `contact_relationships` pour la stat "Amis" affichée sur le profil public.

## Fichiers modifiés

- `src/hooks/useUserStats.ts`
- `src/components/ProfileDropdown.tsx`
- `src/pages/UserProfile.tsx`

