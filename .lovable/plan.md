## Objectif
Ajouter une page `/rooms` qui liste les `live_rooms` visibles et permet d'en créer une nouvelle, puis de rejoindre `/live/:roomId`.

## 1. Page `src/pages/Rooms.tsx`
- Protégée (route enveloppée par `ProtectedRoute`).
- Chargement via `supabase.from('live_rooms').select(...)` filtré sur `status in ('live','scheduled')` (exclut `ended`), trié par `created_at desc`, limite 50. RLS gère déjà la visibilité (public / host / participant).
- Realtime: souscription `postgres_changes` sur `live_rooms` dans un `useEffect` avec cleanup `removeChannel`, pour rafraîchir la liste en live.
- UI mobile-first, design system du projet (Poppins/Nunito, tokens HSL, `Card`, `Button`):
  - Header avec titre "Rooms en direct" + bouton **"Nouvelle room"** (ouvre `Dialog`).
  - Grille de `Card` (1 col mobile, 2 col md): titre, badge statut (`live` / `scheduled` / `ended`), host (toi / autre), `max_participants`, date de création.
  - Bouton **"Rejoindre"** → `navigate(\`/live/\${room.id}\`)`.
  - Si host: petit bouton "Terminer" (UPDATE `status='ended'`, `ended_at=now()`).
  - États: loading (Loader2), vide ("Aucune room pour le moment"), erreur (toast).

## 2. Modal de création
- `Dialog` shadcn avec `Form` (react-hook-form + zod):
  - `title` (text, requis, max 80)
  - `is_public` (Switch, défaut `true`)
  - `max_participants` (Input number, défaut 20, min 2 / max 100)
- À la soumission: `INSERT` dans `live_rooms` avec `host_id = user.id`, `livekit_room_name = 'room-' + crypto.randomUUID()`, `status = 'live'`, `started_at = now()`, puis `navigate(\`/live/\${data.id}\`)`.
- Toast succès/erreur via `sonner`.

## 3. Routing — `src/App.tsx`
- Ajouter route lazy: `<Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />`.
- Pas d'autre changement (la route `/live/:roomId` existe déjà).

## 4. Validation
- Aller sur `/rooms`, créer une room → redirection auto vers `/live/:id` et connexion LiveKit (valide encore les secrets via `livekit-token`).
- Revenir sur `/rooms` → la room créée apparaît avec statut `live`. Bouton "Terminer" fonctionne (disparaît / passe en `ended`).

## Notes techniques
- Pas de migration DB nécessaire: table, RLS et grants existent déjà; politique INSERT autorise `host_id = auth.uid()`.
- Aucun nouveau secret. Aucun nouvel package.
- Pas de lien depuis le menu principal dans ce lot — page accessible directement par URL (ajout au menu = lot séparé si souhaité).
