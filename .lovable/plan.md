

# Plan : Album souvenir partage sur la page anniversaire virale

## Contexte actuel

La page `/birthday/:slug` supporte deja les **photos** (table `birthday_page_photos`, bucket `birthday-page-photos`). Mais elle ne supporte pas les **videos** ni les **souvenirs textuels** (anecdotes, memories). L'UI actuelle est une simple grille de photos sans concept d'album.

## Modifications

### 1. Migration SQL — Etendre `birthday_page_photos` pour supporter videos + souvenirs

Renommer conceptuellement en "album items" en ajoutant des colonnes a la table existante :

| Colonne ajoutee | Type | Description |
|-----------------|------|-------------|
| `media_type` | text | `'image'`, `'video'`, `'memory'` (defaut: `'image'`) |
| `video_url` | text | URL video (bucket ou YouTube/externe) |
| `video_thumbnail_url` | text | Miniature video |
| `memory_text` | text | Texte souvenir/anecdote (pour type `'memory'`) |

Pas de nouvelle table — on etend la table existante pour garder la simplicite.

Mise a jour du bucket `birthday-page-photos` pour accepter aussi les fichiers video (la config RLS/storage reste identique, les videos sont juste des fichiers supplementaires).

### 2. Refonte UI — Section "Album souvenir partage"

Transformer la section "Photos souvenirs" en **"Album souvenir partage"** avec :

- **Header album** : titre "Album souvenir de {prenom}", compteur (X photos, Y videos, Z souvenirs)
- **3 boutons d'ajout** :
  - "Ajouter une photo" (existant, conserve)
  - "Ajouter une video" (upload video ou lien YouTube)
  - "Ecrire un souvenir" (textarea pour anecdote/memory)
- **Grille mixte** : affiche photos, miniatures video (avec icone play), et cartes souvenir textuelles
- **Lightbox** : clic sur photo = vue plein ecran, clic sur video = lecture video
- **Chaque item** affiche le nom de l'auteur et la date

### 3. Composant `BirthdayAlbum.tsx`

Nouveau composant extrait de `BirthdayPage.tsx` pour gerer l'album :

- Props : `pageId`, `slug`, `firstName`, `user`
- Gere les 3 types de media (photo, video, souvenir)
- Upload video : meme logique que photo, bucket `birthday-page-photos`, accept `video/*`
- Souvenir : formulaire textarea + bouton envoyer, insere dans `birthday_page_photos` avec `media_type = 'memory'`
- Lightbox interne pour visualiser photos/videos en plein ecran

### 4. Partage de l'album

- Le bouton de partage existant (`BirthdayPageShareButton`) inclut deja le lien de la page
- Modifier le texte de partage pour mentionner l'album : "Ajoute tes photos, videos et souvenirs a l'album de {prenom} !"
- Chaque contributeur voit un toast l'invitant a partager apres avoir ajoute un element

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx_album_souvenir.sql` | Ajout colonnes `media_type`, `video_url`, `video_thumbnail_url`, `memory_text` |
| `src/components/BirthdayAlbum.tsx` | Nouveau — composant album complet |
| `src/pages/BirthdayPage.tsx` | Remplacer la section photos par `<BirthdayAlbum />` |
| `src/components/BirthdayPageShareButton.tsx` | Mise a jour du texte de partage |
| `src/integrations/supabase/types.ts` | Regenere apres migration |

## Boucle virale renforcee

```text
Sarah partage sa page → Amis voient l'album
  → "Ajouter une photo" → Creer un compte
    → Upload sa photo → Toast "Partage l'album !"
      → Partage sur WhatsApp → Nouveaux visiteurs
        → Ajoutent leurs souvenirs → Cycle continue
```

