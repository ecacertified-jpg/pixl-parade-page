

# Plan : Corriger le player vidéo sur mobile

## Problèmes identifiés

1. **Contrôles invisibles sur mobile** : Les boutons son/agrandissement utilisent `onMouseEnter`/`onMouseLeave` qui n'existent pas sur tactile — les contrôles ne s'affichent jamais.
2. **Vidéo masquée** : `object-cover` + `aspect-video` (16:9) coupe la vidéo si son ratio est différent. Il faut utiliser `object-contain` pour tout montrer.
3. **Interruptions de lecture** : La vidéo peut se bloquer sur mobile à cause du buffering. Ajouter `preload="auto"` et gérer les événements `waiting`/`playing` pour un meilleur feedback.

## Solution — `src/components/LandingVideoPlayer.tsx`

### Contrôles mobiles
- Remplacer `onMouseEnter`/`onMouseLeave` par un **tap pour afficher/masquer** avec auto-hide après 3 secondes
- Les boutons son et plein écran sont **toujours visibles** dans une barre semi-transparente en bas sur mobile (via `useIsMobile`)
- Sur desktop, garder le comportement hover existant

### Vidéo complète
- Changer `object-cover` en `object-contain` pour ne rien couper
- Ajouter un fond sombre derrière la vidéo pour les bandes latérales éventuelles

### Lecture fluide
- Ajouter `preload="auto"` sur la balise `<video>`
- Ajouter un indicateur de buffering (spinner) via les événements `waiting`/`playing`

## Fichier impacté

| Fichier | Changement |
|---------|-----------|
| `src/components/LandingVideoPlayer.tsx` | Contrôles tactiles, object-contain, preload, indicateur buffering |

