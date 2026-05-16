
## Objectif

Quand on partage le lien d'une page d'anniversaire (Facebook, WhatsApp, X, LinkedIn…), l'aperçu doit afficher :

1. **La photo choisie par le propriétaire** dans son album souvenir (nouvelle action « Utiliser comme image de partage »).
2. **Sinon** : la première photo de l'album souvenir (la plus ancienne, triée par date d'ajout).
3. **Sinon seulement** : l'image générique « Joie de Vivre » actuelle (fallback final).

Le **message texte** copié/partagé reste strictement identique à aujourd'hui (`BirthdayPageShareButton` n'est pas touché).

## Comportement utilisateur

- Sur la page d'anniversaire, le propriétaire voit, sur chaque photo de l'album souvenir, une nouvelle option « Utiliser comme image de partage » (dans le menu `…` déjà présent à côté de Modifier / Supprimer).
- Une seule photo peut être marquée à la fois ; cliquer sur une nouvelle photo bascule la sélection.
- La photo sélectionnée affiche un petit badge `Image de partage` dans l'album pour qu'on la repère.
- Les visiteurs (non propriétaires) ne voient ni l'action ni le badge.
- Les vidéos et souvenirs texte ne sont pas éligibles (seules les photos `media_type = 'image'`).

## Comportement réseaux sociaux

- L'edge function `birthday-preview` (celle que les robots Facebook / WhatsApp scrappent) calcule l'image OG dans cet ordre :
  1. `birthday_pages.social_share_photo_id` → `birthday_page_photos.image_url` correspondante (si encore présente et de type image)
  2. Sinon : `SELECT image_url FROM birthday_page_photos WHERE birthday_page_id = … AND media_type = 'image' ORDER BY created_at ASC LIMIT 1`
  3. Sinon : `birthday_pages.cover_image_url` (bannière héro déjà utilisée par l'UI — conservée comme avant-dernier recours)
  4. Sinon : appel à `generate-birthday-og-image` (image JDV générée — comportement actuel)
- Le tampon `?v=` continue à être calculé à partir de `max(birthday_pages.updated_at, profiles.updated_at)`. Toute sélection / désélection / suppression de photo passera donc par un `UPDATE` qui met `updated_at` à jour, ce qui rafraîchit l'aperçu chez Facebook & co.

## Détails techniques

### Base de données

Nouvelle colonne sur `birthday_pages` :

```sql
ALTER TABLE public.birthday_pages
  ADD COLUMN social_share_photo_id uuid NULL
    REFERENCES public.birthday_page_photos(id) ON DELETE SET NULL;
```

- `ON DELETE SET NULL` : si la photo choisie est supprimée, la page retombe automatiquement sur le fallback.
- Un trigger léger force `updated_at = now()` quand `social_share_photo_id` change, pour invalider l'OG côté crawlers.
- Politique RLS : autoriser le propriétaire de la page (`auth.uid() = user_id`) à modifier cette colonne via les politiques d'UPDATE existantes ; aucun nouveau droit pour les autres.

### Frontend

- `src/components/BirthdayAlbum.tsx` :
  - Étendre `AlbumItem` avec un drapeau dérivé `isSocialCover` (calculé via prop `socialSharePhotoId`).
  - Ajouter une entrée `DropdownMenuItem` « Utiliser comme image de partage » (visible uniquement si `user?.id === pageOwnerUserId` et `media_type === 'image'`).
  - Handler : `update birthday_pages set social_share_photo_id = :id where id = :pageId and user_id = auth.uid()`, puis toast + remontée vers le parent via un nouveau callback `onSocialCoverChanged(photoId)`.
  - Afficher un badge `Image de partage` (icône `Share2`) sur la vignette sélectionnée.
- `src/pages/BirthdayPage.tsx` :
  - Charger `social_share_photo_id` dans la requête `birthday_pages` et le passer en prop à `BirthdayAlbum`.
  - Conserver le `<img cover_image_url>` du héros tel quel (aucun impact visuel sur la page).
- `src/hooks/useBirthdayPageBuilderStatus.ts` / `useBirthdayPages.ts` : pas de changement obligatoire (la colonne s'ajoute, n'est lue qu'à l'endroit qui en a besoin).

### Edge function `supabase/functions/birthday-preview/index.ts`

Remplacer le calcul actuel de `coverImage` par la cascade décrite ci-dessus, en effectuant en parallèle :

```ts
const [pageRes, photoRes] = await Promise.all([
  supabase.from('birthday_pages')
    .select('id, user_id, slug, celebration_year, cover_image_url, social_share_photo_id, updated_at')
    .eq('slug', slug).maybeSingle(),
  // requête de la 1ère photo (faite après si la page existe)
]);
```

puis selon `page.social_share_photo_id` :

- requête ciblée sur la photo sélectionnée si présente,
- sinon `birthday_page_photos` order by `created_at` ASC limit 1.

L'ETag continue de dépendre de `version` (déjà basé sur `updated_at`), donc rien à changer côté cache.

### Hors scope

- `BirthdayPageShareButton.tsx` : aucun changement (message texte préservé).
- `cover_image_url` : conservé tel quel pour l'UI ; pas d'unification avec la nouvelle sélection.
- Pages événements (`event-preview`) : non touchées (le besoin porte uniquement sur l'anniversaire).
- Pas de migration pour pré-remplir `social_share_photo_id` sur les pages existantes : elles bénéficieront automatiquement de la règle « première photo de l'album ».

## Fichiers touchés

- Migration : `supabase/migrations/<timestamp>_birthday_social_share_photo.sql`
- `supabase/functions/birthday-preview/index.ts`
- `src/components/BirthdayAlbum.tsx`
- `src/pages/BirthdayPage.tsx`
- `src/integrations/supabase/types.ts` (régénéré automatiquement après migration)
