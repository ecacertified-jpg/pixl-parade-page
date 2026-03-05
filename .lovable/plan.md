

# Système de présence en temps réel — `/admin/realtime`

## Approche

Utiliser **Supabase Realtime Presence** via `channel.track()` côté utilisateur et `channel.presenceState()` côté admin pour afficher les utilisateurs connectés en direct.

## Architecture

### 1. Hook `usePresenceTracker` (côté utilisateur)

Fichier : `src/hooks/usePresenceTracker.ts`

- Appelé dans le layout principal (ou `App.tsx`) quand l'utilisateur est authentifié
- Rejoint un channel `presence:online-users` et appelle `channel.track()` avec `{ user_id, first_name, last_name, avatar_url, connected_at }`
- Se désinscrit au unmount
- Léger, pas de state local nécessaire

### 2. Hook `useOnlineUsers` (côté admin)

Fichier : `src/hooks/useOnlineUsers.ts`

- Rejoint le même channel `presence:online-users`
- Écoute les événements `sync`, `join`, `leave` via `channel.on('presence', ...)`
- Maintient un state `onlineUsers[]` avec les infos de chaque utilisateur connecté
- Expose `onlineCount` et `onlineUsers`

### 3. Composant `RealtimeOnlineUsers`

Fichier : `src/components/admin/RealtimeOnlineUsers.tsx`

- Card affichant le nombre d'utilisateurs en ligne avec un indicateur vert pulsant
- Liste scrollable des utilisateurs connectés (avatar, nom, durée de connexion)
- Animations framer-motion pour join/leave

### 4. Intégration

- **`RealtimeDashboard.tsx`** : Ajouter la card `RealtimeOnlineUsers` entre les stats cards et les charts
- **`useRealtimeDashboard`** : Ajouter `onlineCount` aux `LiveStats` (nouvelle stat card "En ligne")
- **Layout principal** : Appeler `usePresenceTracker` dans `App.tsx` ou le composant racine authentifié pour que chaque utilisateur connecté soit tracké

### 5. Données trackées par utilisateur

```typescript
interface PresenceState {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  connected_at: string; // ISO timestamp
}
```

## Points techniques

- Supabase Presence ne nécessite aucune table ni migration — tout passe par le channel Realtime
- Le tracking se fait automatiquement via le heartbeat Supabase (toutes les 30s)
- Quand l'utilisateur ferme l'onglet, Supabase détecte la déconnexion après ~30s
- Pas de surcharge serveur : c'est du pur WebSocket côté Supabase

