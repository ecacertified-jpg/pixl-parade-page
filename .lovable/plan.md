

# Plan : Corriger les contrôles mobiles et les interruptions vidéo

## Problèmes

1. **Contrôles invisibles sur mobile** : Les contrôles utilisent `onMouseEnter`/`onMouseLeave` — ces événements n'existent pas sur mobile tactile. Les boutons son/plein écran ne s'affichent jamais.
2. **Interruptions vidéo** : Le `preload` n'est pas défini (buffering insuffisant) et `crossOrigin` manque pour les URLs Supabase cross-origin.

## Solution — `src/components/LandingVideoPlayer.tsx`

### Contrôles mobiles : tap-to-reveal avec auto-masquage
- Remplacer `onMouseEnter`/`onMouseLeave` par un système mixte :
  - Desktop : conserver hover (`onMouseEnter`/`onMouseLeave`)
  - Mobile : `onClick` sur le conteneur affiche les contrôles pendant 3 secondes, puis les masque automatiquement via `setTimeout`
- Le tap sur le conteneur affiche les contrôles ; un second tap sur le bouton play/pause agit normalement
- Séparer le click play/pause du click "reveal controls" : premier tap = montrer contrôles, bouton play/pause = action

### Interruptions vidéo
- Ajouter `preload="auto"` sur le `<video>` pour forcer le pré-chargement complet
- Ajouter `crossOrigin="anonymous"` pour les fichiers Supabase (cross-origin)
- Gérer l'état de buffering avec les événements `onWaiting` / `onCanPlay` et afficher un spinner pendant le chargement

### Changements concrets

```tsx
// Nouveaux states
const [showControls, setShowControls] = useState(false);
const [isBuffering, setIsBuffering] = useState(false);
const hideTimerRef = useRef<NodeJS.Timeout>();

// Tap handler pour mobile
const handleContainerClick = () => {
  setShowControls(true);
  clearTimeout(hideTimerRef.current);
  hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
};

// Video element
<video
  preload="auto"
  crossOrigin="anonymous"
  onWaiting={() => setIsBuffering(true)}
  onCanPlay={() => setIsBuffering(false)}
  // ... existing props
/>

// Conteneur : hover pour desktop + click pour mobile
<div
  onMouseEnter={() => setShowControls(true)}
  onMouseLeave={() => setShowControls(false)}
  onClick={handleContainerClick}
>

// Boutons play/pause et bottom bar : toujours dans le DOM,
// visibilité contrôlée par showControls (hover OU tap)

// Spinner buffering overlay
{isBuffering && <Loader2 className="animate-spin" />}
```

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/LandingVideoPlayer.tsx` | Tap-to-reveal mobile, preload/crossOrigin, spinner buffering |

