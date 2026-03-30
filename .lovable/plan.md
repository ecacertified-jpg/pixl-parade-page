

# Plan : Accélérer le chargement des éléments du cercle d'amis

## Problème

Les 3 composants visibles dans l'image (suggestions de relation, recherche utilisateur, suggestions "pour vous") chargent lentement car :

1. **`useUserSuggestions`** — Pas de cache TanStack Query. Utilise `useState`/`useEffect` brut avec 6+ requêtes séquentielles Supabase. Chaque navigation re-fetch tout.
2. **`useFriendshipSuggestions`** — Dépend du chargement complet de `useDashboardData` (waterfall : dashboard → contacts → suggestions).
3. **`useFriendRequests`** — Utilise TanStack Query mais sans `staleTime`, donc re-fetch à chaque mount.
4. **Pas de prefetch** — Aucun de ces hooks n'est préchargé depuis la page d'accueil.

## Modifications

### 1. Migrer `useUserSuggestions` vers TanStack Query (fichier principal)

**`src/hooks/useUserSuggestions.ts`**

- Extraire `fetchSuggestions` en fonction pure (comme les autres hooks)
- Remplacer `useState`/`useEffect` par `useQuery` avec `staleTime: 60_000`, `gcTime: 600_000`, `placeholderData: prev => prev`
- Paralléliser les 6 requêtes Supabase internes avec `Promise.all` au lieu de les exécuter séquentiellement

```typescript
// Avant : 6 requêtes séquentielles
const { data: myProfile } = await supabase...
const { data: followedUsers } = await supabase...
const { data: friendsOfFriends } = await supabase...
// etc.

// Après : groupées en parallèle
const [myProfile, followedUsers] = await Promise.all([
  supabase.from('profiles')...,
  supabase.from('user_follows')...,
]);
// Puis 2e batch parallèle avec les IDs obtenus
```

### 2. Ajouter `staleTime` aux hooks existants

**`src/hooks/useFriendRequests.ts`** — Ajouter `staleTime: 30_000` au `useQuery` (ligne 111)

**`src/hooks/useFriendshipSuggestions.ts`** — Augmenter `staleTime` de 30s à 60s et ajouter `placeholderData`

### 3. Prefetch depuis la page d'accueil

**`src/pages/Index.tsx`** — Ajouter le prefetch de `friend-requests` et `user-suggestions` dans le `useEffect` existant (ligne 37), en parallèle du prefetch dashboard déjà en place.

```typescript
useEffect(() => {
  if (user?.id) {
    import('@/hooks/useDashboardData').then(({ prefetchDashboardData }) => {
      prefetchDashboardData(queryClient, user.id);
    });
    // Prefetch friend requests & suggestions
    queryClient.prefetchQuery({
      queryKey: ['friend-requests', user.id],
      queryFn: () => import('@/hooks/useFriendRequests').then(m => m.prefetchFriendRequests(user.id)),
    });
    queryClient.prefetchQuery({
      queryKey: ['user-suggestions', user.id],
      queryFn: () => import('@/hooks/useUserSuggestions').then(m => m.prefetchUserSuggestions(user.id)),
    });
  }
}, [user?.id, queryClient]);
```

### 4. Exporter des fonctions `prefetch` depuis les hooks

**`src/hooks/useFriendRequests.ts`** — Exporter `prefetchFriendRequests(userId)`

**`src/hooks/useUserSuggestions.ts`** — Exporter `prefetchUserSuggestions(userId)`

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/hooks/useUserSuggestions.ts` | Migrer vers TanStack Query + paralléliser les requêtes + export prefetch |
| `src/hooks/useFriendRequests.ts` | Ajouter `staleTime: 30_000` + export prefetch |
| `src/hooks/useFriendshipSuggestions.ts` | Augmenter `staleTime` à 60s |
| `src/pages/Index.tsx` | Prefetch friend-requests et user-suggestions |

## Impact attendu

- Élimination du waterfall de 6 requêtes séquentielles → ~2x plus rapide
- Cache TanStack Query → navigation instantanée entre pages
- Prefetch depuis l'accueil → données prêtes avant même d'ouvrir le dashboard

