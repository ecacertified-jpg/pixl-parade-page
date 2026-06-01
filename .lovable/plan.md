## Objectif

Recadrer la playlist du carrousel de couverture pour qu'elle reste strictement dans le contexte du moment (créneau horaire / fête calendaire / anniversaire), et faire remonter en priorité les vidéos peu ou jamais vues — uniquement à l'intérieur de leur propre créneau.

## Règles cibles

1. **Hors anniversaire & hors fête calendaire** : la playlist contient **uniquement** les vidéos programmées pour le créneau courant (`greeting_morning` / `_afternoon` / `_evening` / `_night`). Aucune vidéo d'un autre moment de la journée n'est ajoutée, même si elle est peu vue.
2. **Pendant une fête calendaire active** (et hors anniversaire) : la playlist contient **uniquement** les vidéos `calendar_event` actives ce jour-là (mêmes `event_key`/date). Les vidéos « bonjour/bonsoir » génériques sont retirées. Les vidéos d'autres fêtes ne remontent jamais hors de leur propre fête.
3. **Le jour de l'anniversaire** : seules les vidéos `birthday_*` jouent (créneau du moment + `birthday_day` génériques). Toutes les vidéos `calendar_event` et `greeting_*` sont ignorées — la priorité anniversaire est absolue.
4. **Tri intra-créneau (propriétaire uniquement)** : à l'intérieur du même créneau, on remonte d'abord les vidéos `view_count = 0`, puis `view_count ≤ 3`, puis le reste (tri stable par `display_order`/`priority`). Pour un visiteur non-propriétaire, l'ordre reste l'ordre d'origine.

## Implémentation

### `src/utils/coverVideoSchedule.ts`

Réécriture de `buildPlaylist` :

```text
if isBirthdayToday(birthday):
    items = pickFor(currentBirthdayKind) ∪ pickFor("birthday_day")
elif any calendar_event active today:
    items = pickFor("calendar_event", active today only)
else:
    items = pickFor(currentGreetingKind)
return dedupById(items)
```

- Suppression de la branche actuelle qui ajoute toujours `currentGreetingKind` en fin de liste → c'est elle qui fait apparaître les vidéos hors-contexte.
- Ajout d'un paramètre optionnel `viewCounts?: Record<string, number>` (clé = `video_id`). Quand fourni, `pickFor` applique un tri secondaire : `bucket(viewCount)` puis ordre d'origine, avec buckets `0 → 1`, `1-3 → 2`, `>3 → 3`.
- `isSpecialDayPlaylist` reste basé sur le contenu de la playlist retournée (inchangé fonctionnellement).

### `src/hooks/useCoverVideoPlaylist.ts`

- Nouveau paramètre `ownerId?: string | null` (transmis par `BirthdayPage` quand `user.id === birthday_pages.user_id`).
- Quand `ownerId` est défini et égal à l'utilisateur connecté, requête supplémentaire `birthday_page_cover_video_views` → `{ video_id, view_count }` pour cet `owner_id`, transformée en map `viewCounts`.
- `buildPlaylist(userVideos, library, birthday, now, viewCounts)`.
- `staleTime` court (30 s) pour que l'incrément RPC se reflète rapidement à la prochaine ouverture.

### `src/components/birthday/CoverVideoCarousel.tsx`

- Passe `isOwner` au hook `useCoverVideoPlaylist` via un nouveau prop pipeline (déjà reçu, juste à propager). Aucune autre modif logique : le tracking RPC existant continue d'alimenter `view_count`.

### `src/pages/BirthdayPage.tsx`

- Aucun changement si `isOwner` est déjà calculé et passé au carousel (cas actuel). Si le hook est aussi appelé en dehors du carousel, lui transmettre `ownerId` également.

## Hors périmètre

- Pas de changement de schéma DB ni de migration.
- Pas de changement du tracking côté lecture (déjà en place via `increment_cover_video_view`).
- Pas de modification du `CoverVideosManagerSheet` (la section « À (re)découvrir » reste telle quelle pour le propriétaire dans le sheet de gestion).
- Pas de changement admin (`AdminCoverVideos.tsx`).

## Fichiers touchés

- `src/utils/coverVideoSchedule.ts` (logique de scoping + tri par vues)
- `src/hooks/useCoverVideoPlaylist.ts` (fetch `viewCounts`, propagation)
- `src/components/birthday/CoverVideoCarousel.tsx` (propager `isOwner` au hook)
