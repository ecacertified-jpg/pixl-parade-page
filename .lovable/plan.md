

# Plan : Optimisation de la vitesse de chargement des pages lentes

## Pages identifiees comme lentes

### 1. Dashboard (`src/pages/Dashboard.tsx`) — Page la plus lourde
**Probleme** : 1097 lignes, ~40 imports statiques, et **8+ hooks avec requetes Supabase independantes** au montage :
- `useDashboardData` (1 query consolidee — OK)
- `useBusinessAccount` (1 query)
- `useCollectiveFunds` (1 query)
- `useReciprocityScore` (1 query)
- `useOnboarding` (1 query — pas TanStack Query, pas de cache)
- `useProfileCompletion` (1 query — pas TanStack Query, pas de cache)
- `useFriendsCircleBadgeCelebration` (1 query)
- `useFriendRequests` (N+1 queries — `getFriendsOfUser` appelee pour chaque requester)
- `useFriendshipSuggestions` (pas TanStack Query, 2 queries)
- `usePushNotifications` (check async)
- `SmartBirthdayReminders` (2 queries internes sequentielles sans cache)

**Total** : ~12-15 requetes Supabase au montage, dont certaines en cascade (N+1).

### 2. Shop (`src/pages/Shop.tsx`) — 937 lignes
**Probleme** : Charge 200 produits + ratings + businesses en parallele, mais bien optimisee avec TanStack Query. Moins critique.

### 3. Community (`src/pages/Community.tsx`) — Plus legere, acceptable.

---

## Optimisations proposees

### A. Migrer les hooks sans cache vers TanStack Query (Dashboard)

**Fichiers** :
- `src/hooks/useOnboarding.ts` — Migrer vers `useQuery` avec `staleTime: Infinity` (ne change pas en session)
- `src/hooks/useProfileCompletion.ts` — Migrer vers `useQuery` avec `staleTime: 60000`
- `src/hooks/useFriendshipSuggestions.ts` — Migrer vers `useQuery` avec `staleTime: 30000`

Cela elimine les re-fetches inutiles lors des re-renders et permet le cache cross-navigation.

### B. Eliminer le N+1 dans `useFriendRequests`

**Fichier** : `src/hooks/useFriendRequests.ts`

Actuellement, pour chaque `received` request, `getFriendsOfUser(requesterId)` fait une requete separee (ligne 66). Avec 5 demandes recues, ca fait 5 requetes supplementaires.

**Solution** : Remplacer par une seule requete `.in('user_a', requesterIds).or(...)` puis calculer les amis mutuels en memoire.

### C. Consolider les 2 requetes sequentielles de `SmartBirthdayReminders`

**Fichier** : `src/components/SmartBirthdayReminders.tsx`

Actuellement : `loadReminders()` puis `loadUpcomingBirthdays()` en cascade via 2 `useEffect`. De plus, `loadUpcomingBirthdays` re-fetch les contacts (deja disponibles dans `useDashboardData`).

**Solution** : 
- Accepter les contacts en prop (depuis `useDashboardData.friends`)
- Fusionner les 2 fonctions en un seul `useQuery`

### D. Lazy-load les composants lourds des onglets inactifs du Dashboard

**Fichier** : `src/pages/Dashboard.tsx`

Les composants des onglets (Badges, Cotisations, Cadeaux) sont importes et montes meme quand l'onglet "Amis" est actif. Convertir en `React.lazy` :

```tsx
const AllBadgesCollection = lazy(() => import('@/components/AllBadgesCollection'));
const GiftsSection = lazy(() => import('@/components/GiftsSection'));
const CollectiveFundCard = lazy(() => import('@/components/CollectiveFundCard'));
```

Et ne les rendre que quand leur onglet est actif (deja le cas avec `activeTab === 'xxx'`), mais le lazy evite de charger le code JS inutilement.

---

## Resume des fichiers impactes

| Fichier | Changement |
|---------|-----------|
| `src/hooks/useOnboarding.ts` | Migrer vers useQuery |
| `src/hooks/useProfileCompletion.ts` | Migrer vers useQuery |
| `src/hooks/useFriendshipSuggestions.ts` | Migrer vers useQuery |
| `src/hooks/useFriendRequests.ts` | Eliminer N+1 queries |
| `src/components/SmartBirthdayReminders.tsx` | Consolider en useQuery, accepter contacts en prop |
| `src/pages/Dashboard.tsx` | Lazy imports pour composants d'onglets inactifs, passer contacts en prop a SmartBirthdayReminders |

