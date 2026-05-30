# Plan — Personnalisation des vidéos de couverture

## 1. Priorité anniversaire vs fête calendaire

**`src/utils/coverVideoSchedule.ts`** — Dans `buildPlaylist`, si `isBirthdayToday(birthday)` est vrai, on **ignore** les vidéos `calendar_event` du jour (au lieu de les ajouter). L'anniversaire prend toute la place ; les vidéos de fête calendaire reviennent les autres jours.

## 2. Compression auto > 25 Mo & trim > 30 s

Nouvelle fonction `prepareCoverVideoForUpload(file)` dans `src/utils/videoCompressor.ts` (ou utilitaire dédié `prepareCoverVideo.ts`) :

1. Lit la durée via `getVideoMetadata`.
2. Si `duration > 30s` → appelle `trimVideo(file, 0, 30)` (FFmpeg.wasm déjà présent).
3. Si `taille > 25 Mo` après trim → appelle le compresseur existant (`videoCompressor.ts`) en preset agressif (CRF ~30, 720p max, audio 96k) jusqu'à passer sous 25 Mo (1 passe suffit).
4. Retourne le `File` final + métriques (taille initiale/finale, durée).

**`CoverVideosManagerSheet.tsx`** — Remplace les `toast.error("trop lourd/long")` par cet appel avec une barre de progression (toast loader). Plafond dur conservé (par ex 200 Mo source) pour éviter les abus.

## 3. Tracking « peu visionnée / pas vue »

Le propriétaire de la page doit savoir quelles vidéos il n'a presque pas regardées. Tracking côté client (page-owner uniquement) :

- **Nouvelle table** `birthday_page_cover_video_views` :
  - `id`, `video_id` (FK `birthday_page_cover_videos`), `owner_id`, `view_count int default 0`, `last_viewed_at`, `created_at`. Unique `(video_id, owner_id)`.
  - GRANT + RLS : seul `owner_id = auth.uid()` peut lire/écrire ses lignes.
- **`CoverVideoCarousel`** — quand l'utilisateur courant est le propriétaire de la page (nouveau prop `isOwner: boolean` fourni par `BirthdayPage`), incrémenter la vue après ≥ 50 % de lecture via `supabase.rpc('increment_cover_video_view', { p_video_id })` (fonction `security definer` qui upsert + +1).
- **`CoverVideosManagerSheet.tsx`** — joindre les compteurs à la liste des vidéos. Pour chaque vidéo, afficher un badge :
  - `"Jamais vue"` si `view_count = 0`,
  - `"Peu vue"` si `view_count ≤ 3`.
  - Trier les vidéos d'un même créneau pour faire remonter en premier les non/peu vues.
- Ajouter un onglet/section en haut du sheet « À découvrir » qui liste agrégé toutes les vidéos `view_count ≤ 3` (perso + bibliothèque admin pertinente pour cette page), avec mini-player inline pour cliquer-lire.

## 4. Fêtes calendaires : champ « nom » + « date »

**`src/data/calendarEvents.ts`** (nouveau) — Catalogue partagé :

```ts
export interface CalendarEventPreset {
  key: string;          // "saint_valentin"
  label: string;        // "Saint Valentin"
  month?: number;       // 2
  day?: number;         // 14  (null pour fêtes mobiles → user saisit)
  movable?: boolean;    // true pour Pâques, Fête des Mères…
}
```

Liste : Saint Valentin (14/02), Pâques (mobile), Noël (25/12), Nouvel An (1/1), Fête des Mères (mobile), Fête des Pères (mobile), Journée Mondiale des Femmes (8/3), Toussaint (1/11), Aïd (mobile), Tabaski (mobile), Ramadan (mobile)…

**DB migration** — ajouter `event_key text` et `event_label text` sur :
- `public.cover_video_library`
- `public.birthday_page_cover_videos`

(rétrocompatibles, nullables ; `calendar_month/day` restent pour la résolution).

**`AdminCoverVideos.tsx`** — Quand `kind === "calendar_event"`, remplacer les inputs bruts par :
- `Select` des `CalendarEventPreset` (+ option « Autre »).
- Champ « Date » (Mois/Jour) **pré-rempli** depuis le preset si connu, **éditable** sinon. Pour fêtes mobiles, date obligatoire à saisir chaque année par admin.
- Insère `event_key`, `event_label`, `calendar_month`, `calendar_day`.

**`CoverVideosManagerSheet.tsx`** — Pour la ligne « Fête calendaire » du propriétaire, mêmes contrôles avant l'upload (un petit popover/inline form au clic sur « Uploader » du créneau fête).

**`coverVideoSchedule.ts`** — `isCalendarEventActive` inchangé (toujours basé sur month/day), mais l'UI affiche `event_label` au lieu du label générique « Fête calendaire ».

## Détails techniques

- **RPC compteur de vues** :
  ```sql
  CREATE FUNCTION public.increment_cover_video_view(p_video_id uuid)
  RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  BEGIN
    INSERT INTO birthday_page_cover_video_views(video_id, owner_id, view_count, last_viewed_at)
    VALUES (p_video_id, auth.uid(), 1, now())
    ON CONFLICT (video_id, owner_id)
    DO UPDATE SET view_count = birthday_page_cover_video_views.view_count + 1,
                  last_viewed_at = now();
  END $$;
  ```
- **`isOwner` dans le carousel** : `BirthdayPage` connaît déjà `user.id` et `birthday_pages.user_id`, on transmet le booléen.
- Pas de changement aux edge functions ni à `birthday-wishes`.

## Fichiers touchés

- `supabase/migrations/<new>.sql` (vues table + grants + RLS + RPC + colonnes `event_key/label`)
- `src/utils/coverVideoSchedule.ts` (priorité)
- `src/utils/prepareCoverVideo.ts` (nouveau, trim+compress)
- `src/utils/videoCompressor.ts` (préset agressif si pas déjà exposé)
- `src/data/calendarEvents.ts` (nouveau)
- `src/components/birthday/CoverVideosManagerSheet.tsx`
- `src/components/birthday/CoverVideoCarousel.tsx`
- `src/hooks/useCoverVideoPlaylist.ts` (passer `event_label`, jointure compteurs en mode owner)
- `src/pages/Admin/AdminCoverVideos.tsx`
- `src/pages/BirthdayPage.tsx` (transmettre `isOwner`)

## Hors périmètre

- Pas de calcul automatique des dates de fêtes mobiles (Pâques, Aïd) — l'admin/le user saisit la date pour les fêtes sans date fixe.
- Pas de notification « tu as une nouvelle vidéo à découvrir » — uniquement l'UI dans le sheet de gestion.
*** End Patch
