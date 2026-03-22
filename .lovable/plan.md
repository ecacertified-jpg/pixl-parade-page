

# Plan : Optimiser la vitesse d'affichage des pages et transitions

## Diagnostic

Trois problèmes principaux ralentissent l'affichage :

1. **`AnimatePresence mode="wait"` sur les onglets Dashboard** (ligne 699) — l'ancien onglet doit finir son animation de sortie (250ms) avant que le nouveau ne s'affiche. L'utilisateur perçoit un délai.

2. **QueryClient sans configuration de cache globale** (ligne 143 de App.tsx) — `new QueryClient()` sans defaults. Chaque hook définit son propre `staleTime` (30s) mais aucun `gcTime` global ni `refetchOnWindowFocus: false`. Résultat : re-fetches fréquents et données non-cached entre navigations.

3. **Skeleton bloquant sur le Dashboard** (ligne 490-491) — `DashboardSkeleton` remplace tout le contenu tant que `dashboardLoading` est true, au lieu d'afficher la structure immédiatement avec des données placeholder.

## Changements

### 1. `src/App.tsx` — QueryClient avec cache agressif

Configurer `QueryClient` avec des defaults globaux pour que les données restent en cache entre navigations :

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // 1 min avant re-fetch
      gcTime: 10 * 60_000,      // 10 min en cache mémoire
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 2. `src/pages/Dashboard.tsx` — Supprimer `AnimatePresence mode="wait"` sur les onglets

Remplacer `AnimatePresence mode="wait"` (ligne 699) par `AnimatePresence mode="popLayout"` pour que le nouveau contenu apparaisse **immédiatement** sans attendre la sortie de l'ancien. Réduire la durée de transition de 250ms à 150ms.

### 3. `src/pages/Dashboard.tsx` — Afficher le contenu sans skeleton bloquant

Remplacer le `if (dashboardLoading) return <DashboardSkeleton />` par un rendu conditionnel inline : afficher la structure de page immédiatement (header, onglets), avec des skeletons uniquement dans les zones de données (liste d'amis, événements).

### 4. `src/hooks/useDashboardData.ts` — `placeholderData`

Ajouter `placeholderData` pour que TanStack Query affiche les données précédentes pendant un re-fetch, évitant tout flash de skeleton :

```typescript
placeholderData: (previousData) => previousData,
```

### 5. Appliquer `placeholderData` aux hooks fréquents

Ajouter `placeholderData: (prev) => prev` dans les hooks les plus utilisés pour garder l'ancien contenu visible pendant les re-fetches :
- `useCollectiveFunds.ts`
- `useFavorites.ts`
- `useReciprocityScore.ts`
- `useFriendRequests.ts`
- `useBusinessAccount.ts`

### 6. Préchargement du Dashboard dès la page Index/Home

Dans `src/pages/Index.tsx` et `src/pages/Home.tsx`, ajouter un `queryClient.prefetchQuery` pour `dashboard-data` quand l'utilisateur est connecté, afin que les données soient déjà en cache quand il navigue vers le Dashboard.

## Fichiers modifiés

- `src/App.tsx` — QueryClient defaults
- `src/pages/Dashboard.tsx` — supprimer mode="wait", supprimer skeleton bloquant
- `src/hooks/useDashboardData.ts` — placeholderData
- `src/hooks/useCollectiveFunds.ts` — placeholderData
- `src/hooks/useFavorites.ts` — placeholderData
- `src/hooks/useReciprocityScore.ts` — placeholderData
- `src/hooks/useFriendRequests.ts` — placeholderData
- `src/hooks/useBusinessAccount.ts` — placeholderData
- `src/pages/Index.tsx` — prefetch dashboard-data
- `src/pages/Home.tsx` — prefetch dashboard-data

