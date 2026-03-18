

# Plan : Accélérer le chargement des pages

## Diagnostic

Le problème vient de la combinaison de trois couches qui s'enchaînent séquentiellement :

1. **`AnimatedRoutes`** utilise `AnimatePresence mode="wait"` — l'ancienne page doit **terminer son animation de sortie** (250ms) avant que la nouvelle page ne commence à se monter
2. **`Suspense` + `LoadingTransition`** — une fois l'ancienne page sortie, le chunk JS lazy doit être téléchargé, pendant ce temps un spinner s'affiche avec sa propre animation d'entrée (200ms + délais)
3. **`ProtectedRoute`** — attend `loading` de AuthContext (vérification session Supabase) avant d'afficher quoi que ce soit, montrant un spinner h-32 w-32 pendant ce temps

Résultat : **page blanche/skeleton pendant 500ms-2s+** à chaque navigation.

## Changements proposés

### 1. `src/components/transitions/AnimatedRoutes.tsx` — Supprimer le blocage `mode="wait"`

Remplacer `AnimatePresence mode="wait"` par `mode="popLayout"` ou simplement retirer `AnimatePresence` et les animations d'entrée/sortie. La nouvelle page se monte **immédiatement** sans attendre la sortie de l'ancienne.

Concrètement : simplifier le composant pour qu'il rende directement `<Routes location={location}>{children}</Routes>` sans wrapper `motion.div` ni `AnimatePresence`. Les pages apparaissent instantanément.

### 2. `src/components/transitions/LoadingTransition.tsx` — Rendre le fallback minimal

Remplacer le fallback animé (motion.div + spinner + texte "Chargement...") par un simple `div` vide ou un indicateur ultra-léger sans animation Framer Motion, pour que le Suspense fallback ne "bloque" pas visuellement.

### 3. `src/components/ProtectedRoute.tsx` — Réduire le spinner de chargement auth

Remplacer le gros spinner `h-32 w-32` par un indicateur minimal (ou rien du tout si le loading est bref), pour éviter un flash de spinner massif.

### 4. Préchargement des routes fréquentes (`src/App.tsx`)

Ajouter un préchargement des chunks les plus utilisés (Dashboard, Home, Shop) au `onIdle` ou après le premier rendu de Landing, pour que ces pages soient déjà en cache quand l'utilisateur navigue.

## Fichiers modifiés

- `src/components/transitions/AnimatedRoutes.tsx` — simplifier (supprimer AnimatePresence mode="wait")
- `src/components/transitions/LoadingTransition.tsx` — fallback minimal
- `src/components/ProtectedRoute.tsx` — spinner réduit
- `src/App.tsx` — préchargement des routes fréquentes

