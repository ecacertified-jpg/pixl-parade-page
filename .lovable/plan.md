## Objectif
Implémenter le Lot 4 minimal pour valider la connexion réelle à LiveKit : edge function `livekit-token` + écran `/live/:roomId` qui se connecte vraiment à la room.

## 1. Edge function `livekit-token`
Fichier : `supabase/functions/livekit-token/index.ts`

- Auth obligatoire : extrait le JWT du header `Authorization`, valide via `supabase.auth.getUser(token)`.
- Body : `{ roomId: string }` (UUID de `live_rooms`). Validé avec Zod.
- Vérifie que la room existe, qu'elle n'est pas `ended` et que l'utilisateur a le droit (host OU `is_public=true` OU déjà dans `live_participants`).
- Détermine le rôle :
  - `host` si `host_id = user.id`
  - sinon `guest` (publier audio/vidéo)
  - les "viewers" non-publishers seront ajoutés plus tard
- Génère un access token LiveKit signé avec `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET` via `npm:livekit-server-sdk@2`, avec grants :
  - `roomJoin: true`, `room: livekit_room_name`
  - `canPublish: true` (host + guest), `canSubscribe: true`, `canPublishData: true`
  - identity = `user.id`, name = profile display name
- Upsert dans `live_participants` (host/guest, `joined_at = now()`, `left_at = null`).
- Retourne `{ token, wsUrl: LIVEKIT_WS_URL, identity, role, roomName }`.
- CORS standard via `npm:@supabase/supabase-js@2/cors`.

## 2. Page `/live/:roomId`
Fichier : `src/pages/LiveRoom.tsx`

- Charge la room (`supabase.from('live_rooms').select().eq('id', roomId).single()`).
- Appelle `supabase.functions.invoke('livekit-token', { body: { roomId } })`.
- Utilise `@livekit/components-react` (`LiveKitRoom`, `VideoConference`, `RoomAudioRenderer`, styles `@livekit/components-styles`) pour faire la vraie connexion + UI prête à l'emploi.
- États : loading / erreur (token introuvable, room ended) / connecté.
- Bouton "Quitter" : déconnecte et update `live_participants.left_at`, puis `navigate(-1)`.
- Header simple avec titre de la room.

## 3. Câblage routing
Fichier : `src/App.tsx`
- Ajouter `const LiveRoom = lazy(() => import("./pages/LiveRoom"));`
- Route protégée : `<Route path="/live/:roomId" element={<ProtectedRoute><LiveRoom /></ProtectedRoute>} />`

## 4. Dépendances à installer
- `livekit-client`
- `@livekit/components-react`
- `@livekit/components-styles`

## 5. Validation
- Créer manuellement une row dans `live_rooms` (host = user courant, `livekit_room_name` = `'test-' || gen_random_uuid()`).
- Naviguer vers `/live/<id>`, autoriser micro/caméra → si la vidéo locale s'affiche et qu'on voit "Connected" → secrets LiveKit OK.
- Vérifier les logs de l'edge function en cas d'erreur (signature, WS URL).

## Notes techniques
- Pas de modification de schéma DB (tables déjà créées au tour précédent).
- `livekit-server-sdk` côté Deno : import via `npm:livekit-server-sdk@2`.
- Pas de touche au `verify_jwt` (défaut `false` côté config, on valide en code).
- Aucun secret côté client : le WS URL revient via la réponse de l'edge function.
