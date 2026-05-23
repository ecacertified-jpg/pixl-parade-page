# Plan — Page anniversaire : avatar, partage, commentaires, souvenirs audio

## 1. Avatar éditable dans la zone Vidéo de couverture
Sur `src/pages/BirthdayPage.tsx`, dans l'overlay du `CoverVideoCarousel` :
- Si `user?.id === page?.user_id`, rendre l'`Avatar` cliquable et superposer une petite icône stylo (`Pencil`) en bas à droite.
- Au clic → ouvre un `<input type="file" accept="image/*">` caché.
- Upload via le bucket `avatars` (chemin `${user.id}/cover-${ts}.jpg`), compression via `compressImage`, puis `update profiles set avatar_url = ...`.
- Toast de confirmation + mise à jour locale de `birthdayPerson.avatar_url`.
- Invalidation de l'OG image via `invalidateBirthdayOg`.

## 2. Album souvenir — bouton Commenter fonctionnel
Actuellement dans `MediaTile` et la lightbox, l'icône `MessageCircle` n'affiche qu'un compteur. À corriger :
- Sur la tuile : transformer l'icône en `<button>` qui ouvre la lightbox directement positionnée sur la zone réactions/commentaires (nouvel état `lightboxFocus = 'comments'`).
- Dans la lightbox : remplacer le compteur passif par un bouton qui scrolle/déplie un panneau de commentaires.
- Panneau commentaires : utiliser le hook existant `useComments` (déjà présent dans `src/hooks/`) avec `target_type='album_photo'` et `target_id=item.id`. Affichage : liste + champ d'envoi (auteur = user connecté, sinon CTA login).
- Si `useComments` ne supporte pas ce target_type, créer une table dédiée `album_photo_comments` (id, photo_id, user_id, author_name, content, created_at) avec RLS lecture publique sur pages actives + insert authentifié.

## 3. Bouton Partager sur tous les éléments
- Ajouter dans `MediaTile` un petit bouton `Share2` à côté de l'étoile/commentaire.
- Ajouter dans la lightbox un bouton `Share2` dans la barre d'actions bas (à côté de Download).
- Action : `navigator.share({ url, title })` si disponible, sinon copie du lien dans le presse-papier + toast. Le lien pointe vers `${page_url}#photo-${id}`.

## 4. Onglet SOUVENIRS — bouton « Ajouter un souvenir » audio + écrit

### 4.1 Base de données (migration)
Ajouter à `birthday_page_photos` :
- `memory_audio_url text`
- `memory_audio_duration integer` (secondes)
- (existant : `memory_text`, `media_type='memory'`)

Bucket Storage : utiliser le bucket public existant pour les médias album (créer policy d'upload authentifié sur le préfixe `memories/` si absent).

### 4.2 UI Onglet Souvenirs
Remplacer le bloc actuel `mainTab === "memories"` par :
- Header avec bouton **« + Ajouter un souvenir »** (CTA primaire).
- Au clic → ouvre un `Sheet` avec 2 modes (toggle) :
  - **Écrit** : Textarea (existant déplacé ici).
  - **Audio** : enregistreur style WhatsApp — bouton micro (appui maintenu ou tap pour démarrer/arrêter), timer, waveform simple, preview lecture, bouton renvoyer/envoyer. Utilise `MediaRecorder` (mime `audio/webm` ou `audio/mp4` selon support), upload Blob vers Storage, insert ligne avec `media_type='memory'` + `memory_audio_url` + `memory_audio_duration`.
- Limite : 2 min max, taille ≤ 5 Mo.

### 4.3 Liste des souvenirs (cartes)
Refondre l'affichage en cartes uniformes :
- Souvenir écrit : citation + auteur (existant).
- Souvenir audio : lecteur audio compact (play/pause, barre de progression, durée), avatar/nom auteur.
- Sous chaque carte : barre de réactions identique aux médias — étoile (favori), bouton commentaire (compteur + ouvre détail), partager, et `AlbumItemReactions` (likes/emojis). Réutilise `birthday_page_photo_favorites`, le système de réactions existant et le système de commentaires du point 2.

### 4.4 Détail souvenir
Au clic sur une carte → ouvre un `Dialog` plein écran (mobile) avec :
- Affichage du texte (grand format) ou lecteur audio agrandi.
- Auteur + date.
- Barre d'actions complète : favori, commentaire (panneau intégré), partager, `AlbumItemReactions`.
- Bouton supprimer si `canManage`.

## 5. Détails techniques
- Nouveau composant : `src/components/birthday/album/MemoryRecorder.tsx` (enregistreur audio réutilisable).
- Nouveau composant : `src/components/birthday/album/MemoryCard.tsx` (carte unifiée texte/audio).
- Nouveau composant : `src/components/birthday/album/MemoryDetailDialog.tsx`.
- Nouveau composant : `src/components/birthday/album/PhotoCommentsPanel.tsx` (réutilisé pour médias + souvenirs).
- Hook utilitaire : `src/hooks/useAlbumPhotoComments.ts` si la table dédiée est créée.
- Helper partage : `src/utils/shareAlbumItem.ts`.

## 6. Migration SQL prévue
```sql
ALTER TABLE birthday_page_photos
  ADD COLUMN IF NOT EXISTS memory_audio_url text,
  ADD COLUMN IF NOT EXISTS memory_audio_duration integer;

CREATE TABLE IF NOT EXISTS album_photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES birthday_page_photos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE album_photo_comments ENABLE ROW LEVEL SECURITY;
-- lecture publique si page active, insert utilisateur authentifié, delete par l'auteur
```

## 7. Hors scope
- Pas de modification du flux de partage social global ni de l'OG image (juste invalidation après changement d'avatar).
- Pas de transcription audio.
- Pas de changement de la lecture des vidéos de couverture.
