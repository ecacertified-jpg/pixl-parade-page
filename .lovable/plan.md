## Constats

Après investigation des deux bugs :

### Bug 1 — Upload des vidéos de mariage échoue
La colonne `cover_video_library.schedule_kind` est de type **enum** `cover_video_schedule_kind`. Cet enum ne contient **que les valeurs anniversaire** (`greeting_*`, `calendar_event`, `birthday_*`). Les valeurs `wedding_day`, `wedding_morning`, `wedding_afternoon`, `wedding_evening`, `wedding_night` ont été ajoutées au code TypeScript mais **jamais à l'enum Postgres** → l'INSERT est rejeté avec une erreur enum → toast "Échec de l'upload".

### Bug 2 — Acceptation d'invitation impossible
L'edge function `accept-organizer-invite` existe dans le repo (`supabase/functions/accept-organizer-invite/index.ts`) mais **n'est pas déployée** (`curl` renvoie `404 NOT_FOUND`, aucun log existant). `supabase.functions.invoke()` retourne donc une erreur générique → fallback "Impossible d'accepter cette invitation".

Le token visible dans le screenshot (`6840e6da…61f`) existe bien en base avec `status='pending'`, donc la donnée est correcte ; seul le déploiement manque.

## Correctifs

### 1. Migration SQL — étendre l'enum
```sql
ALTER TYPE public.cover_video_schedule_kind ADD VALUE IF NOT EXISTS 'wedding_day';
ALTER TYPE public.cover_video_schedule_kind ADD VALUE IF NOT EXISTS 'wedding_morning';
ALTER TYPE public.cover_video_schedule_kind ADD VALUE IF NOT EXISTS 'wedding_afternoon';
ALTER TYPE public.cover_video_schedule_kind ADD VALUE IF NOT EXISTS 'wedding_evening';
ALTER TYPE public.cover_video_schedule_kind ADD VALUE IF NOT EXISTS 'wedding_night';
```
(les `ADD VALUE` doivent être exécutés hors transaction, je les passerai en migration en séparant les statements).

### 2. Déploiement de `accept-organizer-invite`
Re-déployer l'edge function existante. Aucun changement de code nécessaire — le fichier est déjà correct (JWT extraction, lookup via service role, update du `user_id` + `status='accepted'`).

### 3. Bonus log côté client
Dans `OrganizerAccept.tsx`, logger `error` brut dans la console (en plus du toast) pour faciliter le debug futur si un autre cas (token révoqué, etc.) survient.

## Hors périmètre
- Pas de modification de l'UI d'upload ni du flux d'invitation : ces couches sont correctes, seuls l'enum DB et le déploiement bloquent.
- Pas de changement aux RLS de `event_organizers` (l'edge function utilise la service role).
