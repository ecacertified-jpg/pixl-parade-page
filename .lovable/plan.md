# Fix "Erreur lors de l'envoi du souvenir"

## Root cause

In `src/components/FeedCardActions.tsx`, `handleSendMemory()` inserts a row into `birthday_page_photos` (and `event_page_photos`) with `media_type: "text"`.

However, the DB check constraint on `birthday_page_photos.media_type` only allows:

```
'image' | 'video' | 'memory'
```

So every souvenir sent from the feed card is rejected by Postgres, and the catch block shows "Erreur lors de l'envoi du souvenir".

The sibling component `BirthdayAlbum.tsx` already uses the correct value `"memory"` and works fine.

## Fix

In `src/components/FeedCardActions.tsx`, replace both occurrences of:

```ts
media_type: "text",
```

with:

```ts
media_type: "memory",
```

(once in the birthday branch, once in the event branch, lines ~127 and ~136).

No DB migration, no other code changes needed. The album list filters by `media_type === "memory"` so the new entries will appear immediately in the Souvenirs tab.

## Verification

1. As a logged-in user, open a birthday/event feed card.
2. Click "Souvenir", type a message, send.
3. Toast shows "Souvenir partagé ! ✍️" and the entry appears in the album's "Souvenirs" tab.
