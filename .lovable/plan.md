
# Plan : Corriger les images cassées dans le fil d'actualités

## Problème

Les cartes du fil affichent des images cassées car `album_preview` inclut :
- **5 fichiers .mp4** (vidéos) rendus dans des balises `<img>` → image cassée
- **2 entrées avec `image_url` vide** → image cassée

## Solution

Filtrer les URLs dans `usePagesFeed.ts` pour exclure les vidéos et les URLs vides de `album_preview`.

## Fichier concerné

| Fichier | Changement |
|---------|------------|
| `src/hooks/usePagesFeed.ts` | Filtrer `album_preview` : exclure `.mp4`/`.webm`/`.mov` et URLs vides |

## Changement technique

Dans les deux boucles (birthday + event), remplacer :
```typescript
album_preview: photos.slice(0, 4).map((p: any) => p.image_url),
```
par :
```typescript
const imageOnly = photos
  .filter((p: any) => p.image_url && !p.image_url.match(/\.(mp4|webm|mov|avi)$/i))
  .map((p: any) => p.image_url);
// ...
album_preview: imageOnly.slice(0, 4),
album_count: imageOnly.length,
```

Cela filtre les vidéos et les URLs vides **avant** de construire la preview, corrigeant les images cassées sans toucher au reste du flux.
