

# Plan : Vidéo promotionnelle sur la landing page depuis Assets

## Principe

Le Super Admin uploade une vidéo nommée avec un préfixe spécifique (ex: `landing-video.*`) dans le bucket `assets` via l'onglet Assets existant. La landing page détecte automatiquement cette vidéo et l'affiche en autoplay sous le badge "Plateforme #1", dans un player intégré avec possibilité d'agrandir en plein écran.

## Modifications

### 1. `src/pages/Landing.tsx`

- Ajouter un hook `useEffect` qui requête le bucket `assets` pour trouver un fichier dont le nom commence par `landing-video` (MP4)
- Si une vidéo est trouvée, insérer un bloc vidéo entre le badge "Plateforme #1" et le titre `<h1>` :
  - `<video>` en autoplay, muted, loop, playsInline
  - Coins arrondis, ombre, ratio 16:9
  - Bouton pour agrandir (plein écran via `requestFullscreen()` ou modale)
  - Bouton play/pause visible au survol
- Si aucune vidéo n'est trouvée, rien ne change (pas d'espace vide)

### 2. `src/components/LandingVideoPlayer.tsx` (nouveau)

Composant dédié :
- Props : `videoUrl: string`
- Autoplay muted loop avec playsInline
- Overlay au survol : boutons play/pause + plein écran (icône Maximize)
- Mode plein écran via API native ou Dialog/modal avec vidéo en grand format
- Style : `rounded-2xl shadow-lg max-w-lg mx-auto` dans le hero

### 3. Aucune modification de l'AssetUploader

Le Super Admin utilise simplement l'onglet Assets existant pour uploader un fichier nommé `landing-video.mp4`. Pas besoin de UI spécifique — la convention de nommage suffit.

## Fichiers impactés

| Fichier | Changement |
|---------|-----------|
| `src/components/LandingVideoPlayer.tsx` | Nouveau — player vidéo autoplay avec plein écran |
| `src/pages/Landing.tsx` | Fetch vidéo depuis assets + affichage sous le badge |

