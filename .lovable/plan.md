## Objectif

Dans `PageFeedCard`, gérer proprement toutes les vignettes médias (images **et** vidéos) cassées ou absentes :
- afficher un placeholder visuel cohérent (gradient occasion + icône) si l'URL est vide ou si l'image échoue à charger ;
- pour les vidéos, conserver l'overlay Play et permettre la lecture quand `videoUrl` existe ;
- supprimer définitivement l'icône "image cassée" du navigateur dans le fil.

## Changements

### 1. `src/hooks/usePagesFeed.ts`
- Ne plus exclure les médias sans miniature :
  - **Vidéos sans thumbnail** : retourner `{ url: '', type: 'video', videoUrl }` si `video_url` existe.
  - **Images sans `image_url`** : déjà filtrées, on garde ce comportement.
  - Appliquer dans les deux boucles (`birthday_page_photos` et `event_page_photos`).

### 2. `src/components/PageFeedCard.tsx`
- Ajouter `useState` + état local `brokenThumbs: Set<string>` (clé = `${page.id}-${index}`).
- Refactor de `renderThumb(m, className, key, extraCount?)` :
  - Si `m.url` est vide OU si la clé est dans `brokenThumbs` → rendre un placeholder :
    - fond `bg-gradient-to-br ${gradient}` ;
    - icône occasion centrée (`<span className="text-4xl drop-shadow">{icon}</span>`).
  - Sinon, rendre `<img>` avec `onError={() => setBrokenThumbs(prev => new Set(prev).add(key))}`.
  - Dans les deux cas, conserver l'overlay Play pour `m.type === 'video'` et le badge `+N`.
- Click sur une vignette :
  - Si `m.type === 'video' && m.videoUrl` → ouvrir un `VideoPlayer` (état `selectedVideo`).
  - Sinon → `handleNavigate()` (comportement actuel).
- Imports : ajouter `useState` et `VideoPlayer` depuis `@/components/VideoPlayer`.

## Hors périmètre

- Pas de modification des composants album internes des pages (`BirthdayPagePhotos`, `EventPagePhotos`).
- Pas de regénération côté backend des miniatures vidéo.
- Pas de changement RLS / requêtes SQL.

## Vérification

- `/home` : une page avec vidéo sans thumbnail affiche le placeholder coloré + icône, le bouton Play ouvre la vidéo.
- Une vignette image cassée (URL 404) bascule vers le placeholder au lieu de l'icône navigateur.
- Une vignette image valide reste intacte.
- Les grilles 2/3/4 médias conservent leurs proportions et le badge `+N`.
