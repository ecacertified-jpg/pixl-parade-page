# Lot 4 — Écran Live avec LiveKit Cloud

Objectif : un écran `/live/:roomId` où plusieurs amis peuvent rejoindre une salle vidéo/audio depuis une page de célébration (anniversaire, événement, post Célébrer), voir la grille vidéo, la liste des participants et contrôler leur micro/caméra.

## 1. Infrastructure (Supabase + LiveKit Cloud)

### Secrets à ajouter

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_WS_URL` (ex: `wss://jdv-xxxx.livekit.cloud`)

Compte LiveKit Cloud à créer côté utilisateur (free tier 50 GB/mois). Je lui donnerai les étapes pour récupérer les 3 valeurs.

### Tables Supabase

- `**live_rooms**` : `id`, `host_id`, `title`, `context_type` ('celebration_post' | 'birthday_page' | 'event_page' | 'standalone'), `context_id`, `livekit_room_name` (unique), `status` ('scheduled' | 'live' | 'ended'), `max_participants` (défaut 20), `is_public`, `started_at`, `ended_at`.
- `**live_participants**` : `id`, `room_id`, `user_id`, `display_name`, `role` ('host' | 'co_host' | 'guest' | 'viewer'), `joined_at`, `left_at`, `is_muted`, `camera_off`.

RLS :

- `live_rooms` : SELECT public si `is_public=true` ou host/participant ; INSERT par authentifié ; UPDATE host uniquement.
- `live_participants` : SELECT si membre de la room ou room publique ; INSERT self ; UPDATE host (kick) ou self.

GRANTs standard `authenticated` + `service_role`. Réactivation Realtime sur `live_participants` pour MAJ liste en temps réel.

## 2. Edge Functions

- `**livekit-create-room**` : auth requise, crée la ligne `live_rooms`, génère `livekit_room_name`, retourne `room.id` + `roomName`.
- `**livekit-issue-token**` : auth requise, vérifie que l'utilisateur a le droit de rejoindre (room publique OU invité OU host), génère un JWT LiveKit (`livekit-server-sdk` via `npm:`) avec `canPublish` selon le `role`, écrit/upsert `live_participants`, retourne `{ token, wsUrl }`.
- `**livekit-end-room**` : host uniquement, passe `status='ended'`, appelle LiveKit pour fermer la room.

JWT validation : extraction du token Authorization, `getUser()`, ownership checks (host pour end/kick).

## 3. Frontend

### Dépendances

- `livekit-client`
- `@livekit/components-react`
- `@livekit/components-styles`

### Fichiers à créer

```
src/pages/Live/LiveRoomPage.tsx           // page /live/:roomId
src/components/live/LiveRoom.tsx          // <LiveKitRoom> wrapper + connexion token
src/components/live/VideoGrid.tsx         // GridLayout + ParticipantTile
src/components/live/ParticipantsPanel.tsx // liste latérale (avatars, rôle, statut mic/cam)
src/components/live/LiveControls.tsx      // toggle mic, cam, partage, quitter
src/components/live/PreJoinScreen.tsx     // check device + nom avant connexion
src/components/live/LiveStatusBadge.tsx   // "EN DIRECT" + viewer count
src/hooks/useLiveRoom.ts                  // créer/rejoindre room + token
src/hooks/useLiveParticipants.ts          // realtime liste participants Supabase
```

### Flux UX

1. Hôte clique « Démarrer un live » depuis une célébration → `livekit-create-room` → redirect `/live/:roomId`.
2. PreJoin : aperçu caméra/micro, choix nom (rempli depuis profil), bouton « Rejoindre ».
3. Dans la room :
  - **Grid vidéo** centrale (`GridLayout` LiveKit, responsive : 1 col mobile, 2–3 desktop, jusqu'à 9 tuiles visibles).
  - **Panneau participants** (drawer mobile, sidebar desktop) : avatar, nom, badge rôle, icônes mic/cam, bouton kick (host).
  - **Barre de contrôle** bas : `TrackToggle` micro, `TrackToggle` caméra, switch caméra, bouton quitter (host = terminer pour tous).
  - **Badge EN DIRECT** + compteur de participants en haut.
4. Sur déconnexion : update `live_participants.left_at`. Sur fin de room : redirect contexte d'origine.

### Routing

Ajouter `<Route path="/live/:roomId" element={<LiveRoomPage />} />` dans `App.tsx` (route protégée).

### Design

Réutilisation des tokens du design system (primary violet, gradient celebration). Tuiles arrondies `rounded-2xl`, ombre `shadow-soft`. Mobile-first, contrôles en bottom bar.

## 4. Hors scope (lots suivants)

- Chat en direct dans la room (Lot 5).
- Enregistrement / replay.
- Notifications OneSignal "X est en live".
- Réactions emoji flottantes.
- Modération avancée (mute forcé, blocage).

## 5. Détails techniques

- LiveKit token TTL : 6 h, permissions `roomJoin`, `canPublish` (host/co_host/guest), `canSubscribe`, `canPublishData`.
- Nom de room LiveKit : `jdv-{nanoid(12)}` pour éviter collisions.
- Cleanup : `supabase.removeChannel` dans `useEffect` cleanup pour la subscription realtime des participants.
- Gestion erreurs : toast français si caméra refusée, room pleine, token expiré.
- A11y : labels ARIA sur boutons de contrôle, focus trap dans le drawer participants.

---

**Confirme pour que je passe à l'implémentation.** Tu devras créer le compte LiveKit Cloud et me donner les 3 secrets quand je te le demanderai après l'approbation.