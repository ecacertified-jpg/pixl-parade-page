

# Plan : Afficher la vidéo 9:16 complète en plein écran

## Problème

Actuellement, en plein écran, la vidéo garde `aspect-video` (16:9) et `object-cover`, ce qui recadre la vidéo originale au format portrait 9:16. Le contenu est donc coupé.

## Solution — `src/components/LandingVideoPlayer.tsx`

1. **Ajouter un état `isFullscreen`** qui écoute l'événement `fullscreenchange` du navigateur
2. **En mode normal** : garder `aspect-video object-cover` (aperçu paysage compact sur la landing page)
3. **En mode plein écran** : basculer vers `w-full h-full object-contain` avec fond noir — la vidéo 9:16 s'affiche intégralement sans recadrage, avec des bandes noires latérales

### Changements concrets

```tsx
// Nouvel état
const [isFullscreen, setIsFullscreen] = useState(false);

// Écouter fullscreenchange
useEffect(() => {
  const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
  document.addEventListener('fullscreenchange', onFsChange);
  return () => document.removeEventListener('fullscreenchange', onFsChange);
}, []);

// Container : fond noir en fullscreen
className={cn(
  "relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-lg cursor-pointer group",
  isFullscreen && "!max-w-none !rounded-none bg-black flex items-center justify-center"
)}

// Video : object-contain en fullscreen
className={cn(
  isFullscreen
    ? "w-full h-full object-contain"
    : "w-full aspect-video object-cover"
)}
```

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/LandingVideoPlayer.tsx` | État fullscreen + classes conditionnelles pour affichage 9:16 complet |

