

# Ajouter la page courante dans la présence en temps réel

## Approche

Ajouter `current_page` au payload de présence Supabase, mis à jour à chaque changement de route via `useLocation`. L'admin voit la page active de chaque utilisateur dans la liste.

## Modifications

### 1. `usePresenceTracker.ts`
- Importer `useLocation` de react-router-dom
- Ajouter `current_page: location.pathname` dans le `channel.track()` initial
- Ajouter un `useEffect` sur `location.pathname` qui appelle `channel.track()` avec la page mise à jour (re-track met à jour la présence sans déconnecter)

### 2. `useOnlineUsers.ts`
- Ajouter `current_page: string` à l'interface `OnlineUser`

### 3. `RealtimeOnlineUsers.tsx`
- Afficher la page courante sous le nom de l'utilisateur avec une icône et un badge stylisé (ex: `/home` → badge gris avec texte)
- Ajouter une fonction helper `formatPageName` pour rendre les routes lisibles (ex: `/gifts/create` → "Créer un cadeau", `/home` → "Accueil")

### Fichiers impactés
| Fichier | Changement |
|---------|-----------|
| `src/hooks/usePresenceTracker.ts` | Ajouter `useLocation`, re-track sur changement de route |
| `src/hooks/useOnlineUsers.ts` | Ajouter `current_page` à l'interface |
| `src/components/admin/RealtimeOnlineUsers.tsx` | Afficher la page courante par utilisateur |

Pas de migration SQL nécessaire — tout passe par le payload Presence.

