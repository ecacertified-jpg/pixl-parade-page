# Fix carte page d'anniversaire dans le fil d'actualité

## Problèmes constatés

1. **Espaces vides** dans `PageFeedCard.tsx` : la grille `grid-cols-2` avec 3 photos laisse une 4e cellule vide (visible sur la capture). Idem 1 photo en `grid-cols-1` aspect-square = très haut, pas harmonieux.
2. **Vidéos invisibles** : `usePagesFeed.ts` filtre les médias par `image_url` et exclut explicitement `.mp4/.webm/.mov/.avi`. Les vidéos (`media_type='video'`, `video_thumbnail_url`, `video_url`) ne sont jamais ajoutées à `album_preview`.

## Changements

### 1. `src/hooks/usePagesFeed.ts`
- Étendre `FeedPage.album_preview` de `string[]` à `Array<{ url: string; type: 'image' | 'video'; videoUrl?: string }>`.
- Construire `album_preview` à partir des photos ET vidéos :
  - Image : `{ url: image_url, type: 'image' }`
  - Vidéo : `{ url: video_thumbnail_url || cover/fallback, type: 'video', videoUrl: video_url }`
- Appliquer aux `birthday_page_photos` et `event_page_photos`.

### 2. `src/components/PageFeedCard.tsx`
- Adapter au nouveau type `album_preview`.
- Sur chaque vignette de type `video` : overlay sombre + icône Play (lucide `Play`) centrée pour signaler la vidéo.
- Réécrire le bloc grille pour combler les vides selon le nombre N d'éléments :
  - **N = 1** : aspect-video pleine largeur (au lieu de aspect-square étiré).
  - **N = 2** : 2 colonnes égales aspect-square.
  - **N = 3** : layout asymétrique — 1 grand à gauche (col-span 1, row-span 2) + 2 petits empilés à droite, conteneur aspect-square. Plus aucun vide.
  - **N ≥ 4** : grille 2×2 actuelle (4 vignettes).
- Le compteur `+N` (déjà via badges photo/vidéo dans `FeedCardActions`) reste inchangé ; éventuellement ajouter un overlay `+X` sur la dernière vignette si `album_count > 4`.

### 3. Lecture vidéo (hors scope minimal)
- Le clic sur la vignette continue d'ouvrir la page (`/birthday/:slug` ou `/event/:slug`) où la lecture vidéo est déjà gérée. Pas de lecteur inline ajouté ici pour rester focalisé sur l'affichage harmonieux + visibilité des vidéos.

## Détails techniques

- Type :
  ```ts
  type FeedMedia = { url: string; type: 'image' | 'video'; videoUrl?: string };
  album_preview: FeedMedia[];
  ```
- Layout N=3 (Tailwind) :
  ```text
  grid grid-cols-2 grid-rows-2 gap-1 aspect-square
  [item 0] col-span-1 row-span-2
  [item 1] col-span-1 row-span-1
  [item 2] col-span-1 row-span-1
  ```
- Overlay vidéo :
  ```tsx
  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
    <Play className="h-10 w-10 text-white drop-shadow" fill="white" />
  </div>
  ```
  vignette wrapper en `relative`.

## Hors scope
- Pas de changement DB ni RLS.
- Pas de modification de `FeedCardActions` ni des compteurs.
- Pas de lecteur vidéo inline.