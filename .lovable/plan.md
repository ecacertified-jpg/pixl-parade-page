

# Optimiser la vitesse de chargement du Dashboard

## Probleme identifie

Le Dashboard declenche **15+ requetes Supabase independantes** et ouvre **3+ canaux Realtime** au montage initial. Chaque hook utilise `useState`/`useEffect` brut sans cache ni deduplication. Voici l'inventaire :

### Requetes au montage (toutes en cascade, non cachees)

| Source | Requetes Supabase | Canal Realtime |
|--------|:-:|:-:|
| Dashboard (loadFriends) | 2 (contacts + user_favorites) | - |
| Dashboard (loadEvents) | 1 | - |
| Dashboard (loadUserProfile) | 1 | - |
| useCollectiveFunds | 1 | - |
| useBusinessAccount | 1 | - |
| useReciprocityScore | 1 | 1 |
| useOnboarding | 1 | - |
| useProfileCompletion | 1 | - |
| useFriendRequests | 2-4 (requests + profiles) | - |
| useFriendsCircleBadgeCelebration | 1 | 1 |
| useFriendsCircleReminder | 1+ | - |
| SmartBirthdayReminders | 2 (notifications + contacts) | - |
| ReciprocityNotificationsSection | 1 | 1 |
| BirthdayStatsCard (useBirthdayStats) | 1 | - |
| FavoriteArticlesSection (useFavorites) | 1 | - |
| useFriendshipSuggestions | 1-2 | - |

**Total : ~20 requetes Supabase + 3 canaux Realtime** au premier rendu.

## Solution : Migrer les hooks critiques vers TanStack Query

Migrer les 6 hooks les plus frequemment appeles vers TanStack Query avec `staleTime: 30000` pour partager le cache et eviter les re-fetches. Regrouper certaines requetes du Dashboard dans un seul hook.

### Etape 1 : Hook `useDashboardData` consolide

Creer un hook `useDashboardData.ts` qui regroupe les 4 requetes directes du Dashboard (profil, contacts, wishlists des contacts, evenements) en un seul `useQuery` avec `Promise.all`. Cela reduit 4 requetes sequentielles en 1 appel parallele cache.

### Etape 2 : Migrer `useReciprocityScore` vers TanStack Query

Remplacer `useState`/`useEffect` par `useQuery` avec cle `['reciprocity-score', userId]` et `staleTime: 30000`. Garder le canal Realtime pour l'invalidation du cache.

### Etape 3 : Migrer `useBusinessAccount` vers TanStack Query

Remplacer par `useQuery` avec cle `['business-account', userId]` et `staleTime: 60000` (change rarement).

### Etape 4 : Migrer `useBirthdayStats` vers TanStack Query

Remplacer par `useQuery` avec cle `['birthday-stats', userId]` et `staleTime: 60000`.

### Etape 5 : Migrer `useFriendRequests` vers TanStack Query

Remplacer par `useQuery` avec cle `['friend-requests', userId]` et `staleTime: 15000`.

### Etape 6 : Mettre a jour Dashboard.tsx

Remplacer les appels directs (`loadFriendsFromSupabase`, `loadEventsFromSupabase`, `loadUserProfile`) par le nouveau `useDashboardData`. Supprimer les `useState` et `useEffect` correspondants.

## Resultat attendu

```text
Avant:
  20 requetes independantes -> ~2-4s de chargement

Apres:
  ~8 requetes (dedupliquees et cachees) -> <1s au premier chargement
  Navigations suivantes : donnees instantanees depuis le cache
```

## Fichiers modifies

1. **Nouveau** : `src/hooks/useDashboardData.ts` -- hook consolide (profil + contacts + events)
2. **Modifie** : `src/hooks/useReciprocityScore.ts` -- migration TanStack Query
3. **Modifie** : `src/hooks/useBusinessAccount.ts` -- migration TanStack Query
4. **Modifie** : `src/hooks/useBirthdayStats.ts` -- migration TanStack Query
5. **Modifie** : `src/hooks/useFriendRequests.ts` -- migration TanStack Query
6. **Modifie** : `src/pages/Dashboard.tsx` -- utiliser `useDashboardData`, supprimer les fetches manuels

Aucune modification de la base de donnees. L'interface publique de chaque hook reste identique pour eviter de casser les autres composants consommateurs.

