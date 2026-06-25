
## 1. Onglet « Clients » — bouton « Voir » (œil)

`src/components/organization/ClientsManager.tsx`
- Remplacer le bouton existant `ExternalLink + "Page"` par un bouton icône **œil** (`Eye` de lucide-react) avec label `Voir`.
- N'afficher ce bouton **que lorsque la page est réclamée** (`claimed=true && slug`). Aujourd'hui il s'affiche dès qu'un slug existe.
- Positionnement : juste après le bouton WhatsApp dans la barre d'actions.

## 2. Hero événement harmonisé avec la page anniversaire

Objectif : faire en sorte que la page d'événement (mariage, baptême, diplôme…) présente l'avatar du créateur (ou couple pour un mariage), le titre et le compte à rebours **à la même place et avec le même style** que `BirthdayPage` (avatar circulaire chevauchant le bas de la vidéo de couverture + nom + compteur en pilule sous le nom).

`src/components/event/EventHeroOverlay.tsx`
- Refactor pour répliquer la mise en page de `BirthdayPage` :
  - Avatar(s) centré(s) en chevauchement bas avec anneau primaire (mariage → 2 avatars + cœur, autres occasions → 1 avatar).
  - Titre `Poppins bold` sous l'avatar (ex. `💍 Mariage de Gnol & Kady`).
  - **Compte à rebours déplacé dans l'overlay** (juste sous le titre) en utilisant `EventCountdown` (même pilule que `BirthdayCountdown`).

`src/pages/EventPage.tsx`
- Supprimer le `CountdownWidget` rendu en dessous du hero (lignes 262-264) — il fait double emploi.

## 3. Countdown « Terminé » quand la date est passée

`src/components/EventCountdown.tsx`
- Aujourd'hui la branche `diff <= 0` affiche `🎉 C'est aujourd'hui !` durant toute la journée et au-delà.
- Nouvelle logique :
  - Si on est **le jour J** (même `YYYY-MM-DD` que la date locale) → `🎉 C'est aujourd'hui !`
  - Si la date est **strictement passée** → `✅ Terminé`.

## 4. Section « Vœux & messages » → modèle anniversaire (`MessageWall`)

Le `MessageWall` actuel est hardcodé sur `birthday_page_photos`/messages via le hook `useBirthdayMessages`. Pour le réutiliser sur une page d'événement, je rends le composant **polymorphe** :

- `src/hooks/useBirthdayMessages.ts` (ou wrapper) : ajouter paramètre `pageKind: 'birthday' | 'event'` qui choisit la table (`birthday_messages` vs `event_wishes_messages`) et la clé FK (`birthday_page_id` vs `event_page_id`).
- `src/components/birthday/messages/MessageWall.tsx` : nouveau prop `pageKind` (défaut `birthday`), propagé au hook et à la modale `Créer ma carte` / `Nouveau post`.

`src/pages/EventPage.tsx`
- Remplacer le bloc `Card "Vœux & messages"` (lignes 360-402) par `<MessageWall pageKind="event" pageId={page.id} slug={slug} firstName={page.title} pageOwnerUserId={page.creator_id} />`.
- Supprimer les états locaux `messages`, `newMessage`, `sendingMessage`, le fetch initial et `handleSendMessage` devenus inutiles.

## 5. « Album Souvenir » → modèle anniversaire (`BirthdayAlbumFlickr`)

Même approche polymorphe. Le composant `BirthdayAlbumFlickr` cible aujourd'hui les tables `birthday_page_photos` et `birthday_page_photo_favorites` + bucket `birthday-page-photos` + colonne `birthday_pages.social_share_photo_id`.

Plan :
- Introduire une **petite couche de config** dans `BirthdayAlbumFlickr.tsx` :
  ```ts
  const CFG = pageKind === 'event'
    ? { photosTable: 'event_page_photos', favTable: 'event_page_photo_favorites',
        fkColumn: 'event_page_id', pagesTable: 'event_pages', bucket: 'event-page-photos' }
    : { /* défauts birthday existants */ };
  ```
  et remplacer chaque `.from('birthday_page_photos')` / FK / bucket par `CFG.*`.
- Nouveau prop `pageKind: 'birthday' | 'event'` (défaut `birthday`).
- Vérifier que `event_page_photos` et `event_page_photo_favorites` existent ; sinon créer la table favorites + bucket via migration (`GRANT` + RLS basés sur ownership de la page).

`src/pages/EventPage.tsx`
- Remplacer `<EventAlbum … />` (ligne 406) par `<BirthdayAlbumFlickr pageKind="event" pageId={page.id} slug={slug} firstName={page.title} user={user} items={albumItems} … pageOwnerUserId={page.creator_id} socialSharePhotoId={(page as any).social_share_photo_id ?? null} … />`.
- Conserver la logique de merge `event_page_photos + birthday_page_photos du créateur` côté `reloadAlbum`.

## Points techniques

- Aucune modification des composants flottants (Share / Chat IA).
- Les commentaires, l'audio, les favoris, le partage social et le `social_share_photo_id` sont automatiquement disponibles côté événement grâce à la config table-aware.
- Tables/bucket manquants côté événement : ajoutés via migration Supabase (avec `GRANT` + RLS calquées sur les tables anniversaire) — uniquement si elles n'existent pas déjà.
- Le bouton « Nouveau post » du `MessageWall` réutilise la modale `Créer ma carte` existante (aucun nouveau composant).

## Fichiers touchés (résumé)

- `src/components/organization/ClientsManager.tsx`
- `src/components/event/EventHeroOverlay.tsx`
- `src/components/EventCountdown.tsx`
- `src/components/birthday/messages/MessageWall.tsx` + `src/hooks/useBirthdayMessages.ts`
- `src/components/birthday/album/BirthdayAlbumFlickr.tsx`
- `src/pages/EventPage.tsx`
- (optionnel) nouvelle migration Supabase pour `event_page_photo_favorites` + bucket `event-page-photos` si absents.
