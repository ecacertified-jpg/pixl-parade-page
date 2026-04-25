## Objectif

1. **Performance** : les photos et vidéos uploadées sur la page d'anniversaire partagée s'affichent trop lentement (uploadées en pleine résolution, aucune compression, aucune miniature, vidéos chargées en entier dès l'affichage de la grille).
2. **Clarté UX** : le nom de l'auteur (uploader) est déjà présent sur chaque carte mais en 10px blanc sur dégradé noir — illisible. Le rendre clairement visible avec un avatar/badge pour que les invités comprennent qui peut modifier/supprimer un élément.

## Diagnostic

Dans `src/components/BirthdayAlbum.tsx` :
- `handlePhotoUpload` envoie le fichier brut directement vers le bucket `birthday-page-photos` (aucun appel à `compressImage`). Une photo iPhone de 4–8 Mo est servie telle quelle à tous les visiteurs.
- `handleVideoUpload` accepte jusqu'à 50 Mo sans compression ni génération de miniature (`video_thumbnail_url` reste `null`).
- Dans la grille, les vidéos sont rendues via `<video preload="metadata">` — le navigateur télécharge le header de chaque vidéo en parallèle (lent + coûteux mobile data).
- Le badge auteur (lignes 597-602) est un texte 10px blanc sur dégradé sombre — peu lisible et ne ressemble pas à une attribution claire.

## Plan d'implémentation

### 1. Compression côté client à l'upload (`BirthdayAlbum.tsx`)

**Photos** : avant upload, passer le fichier dans `compressImage` (déjà disponible dans `src/utils/compressImage.ts`) :
- `maxWidth: 1600`, `maxHeight: 1600`, `quality: 0.82`, `format: 'jpeg'`.
- Cible : ramener une photo 4–8 Mo à 200–500 Ko sans perte visible.

**Vidéos** : 
- Utiliser `compressVideo` (déjà disponible dans `src/utils/videoCompressor.ts`) avant upload pour cibler ~720p.
- Générer une **miniature JPEG** via `videoThumbnails.ts` (déjà présent), l'uploader dans le même bucket et stocker l'URL dans `video_thumbnail_url`.
- Garder la limite 50 Mo sur le fichier source mais viser ≤ 8 Mo après compression.

### 2. Affichage rapide des vidéos dans la grille

Dans le rendu `media_type === "video"` :
- Remplacer `<video preload="metadata">` par `<img src={item.video_thumbnail_url || fallback} loading="lazy" />` + bouton play overlay.
- La balise `<video>` n'est instanciée que dans la lightbox (au clic).
- Fallback : si `video_thumbnail_url` absent (anciens items), garder l'élément `<video>` actuel.

### 3. Lazy loading + dimensions

- Ajouter `loading="lazy"` + `decoding="async"` + `width`/`height` (ou `aspect-ratio` CSS déjà présent) sur toutes les `<img>` de la grille album pour éviter le reflow.
- Ajouter `fetchPriority="low"` sur les images au-delà de la première ligne.

### 4. Affichage clair de l'auteur sur chaque carte

Remplacer le bandeau actuel (lignes 596-602 de `BirthdayAlbum.tsx`) par :
- Un **chip pastille blanc/translucide** en bas-gauche de chaque carte avec :
  - petit avatar circulaire (initiale de `uploader_name` dans un cercle coloré, fond `primary/20`)
  - nom de l'auteur en `text-xs font-medium`
  - icône cadenas `Lock` (h-3) si l'utilisateur courant n'est PAS l'uploader (indique « tu ne peux pas modifier »)
  - icône `Pencil` (h-3) si l'utilisateur courant EST l'uploader (indique « tu peux modifier »)
- Style : `bg-white/85 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm`, lisible sur photo/vidéo/souvenir.
- Pour les souvenirs (qui n'ont pas de média), placer l'attribution en bas dans la carte avec un peu plus d'emphase.

Dans la **lightbox** : conserver "Par {uploader_name}" mais l'enrichir avec l'avatar + le même indicateur édition/cadenas.

### 5. Documentation mémoire

Mettre à jour `mem://features/birthday-pages/lifecycle-and-visibility` (section "Modération de l'album souvenir") pour documenter :
- Compression systématique à l'upload (photos 1600px / 0.82, vidéos 720p, génération miniature).
- Affichage de l'auteur via chip avatar + indicateur d'édition.

## Fichiers modifiés

- `src/components/BirthdayAlbum.tsx` (compression upload, miniature vidéo, lazy load, redesign du badge auteur dans la grille et la lightbox)
- `.lovable/mem/features/birthday-pages/lifecycle-and-visibility.md` (notes media performance + auteur visible)

## Hors-scope

- Pas de migration SQL (la colonne `video_thumbnail_url` existe déjà).
- Pas de signed URLs : le bucket est déjà public, les URLs publiques restent les plus rapides via CDN Supabase.
- Pas de re-traitement des médias historiques déjà uploadés en grande taille (on les laisse tels quels, seule la lazy-load les améliorera).
